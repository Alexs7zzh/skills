import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync
} from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

import * as Effect from "effect/Effect"

import {
  assertSafeReportDestination,
  fileHash,
  PIN_MANIFEST_NAME,
  writeReportAtomically
} from "../src/runtime.js"
import {
  StoreError,
  initializeDatabase,
  mutateDatabaseFromState,
  readSnapshot,
  sealImportBundle,
  type Mutation,
  type ProtocolEngine,
  type StateCodec
} from "../src/store.js"

const here = dirname(fileURLToPath(import.meta.url))
const ledger = join(here, "..", "ledger.ts")
const timestamp = "2026-09-04T00:00:00.000Z"

interface CounterState {
  readonly values: readonly number[]
}

interface AppendCommand {
  readonly value: number
}

const counterCodec = (schemaVersion = 1): StateCodec<CounterState> => ({
  schemaVersion,
  decode: (input) => {
    if (typeof input !== "object" || input === null || Array.isArray(input)) throw new TypeError("state must be an object")
    const values = (input as { readonly values?: unknown }).values
    if (!Array.isArray(values) || !values.every((value) => Number.isSafeInteger(value))) {
      throw new TypeError("values must be safe integers")
    }
    return { values: values as readonly number[] }
  }
})

const counterEngine: ProtocolEngine<CounterState, AppendCommand, undefined> = {
  ...counterCodec(),
  reduce: (state, command): Mutation<CounterState> => ({
    state: { values: [...state.values, command.value] },
    events: [{
      occurredAt: timestamp,
      actor: "test",
      action: "append",
      fromState: String(state.values.length),
      toState: String(state.values.length + 1)
    }]
  })
}

function run(directory: string, actor: "A" | "B" | "master", ...args: readonly string[]) {
  return spawnSync(process.execPath, ["--no-warnings", ledger, ...args], {
    encoding: "utf8",
    env: {
      ...process.env,
      LEDGER_DIR: directory,
      LEDGER_ME: actor,
      LEDGER_NOTIFY: "false"
    }
  })
}

function commandOutput(result: ReturnType<typeof run>): string {
  return `${result.stdout ?? ""}${result.stderr ?? ""}`
}

test("a preplanted helper is not executed before a valid ledger exists", () => {
  const directory = mkdtempSync(join(tmpdir(), "coding-ledger-preplant-"))
  const bin = join(directory, "bin")
  const marker = join(directory, "executed")
  mkdirSync(bin)
  writeFileSync(
    join(bin, "ledger.mjs"),
    `#!/usr/bin/env node\nimport { writeFileSync } from "node:fs"; writeFileSync(${JSON.stringify(marker)}, "bad");\n`
  )
  chmodSync(join(bin, "ledger.mjs"), 0o755)

  const result = run(directory, "master", "--help")
  assert.equal(result.status, 0, commandOutput(result))
  assert.equal(existsSync(marker), false)
})

test("a live run refuses a missing bundle or changed pinned helper", () => {
  const missingDirectory = mkdtempSync(join(tmpdir(), "coding-ledger-missing-pin-"))
  let result = run(missingDirectory, "A", "init", "--single", "--route", "review")
  assert.equal(result.status, 0, commandOutput(result))
  const missingBundle = join(missingDirectory, "bin", "ledger.mjs")
  assert.equal(existsSync(join(missingDirectory, "bin", PIN_MANIFEST_NAME)), true)
  rmSync(missingBundle)
  result = run(missingDirectory, "A", "status")
  assert.notEqual(result.status, 0)
  assert.match(commandOutput(result), /live ledger bundle is missing:/)

  const launcherDirectory = mkdtempSync(join(tmpdir(), "coding-ledger-changed-launcher-"))
  result = run(launcherDirectory, "A", "init", "--single", "--route", "review")
  assert.equal(result.status, 0, commandOutput(result))
  const changedLauncher = join(launcherDirectory, "bin", "ledger.ts")
  writeFileSync(changedLauncher, `${readFileSync(changedLauncher, "utf8")}\n// changed\n`)
  result = run(launcherDirectory, "A", "status")
  assert.notEqual(result.status, 0)
  assert.match(commandOutput(result), /live ledger launcher hash mismatch:/)

  const changedDirectory = mkdtempSync(join(tmpdir(), "coding-ledger-changed-pin-"))
  result = run(changedDirectory, "A", "init", "--single", "--route", "review")
  assert.equal(result.status, 0, commandOutput(result))
  const changedBundle = join(changedDirectory, "bin", "ledger.mjs")
  const before = fileHash(changedBundle)
  writeFileSync(changedBundle, `${readFileSync(changedBundle, "utf8")}\n// changed\n`)
  assert.notEqual(fileHash(changedBundle), before)
  result = run(changedDirectory, "A", "status")
  assert.notEqual(result.status, 0)
  assert.match(commandOutput(result), /live ledger bundle hash mismatch:/)
})

test("the stable launcher delegates before a mutable installed schema change", () => {
  const directory = mkdtempSync(join(tmpdir(), "coding-ledger-stable-launcher-"))
  let result = run(directory, "A", "init", "--single", "--route", "review")
  assert.equal(result.status, 0, commandOutput(result))

  const mutable = mkdtempSync(join(tmpdir(), "coding-ledger-mutable-copy-"))
  const mutableLauncher = join(mutable, "ledger.ts")
  const mutableBundle = join(mutable, "ledger.mjs")
  copyFileSync(ledger, mutableLauncher)
  copyFileSync(join(here, "..", "ledger.mjs"), mutableBundle)
  const source = readFileSync(mutableBundle, "utf8")
  const changed = source.replace("var STORE_SCHEMA_VERSION = 2;", "var STORE_SCHEMA_VERSION = 3;")
  assert.notEqual(changed, source, "probe must change the installed helper's store schema")
  writeFileSync(mutableBundle, changed)

  result = spawnSync(process.execPath, ["--no-warnings", mutableLauncher, "status"], {
    encoding: "utf8",
    env: {
      ...process.env,
      LEDGER_DIR: directory,
      LEDGER_ME: "A",
      LEDGER_NOTIFY: "false",
    },
  })
  assert.equal(result.status, 0, commandOutput(result))
  assert.match(commandOutput(result), /Ledger status/)
})

test("failed initialization leaves no target and a valid retry succeeds", async () => {
  const directory = mkdtempSync(join(tmpdir(), "coding-ledger-init-retry-"))
  const database = join(directory, "ledger.db")
  await assert.rejects(
    Effect.runPromise(initializeDatabase(database, { values: [Number.NaN] }, counterCodec(), { occurredAt: timestamp })),
    (error: unknown) => error instanceof StoreError && error.kind === "InvalidState"
  )
  assert.equal(existsSync(database), false)
  const snapshot = await Effect.runPromise(
    initializeDatabase(database, { values: [] }, counterCodec(), { occurredAt: timestamp })
  )
  assert.equal(snapshot.storageRevision, 0)
})

test("state-derived commands allocate under BEGIN IMMEDIATE", async () => {
  const directory = mkdtempSync(join(tmpdir(), "coding-ledger-atomic-builder-"))
  const database = join(directory, "ledger.db")
  await Effect.runPromise(initializeDatabase(database, { values: [] }, counterCodec(), { occurredAt: timestamp }))

  const appendNext = () => mutateDatabaseFromState(
    database,
    counterEngine,
    (state) => ({ value: Math.max(0, ...state.values) + 1 }),
    undefined
  )
  await Effect.runPromise(Effect.all([appendNext(), appendNext()], { concurrency: "unbounded" }))
  const snapshot = await Effect.runPromise(readSnapshot(database, counterCodec()))
  assert.deepEqual(snapshot.state.values, [1, 2])
  assert.equal(snapshot.storageRevision, 2)
})

test("a durable cold seal includes prior writes and refuses every later mutation", async () => {
  const directory = mkdtempSync(join(tmpdir(), "coding-ledger-cold-seal-"))
  const database = join(directory, "cold-A.db")
  await Effect.runPromise(initializeDatabase(database, { values: [] }, counterCodec(), { occurredAt: timestamp }))
  const appendNext = () => Effect.runPromise(mutateDatabaseFromState(
    database,
    counterEngine,
    (state) => ({ value: Math.max(0, ...state.values) + 1 }),
    undefined
  ))

  await appendNext()
  const beforeSeal = Array.from({ length: 12 }, () => appendNext())
  const sealing = Effect.runPromise(sealImportBundle(database, counterCodec(), "2026-09-04T00:00:01.000Z"))
  const afterSeal = Array.from({ length: 12 }, () => appendNext())
  const writers = [...beforeSeal, ...afterSeal]
  const settled = await Promise.allSettled([...writers, sealing])
  const firstSeal = await sealing
  const successfulWriters = settled.slice(0, writers.length).filter((result) => result.status === "fulfilled").length
  const refusedWriters = settled.slice(0, writers.length).filter((result) => result.status === "rejected")

  assert.equal(firstSeal.state.values.length, 1 + successfulWriters)
  assert.deepEqual(firstSeal.state.values, Array.from({ length: firstSeal.state.values.length }, (_, index) => index + 1))
  assert.ok(refusedWriters.length > 0, "the seal should win before at least one queued writer")
  for (const refusal of refusedWriters) {
    assert.ok(refusal.status === "rejected" && refusal.reason instanceof StoreError)
    assert.equal((refusal as PromiseRejectedResult).reason.kind, "Sealed")
  }

  await assert.rejects(
    appendNext(),
    (error: unknown) => error instanceof StoreError && error.kind === "Sealed"
  )
  const retry = await Effect.runPromise(
    sealImportBundle(database, counterCodec(), "2026-09-04T00:00:02.000Z")
  )
  assert.deepEqual(retry.state, firstSeal.state)
  assert.deepEqual(retry.events, firstSeal.events)
  assert.equal(retry.storageRevision, firstSeal.storageRevision)
  assert.equal(retry.sealedAt, firstSeal.sealedAt)
})

test("a rejected cold-pass validator rolls back the seal", async () => {
  const directory = mkdtempSync(join(tmpdir(), "coding-ledger-cold-seal-validation-"))
  const database = join(directory, "cold-A.db")
  await Effect.runPromise(initializeDatabase(database, { values: [] }, counterCodec(), { occurredAt: timestamp }))

  await assert.rejects(
    Effect.runPromise(sealImportBundle(database, counterCodec(), "2026-09-04T00:00:01.000Z", {
      validate: () => {
        throw new Error("unfinished cold pass")
      }
    })),
    (error: unknown) =>
      error instanceof StoreError &&
      error.kind === "ProtocolRejected" &&
      error.message.includes("unfinished cold pass")
  )

  await Effect.runPromise(mutateDatabaseFromState(
    database,
    counterEngine,
    (state) => ({ value: state.values.length + 1 }),
    undefined
  ))
  const sealed = await Effect.runPromise(
    sealImportBundle(database, counterCodec(), "2026-09-04T00:00:02.000Z", {
      validate: (state) => assert.deepEqual(state.values, [1])
    })
  )
  assert.deepEqual(sealed.state.values, [1])
  await assert.rejects(
    Effect.runPromise(mutateDatabaseFromState(
      database,
      counterEngine,
      (state) => ({ value: state.values.length + 1 }),
      undefined
    )),
    (error: unknown) => error instanceof StoreError && error.kind === "Sealed"
  )
})

test("the store refuses an incompatible state schema", async () => {
  const directory = mkdtempSync(join(tmpdir(), "coding-ledger-schema-refusal-"))
  const database = join(directory, "ledger.db")
  await Effect.runPromise(initializeDatabase(database, { values: [] }, counterCodec(1), { occurredAt: timestamp }))
  await assert.rejects(
    Effect.runPromise(readSnapshot(database, counterCodec(2))),
    (error: unknown) => error instanceof StoreError && error.kind === "IncompatibleState"
  )
})

test("a mutation can bind itself to the exact snapshot revision", async () => {
  const directory = mkdtempSync(join(tmpdir(), "coding-ledger-snapshot-cas-"))
  const database = join(directory, "ledger.db")
  await Effect.runPromise(initializeDatabase(database, { values: [] }, counterCodec(), { occurredAt: timestamp }))
  const rendered = await Effect.runPromise(readSnapshot(database, counterCodec()))
  await Effect.runPromise(mutateDatabaseFromState(
    database,
    counterEngine,
    () => ({ value: 1 }),
    undefined,
  ))
  await assert.rejects(
    Effect.runPromise(mutateDatabaseFromState(
      database,
      counterEngine,
      () => ({ value: 2 }),
      undefined,
      { expectedStorageRevision: rendered.storageRevision },
    )),
    (error: unknown) => error instanceof StoreError && error.kind === "RevisionConflict",
  )
  assert.deepEqual((await Effect.runPromise(readSnapshot(database, counterCodec()))).state.values, [1])
})

test("report replacement is atomic and refuses ledger-owned paths", () => {
  const directory = mkdtempSync(join(tmpdir(), "coding-ledger-report-path-"))
  mkdirSync(join(directory, "bin"))
  assert.throws(() => assertSafeReportDestination(join(directory, "ledger.db"), directory), /overwrite ledger state/)
  assert.throws(() => assertSafeReportDestination(join(directory, "cold-A.db"), directory), /overwrite ledger state/)
  assert.throws(() => assertSafeReportDestination(join(directory, "bin", "ledger.mjs"), directory), /overwrite ledger state/)
  assert.throws(() => assertSafeReportDestination(join(directory, "A-notes.md"), directory), /overwrite ledger state/)
  assert.throws(() => assertSafeReportDestination(join(directory, "report.txt"), directory), /must end in \.md/)
  assert.throws(() => assertSafeReportDestination(join(directory, "..", "report.md"), directory), /must stay inside/)

  const report = join(directory, "report.md")
  writeFileSync(report, "old\n")
  assert.equal(writeReportAtomically(report, "new\n", directory), realpathSync(report))
  assert.equal(readFileSync(report, "utf8"), "new\n")
  assert.deepEqual(
    readdirSync(directory).filter((name) => name.includes(".tmp")),
    []
  )
})
