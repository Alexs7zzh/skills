// SQLite is the durable envelope and write lock. Domain rules live in protocol.ts.
import { DatabaseSync } from "node:sqlite"
import { dirname, resolve } from "node:path"
import { SCHEMA, freshReviews, situations, transition, type Actor, type Command, type Event, type Moment, type Notification, type State } from "./protocol.ts"

export class StoreError extends Error {}

// `situations` is JSON: each actor's situation once the event had landed, from protocol.ts.
const CREATE = [
  `CREATE TABLE ledger (id INTEGER PRIMARY KEY CHECK (id = 1), schema INTEGER NOT NULL, state TEXT NOT NULL)`,
  `CREATE TABLE events (seq INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, actor TEXT NOT NULL, command TEXT NOT NULL, row TEXT NOT NULL, note TEXT NOT NULL, situations TEXT NOT NULL)`,
  `CREATE TABLE deliveries (id INTEGER PRIMARY KEY AUTOINCREMENT, record TEXT NOT NULL)`,
]

export type DeliveryOutcome = "pending" | "unconfirmed" | "accepted" | "printed" | "superseded"

export interface DeliveryUpdate {
  readonly at: string
  readonly actor: Actor
  readonly outcome: DeliveryOutcome
  readonly note: string
}

export interface Delivery {
  readonly id: string
  readonly sender: Actor
  readonly successor: Actor
  readonly to: Actor
  readonly address: string
  readonly message: string
  readonly updates: readonly DeliveryUpdate[]
}

export function deliveryOutcome(delivery: Delivery): DeliveryOutcome {
  return delivery.updates.at(-1)!.outcome
}

export function unsettled(delivery: Delivery): boolean {
  return ["pending", "unconfirmed"].includes(deliveryOutcome(delivery))
}

export interface Snapshot {
  readonly state: State
  readonly events: readonly Moment[]
  readonly deliveries: readonly Delivery[]
}

export interface Mutation extends Snapshot {
  readonly before: State
  readonly path: string
  readonly notifications: readonly Delivery[]
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

function loadEvents(database: DatabaseSync): Moment[] {
  const rows = database.prepare("SELECT at, actor, command, row, note, situations FROM events ORDER BY seq").all() as unknown as (Event & { situations: string })[]
  return rows.map((row) => ({ ...row, situations: JSON.parse(row.situations) as Moment["situations"] }))
}

function loadDeliveries(database: DatabaseSync): Delivery[] {
  const rows = database.prepare("SELECT id, record FROM deliveries ORDER BY id").all() as unknown as { id: number; record: string }[]
  return rows.map(({ id, record }) => ({ ...JSON.parse(record) as Omit<Delivery, "id">, id: `D-${id}` }))
}

function insertDeliveries(database: DatabaseSync, path: string, before: State, command: Command, messages: readonly Notification[]): Delivery[] {
  const successor = command.actor === "reader" && "id" in command
    ? freshReviews(before).find((review) => review.row === command.id)?.arranger ?? "master"
    : "master"
  return messages.map((notification) => {
    const record: Omit<Delivery, "id"> = {
      sender: command.actor, successor, to: notification.to, address: before.names[notification.to] || notification.to,
      message: `Run directory: ${JSON.stringify(dirname(resolve(path)))}; recipient seat: ${notification.to}\n${notification.message}`,
      updates: [{ at: command.at, actor: command.actor, outcome: "pending", note: `saved with ${command.type}` }],
    }
    const inserted = database.prepare("INSERT INTO deliveries (record) VALUES (?)").run(JSON.stringify(record))
    const id = `D-${inserted.lastInsertRowid}`
    const identified = { ...record, message: `${record.message}\nDelivery id: ${id}; sender seat: ${command.actor}` }
    database.prepare("UPDATE deliveries SET record = ? WHERE id = ?").run(JSON.stringify(identified), inserted.lastInsertRowid)
    return { ...identified, id }
  })
}

/** Store the events of one command with each actor's situation in the state it left. */
function insertEvents(database: DatabaseSync, events: readonly Event[], after: State): void {
  const insert = database.prepare("INSERT INTO events (at, actor, command, row, note, situations) VALUES (?, ?, ?, ?, ?, ?)")
  const recorded = JSON.stringify(situations(after))
  for (const event of events) insert.run(event.at, event.actor, event.command, event.row, event.note, recorded)
}

export function create(path: string, state: State, event: Event): void {
  const database = open(path)
  try {
    database.exec("BEGIN IMMEDIATE")
    for (const statement of CREATE) database.exec(statement)
    database.prepare("INSERT INTO ledger (id, schema, state) VALUES (1, ?, ?)").run(SCHEMA, JSON.stringify(state))
    insertEvents(database, [event], state)
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
    return { state: loadState(database, path), events: loadEvents(database), deliveries: loadDeliveries(database) }
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
    const notifications: Delivery[] = []
    for (const command of commands) {
      const result = transition(state, command)
      if (!result.ok) throw new StoreError(result.error)
      notifications.push(...insertDeliveries(database, path, state, command, result.notifications))
      state = result.state
      insertEvents(database, result.events, state)
    }
    database.prepare("UPDATE ledger SET state = ? WHERE id = 1").run(JSON.stringify(state))
    const snapshot = { before, path, state, events: loadEvents(database), deliveries: loadDeliveries(database), notifications }
    database.exec("COMMIT")
    return snapshot
  } catch (error) {
    database.exec("ROLLBACK")
    throw error
  } finally {
    database.close()
  }
}

/** Record an observed outcome or reserve one explicit attempt before contacting transport. */
export function recordDelivery(path: string, id: string, rev: number, update: DeliveryUpdate): Delivery {
  const database = open(path)
  try {
    database.exec("BEGIN IMMEDIATE")
    loadState(database, path)
    const delivery = loadDeliveries(database).find((item) => item.id === id)
    if (!delivery) throw new StoreError(`no delivery ${id}; read status`)
    if (delivery.updates.length !== rev) throw new StoreError(`${id} is at rev ${delivery.updates.length}; read its delivery record again`)
    if (![delivery.sender, delivery.successor, "master"].includes(update.actor)) throw new StoreError(`${id} is reconciled by sender ${delivery.sender}, successor ${delivery.successor}, or master`)
    if (!unsettled(delivery)) throw new StoreError(`${id} is ${deliveryOutcome(delivery)}; do not repeat a settled notification`)
    if (!update.note.trim()) throw new StoreError("record the recipient/runtime observation before reconciling delivery")
    const { id: _id, ...record } = { ...delivery, updates: [...delivery.updates, update] }
    database.prepare("UPDATE deliveries SET record = ? WHERE id = ?").run(JSON.stringify(record), Number(id.slice(2)))
    database.exec("COMMIT")
    return { ...record, id }
  } catch (error) {
    database.exec("ROLLBACK")
    throw error
  } finally {
    database.close()
  }
}
