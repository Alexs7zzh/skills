/**
 * SQLite is deliberately only the durable envelope for the protocol state.
 * All workflow invariants live in protocol.ts; adding them here would create a
 * second state machine that could drift from the TypeScript implementation.
 */

export const STORE_APPLICATION_ID = "coding-ledger" as const
export const STORE_SCHEMA_VERSION = 2 as const

export const CREATE_SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS ledger_meta (
  singleton          INTEGER PRIMARY KEY CHECK (singleton = 1),
  application_id     TEXT NOT NULL,
  store_schema       INTEGER NOT NULL,
  state_schema       INTEGER NOT NULL,
  storage_revision   INTEGER NOT NULL CHECK (storage_revision >= 0),
  state_json         TEXT NOT NULL,
  initialized_at     TEXT NOT NULL,
  updated_at         TEXT NOT NULL,
  sealed_at          TEXT,
  sealed_storage_revision INTEGER,
  CONSTRAINT seal_is_complete CHECK (
    (sealed_at IS NULL AND sealed_storage_revision IS NULL)
    OR (sealed_at IS NOT NULL AND sealed_storage_revision IS NOT NULL)
  )
)`,
  `CREATE TABLE IF NOT EXISTS ledger_events (
  sequence            INTEGER PRIMARY KEY AUTOINCREMENT,
  storage_revision    INTEGER NOT NULL CHECK (storage_revision >= 0),
  occurred_at         TEXT NOT NULL,
  actor               TEXT NOT NULL,
  action              TEXT NOT NULL,
  row_kind            TEXT,
  row_id              TEXT,
  from_state          TEXT,
  to_state            TEXT,
  detail_json         TEXT NOT NULL
)`,
  `CREATE INDEX IF NOT EXISTS ledger_events_actor_sequence
  ON ledger_events(actor, sequence)`,
  `CREATE TRIGGER IF NOT EXISTS ledger_events_are_immutable_on_update
BEFORE UPDATE ON ledger_events
BEGIN
  SELECT RAISE(ABORT, 'ledger events are immutable');
END`,
  `CREATE TRIGGER IF NOT EXISTS ledger_events_are_immutable_on_delete
BEFORE DELETE ON ledger_events
BEGIN
  SELECT RAISE(ABORT, 'ledger events are immutable');
END`
] as const

export interface MetaRow {
  readonly application_id: string
  readonly store_schema: number
  readonly state_schema: number
  readonly storage_revision: number
  readonly state_json: string
  readonly initialized_at: string
  readonly updated_at: string
  readonly sealed_at: string | null
  readonly sealed_storage_revision: number | null
}

export interface EventRow {
  readonly sequence: number
  readonly storage_revision: number
  readonly occurred_at: string
  readonly actor: string
  readonly action: string
  readonly row_kind: string | null
  readonly row_id: string | null
  readonly from_state: string | null
  readonly to_state: string | null
  readonly detail_json: string
}
