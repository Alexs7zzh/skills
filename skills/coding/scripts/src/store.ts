import * as SqliteClient from "@effect/sql-sqlite-node/SqliteClient"
import * as Effect from "effect/Effect"
import * as SqlClient from "effect/unstable/sql/SqlClient"
import type { SqlError } from "effect/unstable/sql/SqlError"
import { existsSync, linkSync, mkdirSync, mkdtempSync, rmdirSync, unlinkSync } from "node:fs"
import { basename, dirname, join } from "node:path"

import {
  decodeProtocolState,
  PROTOCOL_SCHEMA_VERSION,
  transition,
  type DomainEvent,
  type ProtocolCommand,
  type ProtocolState,
  type Seat
} from "./protocol.js"
import {
  CREATE_SCHEMA_STATEMENTS,
  type EventRow,
  type MetaRow,
  STORE_APPLICATION_ID,
  STORE_SCHEMA_VERSION
} from "./schema.js"

export type StoreErrorKind =
  | "AlreadyInitialized"
  | "NotInitialized"
  | "IncompatibleStore"
  | "IncompatibleState"
  | "InvalidState"
  | "ProtocolRejected"
  | "RevisionConflict"
  | "Sealed"
  | "PersistenceFailure"

export class StoreError extends Error {
  readonly _tag = "StoreError"

  constructor(
    readonly kind: StoreErrorKind,
    message: string,
    override readonly cause?: unknown
  ) {
    super(message, cause === undefined ? undefined : { cause })
    this.name = "StoreError"
  }
}

/** The protocol owns this decoder and therefore remains the state authority. */
export interface StateCodec<State> {
  readonly schemaVersion: number
  readonly decode: (input: unknown) => State
}

/**
 * The event shape shared at the persistence boundary. Detail stays structured
 * in TypeScript and is encoded only when it crosses into SQLite.
 */
export interface TimelineEventInput {
  readonly occurredAt: string
  readonly actor: string
  readonly action: string
  readonly rowKind?: string | null
  readonly rowId?: string | null
  readonly fromState?: string | null
  readonly toState?: string | null
  readonly detail?: unknown
}

export interface TimelineEvent extends TimelineEventInput {
  readonly sequence: number
  readonly storageRevision: number
}

export interface Snapshot<State> {
  readonly state: State
  readonly storageRevision: number
  readonly initializedAt: string
  readonly updatedAt: string
}

export interface Mutation<State> {
  readonly state: State
  readonly events?: ReadonlyArray<TimelineEventInput>
}

export interface MutationResult<State> extends Snapshot<State> {
  readonly previousState: State
  readonly events: ReadonlyArray<TimelineEvent>
}

export interface ProtocolEngine<State, Command, Context> extends StateCodec<State> {
  readonly reduce: (
    state: State,
    command: Command,
    context: Context
  ) => Mutation<State>
}

export interface ImportBundle<State> extends Snapshot<State> {
  readonly events: ReadonlyArray<TimelineEvent>
}

export interface SealedImportBundle<State> extends ImportBundle<State> {
  readonly sealedAt: string
}

export interface SealImportOptions<State> {
  /** Runs under the same write transaction; rejection leaves the ledger open. */
  readonly validate?: (state: Readonly<State>) => void
}

export const domainEventToTimelineEvent = (event: DomainEvent): TimelineEventInput => ({
  occurredAt: event.at,
  actor: event.actor,
  action: event.command,
  ...(event.type === "row.changed"
    ? { rowKind: event.rowKind, rowId: event.rowId }
    : event.type === "issue-take.changed"
      ? { rowKind: "Issue" as const, rowId: event.issueId }
      : {}),
  fromState: event.from,
  toState: event.to,
  detail: event
})

/**
 * Adapt the pure protocol reducer to storage without duplicating any workflow
 * decision in SQL. The decoder remains an explicit dependency so tests and a
 * incompatible schemas are refused; this implementation does not migrate them.
 */
export const makeProtocolEngine = (
  decode: (input: unknown) => ProtocolState = decodeProtocolState
): ProtocolEngine<ProtocolState, ProtocolCommand, undefined> => ({
  schemaVersion: PROTOCOL_SCHEMA_VERSION,
  decode,
  reduce: (state, command) => {
    const result = transition(state, command)
    if (!result.ok) {
      throw new StoreError(
        "ProtocolRejected",
        `${result.error.command} refused (${result.error.code}): ${result.error.message}`
      )
    }
    return {
      state: result.state,
      events: result.events.map(domainEventToTimelineEvent)
    }
  }
})

export const protocolEngine = makeProtocolEngine()

const importedEvent: unique symbol = Symbol("coding-ledger/imported-event")

/** Created only through importedEventsFrom, so cold provenance cannot be lost. */
export interface ImportedTimelineEvent extends TimelineEventInput {
  readonly [importedEvent]: true
}

export const importedEventsFrom = <State>(
  bundle: ImportBundle<State>,
  sourceSeat: Seat
): ReadonlyArray<ImportedTimelineEvent> =>
  bundle.events.map((event) => ({
    [importedEvent]: true,
    occurredAt: event.occurredAt,
    actor: event.actor,
    action: event.action,
    rowKind: event.rowKind ?? null,
    rowId: event.rowId ?? null,
    fromState: event.fromState ?? null,
    toState: event.toState ?? null,
    detail: {
      importedFrom: {
        seat: sourceSeat,
        sequence: event.sequence,
        storageRevision: event.storageRevision,
        bundleStorageRevision: bundle.storageRevision
      },
      event: event.detail
    }
  }))

interface InitializeOptions {
  readonly occurredAt: string
  readonly events?: ReadonlyArray<TimelineEventInput>
}

interface MutateOptions {
  /** Refuse if the caller's rendered/read snapshot is no longer current. */
  readonly expectedStorageRevision?: number
  /**
   * Extra already-known events can be persisted in the same shared-database
   * transaction as a cold-ledger import. The caller should retain source
   * sequence/revision information in each event's detail.
   */
  readonly additionalEvents?: ReadonlyArray<ImportedTimelineEvent>
}

export type StateCommandBuilder<State, Command> = (
  state: Readonly<State>
) => Command | ReadonlyArray<Command>

const databaseLayer = (path: string, disableWAL = false) =>
  SqliteClient.layer({
    filename: path,
    busyTimeout: "5 seconds",
    disableWAL
  })

const withDatabase = <A, E, R>(
  path: string,
  effect: Effect.Effect<A, E, R | SqlClient.SqlClient>,
  options: { readonly disableWAL?: boolean } = {}
): Effect.Effect<A, StoreError, Exclude<R, SqlClient.SqlClient>> =>
  effect.pipe(
    Effect.provide(databaseLayer(path, options.disableWAL ?? false)),
    Effect.mapError((cause) =>
      cause instanceof StoreError
        ? cause
        : new StoreError("PersistenceFailure", `SQLite operation failed for ${path}`, cause)
    ),
    Effect.catchDefect((cause) =>
      Effect.fail(new StoreError("PersistenceFailure", `SQLite defect for ${path}`, cause))
    )
  ) as Effect.Effect<A, StoreError, Exclude<R, SqlClient.SqlClient>>

const requireExistingDatabase = (path: string) =>
  existsSync(path)
    ? Effect.void
    : Effect.fail(new StoreError("NotInitialized", `ledger database does not exist: ${path}`))

const decodeJson = <State>(
  path: string,
  stateJson: string,
  codec: StateCodec<State>
): Effect.Effect<State, StoreError> =>
  Effect.try({
    try: () => codec.decode(JSON.parse(stateJson)),
    catch: (cause) =>
      new StoreError(
        "InvalidState",
        `stored protocol state in ${path} does not match schema ${codec.schemaVersion}`,
        cause
      )
  })

interface EncodedJson<Value> {
  readonly json: string
  readonly value: Value
}

const encodeJson = (value: unknown, label: string): Effect.Effect<EncodedJson<unknown>, StoreError> =>
  Effect.try({
    try: () => {
      const encoded = JSON.stringify(value, (_key, candidate: unknown) => {
        if (
          candidate === undefined ||
          typeof candidate === "function" ||
          typeof candidate === "symbol" ||
          typeof candidate === "bigint" ||
          (typeof candidate === "number" && !Number.isFinite(candidate))
        ) {
          throw new TypeError(`${label} contains a value JSON cannot preserve`)
        }
        return candidate
      })
      if (typeof encoded !== "string") {
        throw new TypeError(`${label} did not encode to a JSON value`)
      }
      return { json: encoded, value: JSON.parse(encoded) }
    },
    catch: (cause) => new StoreError("InvalidState", `${label} is not lossless JSON`, cause)
  })

const encodeState = <State>(
  state: State,
  codec: StateCodec<State>
): Effect.Effect<EncodedJson<State>, StoreError> =>
  Effect.gen(function*() {
    const validated = yield* Effect.try({
      try: () => codec.decode(state),
      catch: (cause) => new StoreError("InvalidState", "protocol produced invalid state", cause)
    })
    const encoded = yield* encodeJson(validated, "protocol state")
    const canonical = yield* Effect.try({
      try: () => codec.decode(encoded.value),
      catch: (cause) =>
        new StoreError("InvalidState", "protocol state does not survive a JSON round trip", cause)
    })
    return { json: encoded.json, value: canonical }
  })

const checkMeta = <State>(
  path: string,
  row: MetaRow | undefined,
  codec: StateCodec<State>
): Effect.Effect<MetaRow, StoreError> => {
  if (row === undefined) {
    return Effect.fail(new StoreError("NotInitialized", `ledger metadata is missing from ${path}`))
  }
  if (row.application_id !== STORE_APPLICATION_ID) {
    return Effect.fail(new StoreError(
      "IncompatibleStore",
      `refusing ${path}: application is ${row.application_id}, expected ${STORE_APPLICATION_ID}`
    ))
  }
  if (row.store_schema !== STORE_SCHEMA_VERSION) {
    return Effect.fail(new StoreError(
      "IncompatibleStore",
      `refusing ${path}: store schema is ${row.store_schema}, expected ${STORE_SCHEMA_VERSION}`
    ))
  }
  if (row.state_schema !== codec.schemaVersion) {
    return Effect.fail(new StoreError(
      "IncompatibleState",
      `refusing ${path}: protocol schema is ${row.state_schema}, expected ${codec.schemaVersion}`
    ))
  }
  if (
    (row.sealed_at === null) !== (row.sealed_storage_revision === null) ||
    (row.sealed_storage_revision !== null && row.sealed_storage_revision !== row.storage_revision)
  ) {
    return Effect.fail(new StoreError("InvalidState", `ledger seal metadata is inconsistent in ${path}`))
  }
  return Effect.succeed(row)
}

const checkEnvelopeMeta = (
  path: string,
  row: MetaRow | undefined,
  expectedStateSchema?: number
): Effect.Effect<MetaRow, StoreError> => {
  if (row === undefined) {
    return Effect.fail(new StoreError("NotInitialized", `ledger metadata is missing from ${path}`))
  }
  if (row.application_id !== STORE_APPLICATION_ID || row.store_schema !== STORE_SCHEMA_VERSION) {
    return Effect.fail(new StoreError("IncompatibleStore", `refusing incompatible ledger: ${path}`))
  }
  if (expectedStateSchema !== undefined && row.state_schema !== expectedStateSchema) {
    return Effect.fail(
      new StoreError(
        "IncompatibleState",
        `refusing ${path}: protocol schema is ${row.state_schema}, expected ${expectedStateSchema}`
      )
    )
  }
  if (
    (row.sealed_at === null) !== (row.sealed_storage_revision === null) ||
    (row.sealed_storage_revision !== null && row.sealed_storage_revision !== row.storage_revision)
  ) {
    return Effect.fail(new StoreError("InvalidState", `ledger seal metadata is inconsistent in ${path}`))
  }
  return Effect.succeed(row)
}

const requireUnsealed = (path: string, row: MetaRow): Effect.Effect<void, StoreError> =>
  row.sealed_at === null
    ? Effect.void
    : Effect.fail(new StoreError(
      "Sealed",
      `ledger is sealed at storage revision ${row.sealed_storage_revision} since ${row.sealed_at}: ${path}`
    ))

const selectMeta = (sql: SqlClient.SqlClient): Effect.Effect<MetaRow | undefined, SqlError> =>
  Effect.map(
    sql<MetaRow>`
      SELECT application_id, store_schema, state_schema, storage_revision,
             state_json, initialized_at, updated_at, sealed_at,
             sealed_storage_revision
      FROM ledger_meta
      WHERE singleton = 1
    `,
    (rows) => rows[0]
  )

const insertEvents = (
  sql: SqlClient.SqlClient,
  storageRevision: number,
  events: ReadonlyArray<TimelineEventInput>
): Effect.Effect<ReadonlyArray<TimelineEvent>, StoreError | SqlError> =>
  Effect.gen(function*() {
    const persisted: Array<TimelineEvent> = []
    for (const event of events) {
      if (!event.actor.trim() || !event.action.trim() || !Number.isFinite(Date.parse(event.occurredAt))) {
        return yield* Effect.fail(
          new StoreError("InvalidState", "timeline event needs a timestamp, actor, and action")
        )
      }
      const detail = yield* encodeJson(event.detail ?? {}, "timeline event detail")
      const result = yield* sql.unsafe(
        `INSERT INTO ledger_events (
           storage_revision, occurred_at, actor, action, row_kind, row_id,
           from_state, to_state, detail_json
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          storageRevision,
          event.occurredAt,
          event.actor,
          event.action,
          event.rowKind ?? null,
          event.rowId ?? null,
          event.fromState ?? null,
          event.toState ?? null,
          detail.json
        ]
      ).raw
      const sequence = Number((result as { readonly lastInsertRowid: number | bigint }).lastInsertRowid)
      persisted.push({ ...event, detail: detail.value, sequence, storageRevision })
    }
    return persisted
  })

const parseEventRow = (row: EventRow): Effect.Effect<TimelineEvent, StoreError> =>
  Effect.try({
    try: () => ({
      sequence: Number(row.sequence),
      storageRevision: Number(row.storage_revision),
      occurredAt: row.occurred_at,
      actor: row.actor,
      action: row.action,
      rowKind: row.row_kind,
      rowId: row.row_id,
      fromState: row.from_state,
      toState: row.to_state,
      detail: JSON.parse(row.detail_json)
    }),
    catch: (cause) =>
      new StoreError("InvalidState", `timeline event ${row.sequence} contains invalid JSON`, cause)
  })

export const initializeDatabase = <State>(
  path: string,
  state: State,
  codec: StateCodec<State>,
  options: InitializeOptions
): Effect.Effect<Snapshot<State>, StoreError> => {
  if (existsSync(path)) {
    return Effect.fail(new StoreError("AlreadyInitialized", `refusing to overwrite existing ledger database: ${path}`))
  }
  if (!Number.isFinite(Date.parse(options.occurredAt))) {
    return Effect.fail(new StoreError("InvalidState", `invalid initialization timestamp: ${options.occurredAt}`))
  }

  return Effect.gen(function*() {
    yield* Effect.try({
      try: () => mkdirSync(dirname(path), { recursive: true }),
      catch: (cause) => new StoreError("PersistenceFailure", `cannot create ${dirname(path)}`, cause)
    })
    const validated = yield* Effect.try({
      try: () => codec.decode(state),
      catch: (cause) =>
        new StoreError("InvalidState", `initial state does not match schema ${codec.schemaVersion}`, cause)
    })
    const encoded = yield* encodeState(validated, codec)

    return yield* Effect.acquireUseRelease(
      Effect.try({
        try: () => {
          const directory = mkdtempSync(join(dirname(path), `.${basename(path)}.init-`))
          return { directory, database: join(directory, "ledger.db") }
        },
        catch: (cause) => new StoreError("PersistenceFailure", `cannot stage initialization for ${path}`, cause)
      }),
      ({ database }) =>
        Effect.gen(function*() {
          const snapshot = yield* withDatabase(
            database,
            Effect.gen(function*() {
              const sql = yield* SqlClient.SqlClient
              return yield* sql.withTransaction(
                Effect.gen(function*() {
                  for (const statement of CREATE_SCHEMA_STATEMENTS) {
                    yield* sql.unsafe(statement)
                  }
                  yield* sql.unsafe(
                    `INSERT INTO ledger_meta (
                     singleton, application_id, store_schema, state_schema,
                       storage_revision, state_json, initialized_at, updated_at,
                       sealed_at, sealed_storage_revision
                     ) VALUES (1, ?, ?, ?, 0, ?, ?, ?, NULL, NULL)`,
                    [
                      STORE_APPLICATION_ID,
                      STORE_SCHEMA_VERSION,
                      codec.schemaVersion,
                      encoded.json,
                      options.occurredAt,
                      options.occurredAt
                    ]
                  )
                  yield* insertEvents(sql, 0, options.events ?? [])
                  return {
                    state: encoded.value,
                    storageRevision: 0,
                    initializedAt: options.occurredAt,
                    updatedAt: options.occurredAt
                  }
                })
              )
            }),
            { disableWAL: true }
          )
          yield* Effect.try({
            try: () => linkSync(database, path),
            catch: (cause) => {
              const code = typeof cause === "object" && cause !== null && "code" in cause
                ? String(cause.code)
                : ""
              return code === "EEXIST"
                ? new StoreError("AlreadyInitialized", `refusing to overwrite existing ledger database: ${path}`, cause)
                : new StoreError("PersistenceFailure", `cannot publish initialized ledger to ${path}`, cause)
            }
          })
          return snapshot
        }),
      ({ database, directory }) =>
        Effect.sync(() => {
          for (const candidate of [database, `${database}-journal`, `${database}-wal`, `${database}-shm`]) {
            try {
              if (existsSync(candidate)) unlinkSync(candidate)
            } catch {
              // Best-effort cleanup cannot invalidate a ledger already published.
            }
          }
          try {
            rmdirSync(directory)
          } catch {
            // A private staging directory is harmless if the platform retains it.
          }
        })
    )
  })
}

export const readSnapshot = <State>(
  path: string,
  codec: StateCodec<State>
): Effect.Effect<Snapshot<State>, StoreError> =>
  Effect.gen(function*() {
    yield* requireExistingDatabase(path)
    return yield* withDatabase(
      path,
      Effect.gen(function*() {
        const sql = yield* SqlClient.SqlClient
        const row = yield* checkMeta(path, yield* selectMeta(sql), codec)
        const state = yield* decodeJson(path, row.state_json, codec)
        return {
          state,
          storageRevision: Number(row.storage_revision),
          initializedAt: row.initialized_at,
          updatedAt: row.updated_at
        }
      })
    )
  })

const mutateDatabaseBuilt = <State, Command, Context>(
  path: string,
  engine: ProtocolEngine<State, Command, Context>,
  build: StateCommandBuilder<State, Command>,
  context: Context,
  options: MutateOptions = {}
): Effect.Effect<MutationResult<State>, StoreError> =>
  Effect.gen(function*() {
    yield* requireExistingDatabase(path)
    return yield* withDatabase(
      path,
      Effect.gen(function*() {
        const sql = yield* SqlClient.SqlClient
        return yield* sql.withTransaction(
          Effect.gen(function*() {
            const row = yield* checkMeta(path, yield* selectMeta(sql), engine)
            yield* requireUnsealed(path, row)
            if (
              options.expectedStorageRevision !== undefined &&
              Number(row.storage_revision) !== options.expectedStorageRevision
            ) {
              return yield* Effect.fail(new StoreError(
                "RevisionConflict",
                `ledger changed after storage revision ${options.expectedStorageRevision}; retry from a fresh snapshot`
              ))
            }
            const previousState = yield* decodeJson(path, row.state_json, engine)
            const commands = yield* Effect.try({
              try: () => {
                const built = build(previousState)
                const batch = Array.isArray(built) ? built : [built]
                if (batch.length === 0) {
                  throw new StoreError("ProtocolRejected", "command batch must not be empty")
                }
                return batch as ReadonlyArray<Command>
              },
              catch: (cause) =>
                cause instanceof StoreError
                  ? cause
                  : new StoreError(
                    "ProtocolRejected",
                    `command construction failed: ${cause instanceof Error ? cause.message : String(cause)}`,
                    cause
                  )
            })
            const mutation = yield* Effect.try({
              try: () => {
                let state = previousState
                const events: Array<TimelineEventInput> = []
                for (const item of commands) {
                  const result = engine.reduce(state, item, context)
                  state = result.state
                  events.push(...(result.events ?? []))
                }
                return { state, events } satisfies Mutation<State>
              },
              catch: (cause) =>
                cause instanceof StoreError
                  ? cause
                  : new StoreError("InvalidState", "protocol command was refused", cause)
            })
            const encoded = yield* encodeState(mutation.state, engine)
            const storageRevision = Number(row.storage_revision) + 1
            const updatedAt = [
              row.updated_at,
              ...(mutation.events ?? []).map((event) => event.occurredAt),
              ...(options.additionalEvents ?? []).map((event) => event.occurredAt)
            ].reduce((latest, candidate) =>
              Date.parse(candidate) > Date.parse(latest) ? candidate : latest
            )
            const update = yield* sql.unsafe(
              `UPDATE ledger_meta
               SET storage_revision = ?, state_json = ?, updated_at = ?
               WHERE singleton = 1 AND storage_revision = ?`,
              [storageRevision, encoded.json, updatedAt, row.storage_revision]
            ).raw
            if (Number((update as { readonly changes: number | bigint }).changes) !== 1) {
              return yield* Effect.fail(new StoreError(
                "RevisionConflict",
                `ledger changed while applying storage revision ${row.storage_revision}`
              ))
            }
            const events = yield* insertEvents(sql, storageRevision, [
              ...(options.additionalEvents ?? []),
              ...(mutation.events ?? [])
            ])
            return {
              state: encoded.value,
              previousState,
              storageRevision,
              initializedAt: row.initialized_at,
              updatedAt,
              events
            }
          })
        )
      })
    )
  })

/**
 * Apply already-constructed commands atomically. Commands that allocate an ID
 * from current state should use mutateDatabaseFromState instead.
 */
export const mutateDatabase = <State, Command, Context>(
  path: string,
  engine: ProtocolEngine<State, Command, Context>,
  command: Command | ReadonlyArray<Command>,
  context: Context,
  options: MutateOptions = {}
): Effect.Effect<MutationResult<State>, StoreError> =>
  mutateDatabaseBuilt(path, engine, () => command, context, options)

/**
 * Construct commands only after BEGIN IMMEDIATE has acquired SQLite's write
 * lock and decoded the latest state. This is the allocation boundary for row
 * IDs and any other state-derived command input.
 */
export const mutateDatabaseFromState = <State, Command, Context>(
  path: string,
  engine: ProtocolEngine<State, Command, Context>,
  build: StateCommandBuilder<State, Command>,
  context: Context,
  options: MutateOptions = {}
): Effect.Effect<MutationResult<State>, StoreError> =>
  mutateDatabaseBuilt(path, engine, build, context, options)

/**
 * Read state and immutable history from one transaction, so a report or status
 * can never combine different storage revisions.
 */
export const readLedgerView = <State>(
  path: string,
  codec: StateCodec<State>
): Effect.Effect<ImportBundle<State>, StoreError> =>
  Effect.gen(function*() {
    yield* requireExistingDatabase(path)
    return yield* withDatabase(
      path,
      Effect.gen(function*() {
        const sql = yield* SqlClient.SqlClient
        return yield* sql.withTransaction(
          Effect.gen(function*() {
            const row = yield* checkMeta(path, yield* selectMeta(sql), codec)
            const state = yield* decodeJson(path, row.state_json, codec)
            const eventRows = yield* sql<EventRow>`
              SELECT sequence, storage_revision, occurred_at, actor, action,
                     row_kind, row_id, from_state, to_state, detail_json
              FROM ledger_events ORDER BY sequence
            `
            const events = yield* Effect.forEach(eventRows, parseEventRow)
            return {
              state,
              storageRevision: Number(row.storage_revision),
              initializedAt: row.initialized_at,
              updatedAt: row.updated_at,
              events
            }
          })
        )
      })
    )
  })

/**
 * Establish the cold-import barrier. BEGIN IMMEDIATE waits for every earlier
 * cold writer, the seal and snapshot commit together, and later mutations fail
 * with StoreError("Sealed"). A failed shared import can call this again and
 * receives the same sealed state and event history.
 */
export const sealImportBundle = <State>(
  path: string,
  codec: StateCodec<State>,
  occurredAt: string,
  options: SealImportOptions<State> = {}
): Effect.Effect<SealedImportBundle<State>, StoreError> => {
  if (!Number.isFinite(Date.parse(occurredAt))) {
    return Effect.fail(new StoreError("InvalidState", `invalid seal timestamp: ${occurredAt}`))
  }
  return Effect.gen(function*() {
    yield* requireExistingDatabase(path)
    return yield* withDatabase(
      path,
      Effect.gen(function*() {
        const sql = yield* SqlClient.SqlClient
        return yield* sql.withTransaction(
          Effect.gen(function*() {
            const row = yield* checkMeta(path, yield* selectMeta(sql), codec)
            const state = yield* decodeJson(path, row.state_json, codec)
            if (row.sealed_at === null && options.validate !== undefined) {
              yield* Effect.try({
                try: () => options.validate!(state),
                catch: (cause) => new StoreError(
                  "ProtocolRejected",
                  `cold import is not ready: ${cause instanceof Error ? cause.message : String(cause)}`,
                  cause
                )
              })
            }
            const sealedAt = row.sealed_at ?? occurredAt
            const updatedAt = Date.parse(sealedAt) > Date.parse(row.updated_at) ? sealedAt : row.updated_at
            if (row.sealed_at === null) {
              const result = yield* sql.unsafe(
                `UPDATE ledger_meta
                 SET sealed_at = ?, sealed_storage_revision = storage_revision,
                     updated_at = ?
                 WHERE singleton = 1 AND storage_revision = ? AND sealed_at IS NULL`,
                [sealedAt, updatedAt, row.storage_revision]
              ).raw
              if (Number((result as { readonly changes: number | bigint }).changes) !== 1) {
                return yield* Effect.fail(new StoreError(
                  "RevisionConflict",
                  `ledger changed while sealing storage revision ${row.storage_revision}`
                ))
              }
            }
            const eventRows = yield* sql<EventRow>`
              SELECT sequence, storage_revision, occurred_at, actor, action,
                     row_kind, row_id, from_state, to_state, detail_json
              FROM ledger_events ORDER BY sequence
            `
            const events = yield* Effect.forEach(eventRows, parseEventRow)
            return {
              state,
              storageRevision: Number(row.storage_revision),
              initializedAt: row.initialized_at,
              updatedAt,
              sealedAt,
              events
            }
          })
        )
      })
    )
  })
}
