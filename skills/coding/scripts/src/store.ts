// SQLite owns durability and serialization. Domain refusals live in protocol.ts.
import { DatabaseSync } from "node:sqlite"
import { SCHEMA, transition, type Actor, type Command, type Event, type Moment, type State } from "./protocol.ts"
import { workSignals } from "./work.ts"

export class StoreError extends Error {}
export type WorkVersions = Record<Actor, Record<string, number>>
export interface Snapshot { readonly state: State; readonly events: readonly Moment[]; readonly workVersions: WorkVersions }
export interface Mutation extends Snapshot { readonly before: State; readonly path: string }
const CREATE = [
  "CREATE TABLE ledger (id INTEGER PRIMARY KEY CHECK(id=1), schema INTEGER NOT NULL, state TEXT NOT NULL)",
  "CREATE TABLE events (seq INTEGER PRIMARY KEY AUTOINCREMENT, revision INTEGER NOT NULL, event TEXT NOT NULL)",
  "CREATE TABLE work_versions (actor TEXT NOT NULL, key TEXT NOT NULL, version INTEGER NOT NULL, PRIMARY KEY(actor,key))",
]
function open(path: string, readOnly = false): DatabaseSync {
  const database = new DatabaseSync(path, { readOnly })
  // Contending CLI invocations wait for the short local transaction, then fail visibly.
  try {
    database.exec("PRAGMA busy_timeout=5000")
    return database
  } catch (error) { database.close(); throw error }
}
function loadState(db: DatabaseSync, path: string): State {
  const row = db.prepare("SELECT schema,state FROM ledger WHERE id=1").get() as { schema: number; state: string } | undefined
  if (!row) throw new StoreError(`${path} holds no ledger`)
  if (row.schema !== SCHEMA) throw new StoreError(`${path} uses schema ${row.schema}; this helper is schema ${SCHEMA}. Use the old run's pinned helper; no migration was performed`)
  const state = JSON.parse(row.state) as State
  if (state.schema !== SCHEMA) throw new StoreError("ledger schema and state disagree")
  return state
}
function snapshot(db: DatabaseSync, path: string): Snapshot {
  const state = loadState(db, path)
  const rows = db.prepare("SELECT seq,revision,event FROM events ORDER BY seq").all() as { seq: number; revision: number; event: string }[]
  const events = rows.map((row): Moment => ({ ...JSON.parse(row.event) as Event, sequence: row.seq, revision: row.revision }))
  const workVersions: WorkVersions = Object.fromEntries(Object.keys(state.names).map((actor) => [actor, {}]))
  for (const row of db.prepare("SELECT actor,key,version FROM work_versions").all() as { actor: string; key: string; version: number }[]) (workVersions[row.actor] ??= {})[row.key] = row.version
  return { state, events, workVersions }
}
function events(db: DatabaseSync, entries: readonly Event[], state: State): void {
  const insert = db.prepare("INSERT INTO events(revision,event) VALUES (?,?)")
  for (const event of entries) insert.run(state.revision, JSON.stringify(event))
}
function versions(db: DatabaseSync, before: State | null, after: State): void {
  const seq = (db.prepare("SELECT MAX(seq) AS seq FROM events").get() as { seq: number }).seq
  const write = db.prepare("INSERT INTO work_versions VALUES (?,?,?) ON CONFLICT(actor,key) DO UPDATE SET version=excluded.version")
  for (const actor of Object.keys(after.names)) {
    const previous = new Map(before ? workSignals(before, actor).map((signal) => [signal.key, signal.basis]) : [])
    const current = new Map(workSignals(after, actor).map((signal) => [signal.key, signal.basis]))
    for (const key of new Set([...previous.keys(), ...current.keys()])) if (previous.has(key) !== current.has(key) || previous.get(key) !== current.get(key)) write.run(actor, key, seq)
  }
}
export function create(path: string, state: State, event: Event = { at: state.scope.at, actor: "master", command: "init", row: "", note: state.goal }): void {
  if (state.schema !== SCHEMA) throw new StoreError("cannot create a store for another schema")
  const db = open(path)
  try {
    db.exec("BEGIN IMMEDIATE")
    for (const sql of CREATE) db.exec(sql)
    db.prepare("INSERT INTO ledger VALUES (1,?,?)").run(SCHEMA, JSON.stringify(state))
    events(db, [event], state); versions(db, null, state); db.exec("COMMIT")
  } catch (error) { if (db.isTransaction) db.exec("ROLLBACK"); throw error } finally { db.close() }
}
export function read(path: string): Snapshot {
  const db = open(path, true)
  try { db.exec("BEGIN"); const result = snapshot(db, path); db.exec("COMMIT"); return result } finally { db.close() }
}
/** The command batch lands with its complete evidence bytes and events, or not at all. */
export function mutate(path: string, build: (state: State) => Command | readonly Command[]): Mutation {
  const db = open(path)
  try {
    db.exec("BEGIN IMMEDIATE")
    const before = loadState(db, path), built = build(before), commands = Array.isArray(built) ? built : [built as Command]
    let state = before
    for (const command of commands) {
      const result = transition(state, command)
      if (!result.ok) throw new StoreError(result.error)
      events(db, result.events, result.state); versions(db, state, result.state); state = result.state
    }
    db.prepare("UPDATE ledger SET state=? WHERE id=1").run(JSON.stringify(state))
    const result = { ...snapshot(db, path), before, path }
    db.exec("COMMIT"); return result
  } catch (error) { if (db.isTransaction) db.exec("ROLLBACK"); throw error } finally { db.close() }
}
