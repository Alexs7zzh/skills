#!/usr/bin/env -S node --no-warnings

// Stable bootstrap: recognize a live coding-ledger database and execute its
// verified pin before loading the mutable installed bundle.
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, readFileSync, statSync } from "node:fs"
import { join, resolve } from "node:path"
import { DatabaseSync } from "node:sqlite"

const directory = resolve(process.env.LEDGER_DIR ?? ".")
const databasePath = join(directory, "ledger.db")

function fail(message) {
  process.stderr.write(`ledger: ${message}\n`)
  process.exit(1)
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex")
}

function liveIdentity() {
  if (!existsSync(databasePath)) return null
  let database
  try {
    database = new DatabaseSync(databasePath, { readOnly: true })
    const row = database.prepare(
      "SELECT application_id, store_schema, state_schema FROM ledger_meta WHERE singleton = 1"
    ).get()
    if (
      row?.application_id !== "coding-ledger" ||
      !Number.isSafeInteger(row.store_schema) ||
      row.store_schema < 1 ||
      !Number.isSafeInteger(row.state_schema) ||
      row.state_schema < 1
    ) return null
    return { storeSchema: row.store_schema, protocolSchema: row.state_schema }
  } catch {
    return null
  } finally {
    try {
      database?.close()
    } catch {
      // The installed implementation will report an unreadable database.
    }
  }
}

const identity = liveIdentity()
if (identity !== null) {
  const manifestPath = join(directory, "bin", "ledger.manifest.json")
  let manifest
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
  } catch {
    fail(`live ledger pin is missing or invalid: ${manifestPath}`)
  }
  if (
    manifest?.format !== 1 ||
    manifest.applicationId !== "coding-ledger" ||
    manifest.storeSchema !== identity.storeSchema ||
    manifest.protocolSchema !== identity.protocolSchema ||
    manifest.bundle !== "ledger.mjs" ||
    manifest.launcher !== "ledger.ts" ||
    !/^[0-9a-f]{64}$/.test(manifest.sha256 ?? "") ||
    !/^[0-9a-f]{64}$/.test(manifest.launcherSha256 ?? "")
  ) fail(`live ledger pin is invalid or incompatible: ${manifestPath}`)

  const bundle = join(directory, "bin", manifest.bundle)
  const launcher = join(directory, "bin", manifest.launcher)
  for (const [kind, path, expected] of [
    ["bundle", bundle, manifest.sha256],
    ["launcher", launcher, manifest.launcherSha256],
  ]) {
    if (!existsSync(path) || !statSync(path).isFile()) fail(`live ledger ${kind} is missing: ${path}`)
    const actual = sha256(path)
    if (actual !== expected) fail(`live ledger ${kind} hash mismatch: ${path} is ${actual}, expected ${expected}`)
  }
  const child = spawnSync(process.execPath, ["--no-warnings", bundle, ...process.argv.slice(2)], {
    env: process.env,
    stdio: "inherit",
  })
  process.exit(child.status ?? 1)
}

await import("./ledger.mjs")
