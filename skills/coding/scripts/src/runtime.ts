import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  chmodSync,
  closeSync,
  copyFileSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync
} from "node:fs"
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path"
import { DatabaseSync } from "node:sqlite"
import { fileURLToPath } from "node:url"

import { PROTOCOL_SCHEMA_VERSION, type Actor, type Notification } from "./protocol.js"
import { STORE_APPLICATION_ID, STORE_SCHEMA_VERSION } from "./schema.js"

// This module is bundled into ledger.mjs; import.meta.url therefore names the
// exact artifact that must be pinned.
export const bundlePath = fileURLToPath(import.meta.url)
export const scriptsDirectory = dirname(bundlePath)

export const PIN_MANIFEST_NAME = "ledger.manifest.json"

export interface PinManifest {
  readonly format: 1
  readonly applicationId: typeof STORE_APPLICATION_ID
  readonly storeSchema: number
  readonly protocolSchema: number
  readonly bundle: "ledger.mjs"
  readonly sha256: string
  readonly launcher: "ledger.ts"
  readonly launcherSha256: string
}

interface LedgerIdentity {
  readonly storeSchema: number
  readonly stateSchema: number
}

export function runDirectory(): string {
  return resolve(process.env.LEDGER_DIR ?? ".")
}

export function sharedDatabasePath(): string {
  return join(runDirectory(), "ledger.db")
}

export function coldDatabasePath(actor: "A" | "B"): string {
  return join(runDirectory(), `cold-${actor}.db`)
}

export function pinManifestPath(directory = runDirectory()): string {
  return join(directory, "bin", PIN_MANIFEST_NAME)
}

function samePath(left: string, right: string): boolean {
  try {
    return realpathSync(left) === realpathSync(right)
  } catch {
    return resolve(left) === resolve(right)
  }
}

function conciseFailure(message: string): never {
  process.stderr.write(`ledger: ${message}\n`)
  process.exit(1)
}

function ledgerIdentity(path: string): LedgerIdentity | null {
  let database: DatabaseSync | undefined
  try {
    database = new DatabaseSync(path, { readOnly: true })
    const table = database.prepare(
      "SELECT 1 AS present FROM sqlite_master WHERE type = 'table' AND name = 'ledger_meta'"
    ).get() as { readonly present?: number } | undefined
    if (table?.present === 1) {
      const row = database.prepare(
        "SELECT application_id, store_schema, state_schema FROM ledger_meta WHERE singleton = 1"
      ).get() as {
        readonly application_id?: unknown
        readonly store_schema?: unknown
        readonly state_schema?: unknown
      } | undefined
      if (
        row?.application_id === STORE_APPLICATION_ID &&
        Number.isSafeInteger(row.store_schema) &&
        Number(row.store_schema) >= 1 &&
        Number.isSafeInteger(row.state_schema) &&
        Number(row.state_schema) >= 1
      ) {
        return {
          storeSchema: Number(row.store_schema),
          stateSchema: Number(row.state_schema)
        }
      }
      return null
    }
    return null
  } catch {
    return null
  } finally {
    try {
      database?.close()
    } catch {
      // An unrecognized database never makes a run-directory executable.
    }
  }
}

function decodePinManifest(path: string): PinManifest | null {
  try {
    const value = JSON.parse(readFileSync(path, "utf8")) as Partial<PinManifest>
    if (
      value.format !== 1 ||
      value.applicationId !== STORE_APPLICATION_ID ||
      !Number.isSafeInteger(value.storeSchema) ||
      Number(value.storeSchema) < 1 ||
      !Number.isSafeInteger(value.protocolSchema) ||
      value.bundle !== "ledger.mjs" ||
      !/^[0-9a-f]{64}$/.test(value.sha256 ?? "") ||
      value.launcher !== "ledger.ts" ||
      !/^[0-9a-f]{64}$/.test(value.launcherSha256 ?? "")
    ) {
      return null
    }
    return value as PinManifest
  } catch {
    return null
  }
}

/**
 * Keep a live run on the exact helper it pinned. No file under an arbitrary
 * LEDGER_DIR is executed until the shared database proves that this is a
 * coding-ledger run and the manifest proves the bundle bytes. A database with
 * a missing or changed pin fails closed instead of falling back to the mutable
 * installed helper.
 */
export function delegateToPinned(): void {
  const directory = runDirectory()
  const database = join(directory, "ledger.db")
  if (!existsSync(database)) return

  const identity = ledgerIdentity(database)
  if (identity === null) return

  const pinnedBundle = join(directory, "bin", "ledger.mjs")
  const manifestPath = pinManifestPath(directory)
  const manifest = decodePinManifest(manifestPath)
  if (manifest === null) conciseFailure(`live ledger pin is missing or invalid: ${manifestPath}`)
  if (manifest.protocolSchema !== identity.stateSchema) {
    conciseFailure(
      `live ledger pin speaks protocol schema ${manifest.protocolSchema}, database needs ${identity.stateSchema}`
    )
  }
  if (manifest.storeSchema !== identity.storeSchema) {
    conciseFailure(
      `live ledger pin uses store schema ${manifest.storeSchema}, database needs ${identity.storeSchema}`
    )
  }
  const pinnedLauncher = join(directory, "bin", manifest.launcher)
  if (!existsSync(pinnedLauncher) || !statSync(pinnedLauncher).isFile()) {
    conciseFailure(`live ledger launcher is missing: ${pinnedLauncher}`)
  }
  const actualLauncherHash = fileHash(pinnedLauncher)
  if (actualLauncherHash !== manifest.launcherSha256) {
    conciseFailure(
      `live ledger launcher hash mismatch: ${pinnedLauncher} is ${actualLauncherHash}, expected ${manifest.launcherSha256}`
    )
  }
  if (!existsSync(pinnedBundle) || !statSync(pinnedBundle).isFile()) {
    conciseFailure(`live ledger pin is missing: ${pinnedBundle}`)
  }
  const actualHash = fileHash(pinnedBundle)
  if (actualHash !== manifest.sha256) {
    conciseFailure(
      `live ledger pin hash mismatch: ${pinnedBundle} is ${actualHash}, expected ${manifest.sha256}`
    )
  }
  if (samePath(bundlePath, pinnedBundle)) return
  const child = spawnSync(process.execPath, ["--no-warnings", pinnedBundle, ...process.argv.slice(2)], {
    env: process.env,
    stdio: "inherit"
  })
  process.exit(child.status ?? 1)
}

function writeManifestAtomically(path: string, manifest: PinManifest): void {
  const temporary = join(dirname(path), `.${basename(path)}.${process.pid}.${Date.now()}.tmp`)
  try {
    writeFileSync(temporary, `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" })
    renameSync(temporary, path)
  } finally {
    try {
      rmSync(temporary)
    } catch {
      // Successful rename removes the temporary name; a failed write leaves no
      // manifest that could bless a partial bundle.
    }
  }
}

export function pinCurrentHelper(directory: string): {
  readonly bundle: string
  readonly hash: string
  readonly manifest: string
} {
  if (!existsSync(bundlePath)) throw new Error(`built helper is missing at ${bundlePath}; run npm run build`)
  const bin = join(directory, "bin")
  mkdirSync(bin, { recursive: true })
  const pinnedBundle = join(bin, "ledger.mjs")
  if (!samePath(bundlePath, pinnedBundle)) copyFileSync(bundlePath, pinnedBundle)
  chmodSync(pinnedBundle, 0o755)
  const launcher = join(bin, "ledger.ts")
  writeFileSync(launcher, "#!/usr/bin/env -S node --no-warnings\nimport './ledger.mjs'\n")
  chmodSync(launcher, 0o755)
  const hash = fileHash(pinnedBundle)
  const manifestPath = pinManifestPath(directory)
  writeManifestAtomically(manifestPath, {
    format: 1,
    applicationId: STORE_APPLICATION_ID,
    storeSchema: STORE_SCHEMA_VERSION,
    protocolSchema: PROTOCOL_SCHEMA_VERSION,
    bundle: "ledger.mjs",
    sha256: hash,
    launcher: "ledger.ts",
    launcherSha256: fileHash(launcher)
  })
  return { bundle: pinnedBundle, hash, manifest: manifestPath }
}

export function fileHash(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex")
}

function isWithin(parent: string, candidate: string): boolean {
  const inside = relative(parent, candidate)
  return inside === "" || (inside !== ".." && !inside.startsWith(`..${sep}`) && !isAbsolute(inside))
}

/** Refuse report paths that can destroy the live database or its pinned helper. */
export function assertSafeReportDestination(destination: string, directory = runDirectory()): string {
  const candidate = resolve(destination)
  const root = realpathSync(resolve(directory))
  const parent = realpathSync(dirname(candidate))
  const effectiveCandidate = join(parent, basename(candidate))
  if (!isWithin(root, effectiveCandidate)) {
    throw new Error(`report destination must stay inside ${root}: ${candidate}`)
  }
  const protectedFiles = [
    join(root, "ledger.db"),
    join(root, "cold-A.db"),
    join(root, "cold-B.db"),
    join(root, "A-notes.md"),
    join(root, "B-notes.md")
  ]
  const bin = join(root, "bin")
  const protectedDirectory = existsSync(bin) ? realpathSync(bin) : bin
  if (
    protectedFiles.some((path) => samePath(effectiveCandidate, path)) ||
    isWithin(protectedDirectory, effectiveCandidate)
  ) {
    throw new Error(`report destination would overwrite ledger state: ${candidate}`)
  }
  if (extname(candidate).toLowerCase() !== ".md") throw new Error(`report destination must end in .md: ${candidate}`)
  return effectiveCandidate
}

/** Replace a report in one same-directory rename, never by truncating it in place. */
export function writeReportAtomically(destination: string, content: string, directory = runDirectory()): string {
  const target = assertSafeReportDestination(destination, directory)
  const temporary = join(dirname(target), `.${basename(target)}.${process.pid}.${Date.now()}.tmp`)
  let descriptor: number | undefined
  try {
    descriptor = openSync(temporary, "wx", 0o600)
    writeFileSync(descriptor, content)
    fsyncSync(descriptor)
    closeSync(descriptor)
    descriptor = undefined
    renameSync(temporary, target)
    return target
  } finally {
    if (descriptor !== undefined) {
      try {
        closeSync(descriptor)
      } catch {
        // Preserve the write or rename error.
      }
    }
    try {
      rmSync(temporary)
    } catch {
      // Successful rename removes the temporary name.
    }
  }
}

export function actorFromEnvironment(): Actor {
  const value = process.env.LEDGER_ME ?? ""
  if (value === "A" || value === "B" || value === "master") return value
  throw new Error(`LEDGER_ME must be A, B, or master (got '${value || "unset"}')`)
}

function notificationTarget(notification: Notification, names: Readonly<Record<Actor, string>>): string {
  return names[notification.recipient] || notification.recipient
}

export interface NotificationDelivery {
  readonly ok: boolean
  readonly fallback?: string
}

export function deliverNotification(
  notification: Notification,
  names: Readonly<Record<Actor, string>>
): NotificationDelivery {
  const target = notificationTarget(notification, names)
  const configured = (process.env.LEDGER_NOTIFY ?? "herdr agent prompt").trim()
  if (!configured || configured === "false" || configured === "true") return { ok: true }
  const [command, ...prefix] = configured.split(/\s+/)
  if (!command) return { ok: true }
  const child = spawnSync(command, [...prefix, target, notification.message], {
    encoding: "utf8",
    env: process.env,
    timeout: 10_000
  })
  if (!child.error && child.status === 0) return { ok: true }
  const detail = child.error?.message ?? child.stderr?.trim() ?? `exit ${child.status ?? "unknown"}`
  return {
    ok: false,
    fallback: `notification failed (${detail}); send to ${target}: ${notification.message}`
  }
}
