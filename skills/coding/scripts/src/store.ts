// SQLite is the durable envelope and the write lock. The rules live in protocol.ts.
import { DatabaseSync } from "node:sqlite"
import { SCHEMA, transition, type Command, type Event, type Notification, type State } from "./protocol.ts"

export class StoreError extends Error {}

const CREATE = [
  `CREATE TABLE ledger (id INTEGER PRIMARY KEY CHECK (id = 1), schema INTEGER NOT NULL, state TEXT NOT NULL)`,
  `CREATE TABLE events (seq INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, actor TEXT NOT NULL, command TEXT NOT NULL, row TEXT NOT NULL, note TEXT NOT NULL)`,
]

export interface Snapshot {
  readonly state: State
  readonly events: readonly Event[]
}

export interface Mutation extends Snapshot {
  readonly before: State
  readonly notifications: readonly Notification[]
}

function open(path: string): DatabaseSync {
  const database = new DatabaseSync(path)
  database.exec("PRAGMA busy_timeout = 5000")
  return database
}

function loadState(database: DatabaseSync, path: string): State {
  const row = database.prepare("SELECT schema, state FROM ledger WHERE id = 1").get() as { schema: number; state: string } | undefined
  if (!row) throw new StoreError(`${path} holds no ledger`)
  if (row.schema !== SCHEMA) throw new StoreError(`${path} was written by ledger schema ${row.schema}; this script is schema ${SCHEMA}. Finish the run with its pinned script under bin/`)
  return JSON.parse(row.state) as State
}

function loadEvents(database: DatabaseSync): Event[] {
  return database.prepare("SELECT at, actor, command, row, note FROM events ORDER BY seq").all() as unknown as Event[]
}

function insertEvents(database: DatabaseSync, events: readonly Event[]): void {
  const insert = database.prepare("INSERT INTO events (at, actor, command, row, note) VALUES (?, ?, ?, ?, ?)")
  for (const event of events) insert.run(event.at, event.actor, event.command, event.row, event.note)
}

export function create(path: string, state: State, event: Event): void {
  const database = open(path)
  try {
    database.exec("BEGIN IMMEDIATE")
    for (const statement of CREATE) database.exec(statement)
    database.prepare("INSERT INTO ledger (id, schema, state) VALUES (1, ?, ?)").run(SCHEMA, JSON.stringify(state))
    insertEvents(database, [event])
    database.exec("COMMIT")
  } catch (error) {
    database.exec("ROLLBACK")
    throw error
  } finally {
    database.close()
  }
}

export function read(path: string): Snapshot {
  const database = open(path)
  try {
    return { state: loadState(database, path), events: loadEvents(database) }
  } finally {
    database.close()
  }
}

/**
 * Build the commands from the state read under the write lock, apply them in
 * order, and store the result. The whole batch lands or none of it does.
 */
export function mutate(path: string, build: (state: State) => Command | readonly Command[]): Mutation {
  const database = open(path)
  try {
    database.exec("BEGIN IMMEDIATE")
    const before = loadState(database, path)
    const built = build(before)
    const commands = Array.isArray(built) ? built : [built as Command]
    let state = before
    const events: Event[] = []
    const notifications: Notification[] = []
    for (const command of commands) {
      const result = transition(state, command)
      if (!result.ok) throw new StoreError(result.error)
      state = result.state
      events.push(...result.events)
      notifications.push(...result.notifications)
    }
    database.prepare("UPDATE ledger SET state = ? WHERE id = 1").run(JSON.stringify(state))
    insertEvents(database, events)
    database.exec("COMMIT")
    return { before, state, events: loadEvents(database), notifications }
  } catch (error) {
    database.exec("ROLLBACK")
    throw error
  } finally {
    database.close()
  }
}
