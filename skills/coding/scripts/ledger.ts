#!/usr/bin/env -S node --no-warnings

import { createHash } from "node:crypto";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";

const SCHEMA_VERSION = 1;
const APPLICATION_ID = 1129075283;
const SOURCE_FILE = resolve(process.argv[1]);
const SOURCE_DIR = dirname(SOURCE_FILE);
const SCHEMA_FILE = join(SOURCE_DIR, "ledger.sql");
const DIR = resolve(process.env.LEDGER_DIR ?? ".");
const SHARED = join(DIR, "ledger.db");
const WRITE_LOCK = join(DIR, ".ledger-write-lock");

const Role = { A: "A", B: "B", Fixer: "fixer", Master: "master" } as const;
type Role = (typeof Role)[keyof typeof Role];
type Seat = typeof Role.A | typeof Role.B;

const CoverageState = { Open: "open", Accounted: "accounted", Gap: "gap" } as const;
const ClaimState = {
  Candidate: "candidate", Verifying: "verifying", Verified: "verified", Assumed: "assumed",
  Contested: "contested", Disproved: "disproved", Duplicate: "dup", Accepted: "accepted",
} as const;
const DecisionState = {
  AgentDecidable: "agent-decidable", NeedsRuling: "needs-ruling",
  NeedsExternalEvidence: "needs-external-evidence", Decided: "decided",
} as const;
const RemedyState = { Draft: "draft", Reviewed: "reviewed", Fixable: "fixable", Rejected: "rejected" } as const;
const LandingState = {
  Implementing: "implementing", Landed: "landed",
  RedGreenProved: "red-green-proved", FixReviewed: "fix-reviewed",
} as const;
const DeliveryState = {
  AwaitingApproval: "awaiting-approval", Approved: "approved",
  CheckedIn: "checked-in", Dropped: "dropped",
} as const;
const Policy = { Report: "report", Prepare: "prepare", Land: "land", CheckIn: "check-in" } as const;

type SqlValue = string | number | null;
type Row = Record<string, SqlValue>;
type KeyValues = Map<string, string | null>;

const HELP = `ledger: revisioned work objects for coding campaigns
Run: <skill>/scripts/ledger.ts <command>
Env: LEDGER_DIR=<campaign directory> LEDGER_ME=A|B|fixer|master

Campaign:
  init --single --route review|diagnose [--policy report|prepare|land|check-in] [--joint path] [--clusters "..."]
  init --scribe A|B --joint path --route review|diagnose --names "A=name B=name fixer=name master=name"
       [--policy report|prepare|land|check-in] [--clusters "..."]
  init --cold
  import | handoff | status | render | report [--out path] | sign [note=...] | converge

Coverage:
  coverage add kind=hunk|symptom|cluster|scenario target=... [state=open|accounted|gap] [claim=C-A-1] [evidence=path] [note=...]
  coverage set V-A-1 rev=0 state=... [claim=...] [description=...] [evidence=...] [note=...]

Claims:
  claim add label=Bug|Restructure|Hardening|Nit|telemetry-quality proposition=... certainty=1..5
       [state=...] [clusters=...] [site=...] [trigger=...] [cause=...] [scope=...] [frequency=...]
       [impact=...] [evidence=path] [probe=...] [assumption=...] [release_gating=yes|no] [parents=C-A-1,C-B-1]
  claim set C-A-1 rev=0 k=v ...
  claim agree C-A-1 rev=0
  claim contest C-A-1 rev=0 probe=...
  claim disprove C-A-1 rev=0 evidence=... [note=...]
  claim dup C-A-1 rev=0 of=C-B-1 [note=...]
  claim accept C-A-1 rev=0 reason=...                 # Nit only; retained, never deleted

Decisions and remedies:
  decision add claims=C-A-1 state=needs-ruling question=... options=... recommendation=...
  decision set D-A-1 rev=0 k=v ... | decision decide D-A-1 rev=0 answer=...
  decision review D-A-1 rev=0 verdict=agree|contest [note=...]
  remedy add claims=C-A-1 origin_class=... fix_shape=... sites_walked=... rulings_checked=...
       test_seam="exists: path" cost=... risk=... stable=yes [review_mode=prior|landing] [selected=yes|no]
       [interface_change=no ownership_change=no risk_surface=no owner_ruling=no]
  remedy set R-A-1 rev=0 k=v ...
  remedy review R-A-1 rev=0 verdict=agree|contest|reject [note=...]
  remedy fixable R-A-1 rev=0

Landings and delivery:
  landing add remedy=R-A-1 [artifact=shelve-or-patch] [red_run=path] [green_run=path] [note=...]
  landing land L-F-1 rev=0 artifact=shelve-or-patch
  landing prove L-F-1 rev=1 red_run=path green_run=path
  landing review L-F-1 rev=2 verdict=agree|contest [note=...]
  delivery add landing=L-F-1
  delivery approve Y-M-1 rev=0
  delivery check-in Y-M-1 rev=0 changeset=...
  delivery drop Y-M-1 rev=0 reason=...
  delivery review Y-M-1 rev=0 verdict=agree|contest [note=...]

Inspection:
  show <object-id> | log [object-id] | query "SELECT ..."

Every content edit names the revision it read. A snapshot always renders. sign/converge create an
exhaustive certificate and refuse open coverage, stale links, unsettled work, or incomplete notes.
Live schema-v8 campaigns continue through their pinned ledger.sh; migrate intentionally refuses.`;

class LedgerError extends Error {}

function fail(message: string): never { throw new LedgerError(message); }
function errorText(error: unknown): string {
  return (error instanceof Error ? error.message : String(error))
    .replace(/^Error: /, "").replace(/^SqliteError: /, "").replace(/ \(\d+\)$/, "");
}
function now(): string { return new Date().toISOString().replace(/\.\d{3}Z$/, "Z"); }
function quoteSql(value: string): string { return `'${value.replaceAll("'", "''")}'`; }
function hashText(value: string): string { return createHash("sha256").update(value).digest("hex"); }
function hashFile(path: string): string { return createHash("sha256").update(readFileSync(path)).digest("hex"); }
function asString(value: SqlValue | undefined): string { return value === null || value === undefined ? "" : String(value); }

function samePath(left: string, right: string): boolean {
  try { return realpathSync(left) === realpathSync(right); } catch { return resolve(left) === resolve(right); }
}

function delegateToPinned(args: string[]): void {
  if (!existsSync(DIR)) return;
  const pinnedTs = join(DIR, "bin", "ledger.ts");
  if (existsSync(pinnedTs) && !samePath(SOURCE_FILE, pinnedTs)) {
    const result = spawnSync(process.execPath, ["--no-warnings", pinnedTs, ...args], { stdio: "inherit", env: process.env });
    process.exit(result.status ?? 1);
  }
  const pinnedShell = join(DIR, "bin", "ledger.sh");
  if (!existsSync(pinnedTs) && existsSync(pinnedShell)) {
    const result = spawnSync(pinnedShell, args, { stdio: "inherit", env: process.env });
    process.exit(result.status ?? 1);
  }
}

function openDatabase(path: string, readOnly = false): DatabaseSync {
  const db = new DatabaseSync(path, { readOnly });
  db.exec("PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;");
  return db;
}
function withDatabase<T>(path: string, work: (db: DatabaseSync) => T, readOnly = false): T {
  const db = openDatabase(path, readOnly);
  try { return work(db); } finally { db.close(); }
}
function transaction<T>(db: DatabaseSync, work: () => T): T {
  db.exec("BEGIN IMMEDIATE;");
  try { const result = work(); db.exec("COMMIT;"); return result; }
  catch (error) { try { db.exec("ROLLBACK;"); } catch {} throw error; }
}
function withWriteLock<T>(work: () => T): T {
  if (!existsSync(DIR) || !statSync(DIR).isDirectory()) fail(`ledger directory ${DIR} does not exist`);
  let acquired = false;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try { mkdirSync(WRITE_LOCK); acquired = true; break; }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
    }
  }
  if (!acquired) fail(`timed out waiting for ${WRITE_LOCK}`);
  try { return work(); } finally { rmSync(WRITE_LOCK, { recursive: true, force: true }); }
}

function all(db: DatabaseSync, statement: string, ...values: SqlValue[]): Row[] { return db.prepare(statement).all(...values) as Row[]; }
function one(db: DatabaseSync, statement: string, ...values: SqlValue[]): Row | undefined { return db.prepare(statement).get(...values) as Row | undefined; }
function run(db: DatabaseSync, statement: string, ...values: SqlValue[]): void { db.prepare(statement).run(...values); }
function meta(db: DatabaseSync, key: string): string {
  const row = one(db, "SELECT value FROM meta WHERE key=?", key);
  if (!row) fail(`ledger metadata is missing '${key}'`);
  return asString(row.value);
}
function setMeta(db: DatabaseSync, key: string, value: string): void { run(db, "INSERT OR REPLACE INTO meta(key,value) VALUES (?,?)", key, value); }
function validateDatabase(db: DatabaseSync): void {
  const app = Number(asString(one(db, "PRAGMA application_id")?.application_id));
  const version = Number(asString(one(db, "PRAGMA user_version")?.user_version));
  if (app !== APPLICATION_ID || version !== SCHEMA_VERSION) fail(`incompatible ledger schema (application ${app}, version ${version}); use the helper pinned by that campaign`);
}

function actor(): Role {
  const value = process.env.LEDGER_ME ?? "";
  if (!Object.values(Role).includes(value as Role)) fail(`LEDGER_ME must be A, B, fixer, or master (got '${value || "unset"}')`);
  return value as Role;
}
function seat(command: string): Seat {
  const value = actor();
  if (value !== Role.A && value !== Role.B) fail(`LEDGER_ME must be A or B for '${command}'`);
  return value;
}
function isSingle(db: DatabaseSync): boolean { return meta(db, "mode") === "single"; }
function isJoint(db: DatabaseSync): boolean { return meta(db, "mode") === "joint"; }
function other(value: Seat): Seat { return value === Role.A ? Role.B : Role.A; }

function activeDatabasePath(): string {
  if (!existsSync(SHARED)) fail(`no ledger at ${SHARED}; run ledger init first`);
  const who = process.env.LEDGER_ME ?? "";
  if (who !== Role.A && who !== Role.B) return SHARED;
  const cold = join(DIR, `cold-${who}.db`);
  if (!existsSync(cold)) return SHARED;
  const imported = withDatabase(SHARED, (db) => { validateDatabase(db); return Boolean(one(db, "SELECT 1 FROM imports WHERE seat=?", who)); }, true);
  return imported ? SHARED : cold;
}
function mutate<T>(work: (db: DatabaseSync) => T, clearSignature = true): T {
  return withWriteLock(() => {
    const path = activeDatabasePath();
    return withDatabase(path, (db) => transaction(db, () => {
      validateDatabase(db);
      const result = work(db);
      if (clearSignature && path === SHARED) db.exec("DELETE FROM signatures;");
      return result;
    }));
  });
}
function read<T>(work: (db: DatabaseSync) => T): T { return withDatabase(activeDatabasePath(), (db) => { validateDatabase(db); return work(db); }, true); }

function parseOptions(args: string[]): Map<string, string | boolean> {
  const options = new Map<string, string | boolean>();
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token.startsWith("--")) fail(`unexpected argument '${token}'`);
    const key = token.slice(2), next = args[index + 1];
    if (next && !next.startsWith("--")) { options.set(key, next); index += 1; } else options.set(key, true);
  }
  return options;
}
function parseKeyValues(args: string[]): KeyValues {
  const values = new Map<string, string | null>();
  for (const token of args) {
    const split = token.indexOf("=");
    if (split < 1) fail(`expected key=value, got '${token}'`);
    const key = token.slice(0, split);
    let value: string | null = token.slice(split + 1);
    if (value.startsWith("@")) { const path = resolveEvidence(value.slice(1), false); value = readFileSync(path, "utf8").trimEnd(); }
    values.set(key, value === "" ? null : value);
  }
  return values;
}
function pick(values: KeyValues, key: string, fallback: string | null = null, ...aliases: string[]): string | null {
  for (const name of [key, ...aliases]) if (values.has(name)) return values.get(name) ?? null;
  return fallback;
}
function required(values: KeyValues, key: string, ...aliases: string[]): string {
  const value = pick(values, key, null, ...aliases);
  if (!value?.trim()) fail(`missing ${key}=...`);
  return value;
}
function integer(value: string | null, name: string): number { if (value === null || !/^\d+$/.test(value)) fail(`${name} must be an integer`); return Number(value); }
function booleanValue(value: string | null, name: string, fallback: boolean): number {
  if (value === null) return fallback ? 1 : 0;
  if (["yes", "true", "1"].includes(value)) return 1;
  if (["no", "false", "0"].includes(value)) return 0;
  fail(`${name} must be yes or no`);
}
function optionalBoolean(value: string | null, name: string, fallback: SqlValue = null): SqlValue {
  if (value === null) return fallback;
  return booleanValue(value, name, false);
}
function tokens(value: string | null): string[] { return value ? value.split(/[\s,]+/).map((item) => item.trim()).filter(Boolean) : []; }
function assertAllowed(values: KeyValues, allowed: string[]): void { const okay = new Set(allowed); for (const key of values.keys()) if (!okay.has(key)) fail(`unknown field '${key}'`); }
function expectedRevision(values: KeyValues, current: number): void { const seen = integer(required(values, "rev"), "rev"); if (seen !== current) fail(`stale revision: read ${seen}, current is ${current}`); }
function resolveEvidence(value: string, requireFile = true): string {
  const path = isAbsolute(value) ? value : join(DIR, value);
  if (requireFile && (!existsSync(path) || !statSync(path).isFile() || statSync(path).size === 0)) fail(`${value} is not an existing non-empty file (absolute or under LEDGER_DIR)`);
  return path;
}

function pinHelper(): void {
  const bin = join(DIR, "bin");
  mkdirSync(bin, { recursive: true });
  copyFileSync(SOURCE_FILE, join(bin, "ledger.ts"));
  copyFileSync(SCHEMA_FILE, join(bin, "ledger.sql"));
  chmodSync(join(bin, "ledger.ts"), 0o755);
  writeFileSync(join(bin, "ledger.sh"), `#!/bin/sh\nexec node --no-warnings "$(dirname "$0")/ledger.ts" "$@"\n`);
  chmodSync(join(bin, "ledger.sh"), 0o755);
}
function event(db: DatabaseSync, who: Role, kind: string, id: string | null, rev: number | null, detail: string): void {
  run(db, "INSERT INTO events(who,kind,object_id,object_rev,detail) VALUES (?,?,?,?,?)", who, kind, id, rev, detail);
}
function objectId(db: DatabaseSync, kind: "coverage"|"claim"|"decision"|"remedy"|"landing"|"delivery", who: Role): string {
  const tables = { coverage: "coverage", claim: "claims", decision: "decisions", remedy: "remedies", landing: "landings", delivery: "deliveries" } as const;
  const prefixes = { coverage: "V", claim: "C", decision: "D", remedy: "R", landing: "L", delivery: "Y" } as const;
  const code = who === Role.Fixer ? "F" : who === Role.Master ? "M" : who;
  const count = Number(asString(one(db, `SELECT count(*) AS n FROM ${tables[kind]} WHERE owner=?`, who)?.n));
  return `${prefixes[kind]}-${code}-${count + 1}`;
}
function current(db: DatabaseSync, view: string, id: string): Row { const row = one(db, `SELECT * FROM ${view} WHERE id=?`, id); if (!row) fail(`unknown object ${id}`); return row; }
function currentRef(db: DatabaseSync, table: string, id: string): number { const row = one(db, `SELECT current_rev FROM ${table} WHERE id=?`, id); if (!row) fail(`unknown ${table.slice(0, -1)} ${id}`); return Number(row.current_rev); }
function ensureEditorIsOther(row: Row, who: Seat): void { if (asString(row.editor) === who) fail(`${row.id} was last edited by ${who}; the other seat reviews it`); }
function validateClaimContent(content: Row, state: string): void {
  const certainty = Number(content.certainty);
  if (certainty < 1 || certainty > 5) fail("certainty must be between 1 and 5");
  if (state === ClaimState.Verified && (certainty < 4 || !asString(content.evidence_path))) fail("a verified Claim needs certainty 4 or 5 and evidence=path");
  if (state === ClaimState.Assumed && !asString(content.assumption)) fail("an assumed Claim needs assumption=reason");
  if (state === ClaimState.Accepted && (asString(content.label) !== "Nit" || !asString(content.disposition))) fail("an accepted Claim must be a Nit with disposition=reason");
  if ([ClaimState.Verified, ClaimState.Assumed].includes(state as never) && ["Bug", "Restructure"].includes(asString(content.label))) {
    for (const field of ["trigger", "impact"]) if (!asString(content[field])) fail(`a ${content.label} Claim in ${state} needs ${field}=...`);
  }
}
function addLinks(db: DatabaseSync, table: "claim_parents"|"decision_claims"|"remedy_claims", id: string, rev: number, ids: string[]): void {
  for (const linked of ids) {
    const linkedRev = currentRef(db, "claims", linked);
    if (table === "claim_parents") run(db, "INSERT INTO claim_parents(claim_id,claim_rev,parent_id,parent_rev) VALUES (?,?,?,?)", id, rev, linked, linkedRev);
    else if (table === "decision_claims") run(db, "INSERT INTO decision_claims(decision_id,decision_rev,claim_id,claim_rev) VALUES (?,?,?,?)", id, rev, linked, linkedRev);
    else run(db, "INSERT INTO remedy_claims(remedy_id,remedy_rev,claim_id,claim_rev) VALUES (?,?,?,?)", id, rev, linked, linkedRev);
  }
}
function existingLinks(db: DatabaseSync, table: "claim_parents"|"decision_claims"|"remedy_claims", id: string, rev: number): string[] {
  const idColumn = table === "claim_parents" ? "claim_id" : table === "decision_claims" ? "decision_id" : "remedy_id";
  const revColumn = table === "claim_parents" ? "claim_rev" : table === "decision_claims" ? "decision_rev" : "remedy_rev";
  const linkColumn = table === "claim_parents" ? "parent_id" : "claim_id";
  return all(db, `SELECT ${linkColumn} AS id FROM ${table} WHERE ${idColumn}=? AND ${revColumn}=? ORDER BY ${linkColumn}`, id, rev).map((row) => asString(row.id));
}

function initialize(args: string[]): void {
  mkdirSync(DIR, { recursive: true });
  const options = parseOptions(args);
  if (options.has("cold")) { initializeCold(); return; }
  if (existsSync(SHARED)) fail(`ledger already exists at ${SHARED}`);
  if (!existsSync(SCHEMA_FILE)) fail(`schema not found beside helper: ${SCHEMA_FILE}`);
  const single = options.has("single"), who = actor();
  if (single && who !== Role.A) fail("a single-seat campaign requires LEDGER_ME=A");
  if (!single && who !== Role.Master) fail("a joint campaign is initialized by LEDGER_ME=master");
  const route = String(options.get("route") ?? "");
  if (!["review", "diagnose"].includes(route)) fail("--route must be review or diagnose");
  const policy = String(options.get("policy") ?? Policy.Report);
  if (!Object.values(Policy).includes(policy as never)) fail("--policy must be report, prepare, land, or check-in");
  const scribe = single ? "A" : String(options.get("scribe") ?? "");
  if (!["A", "B"].includes(scribe)) fail("--scribe must be A or B");
  const joint = String(options.get("joint") ?? join(DIR, single ? `${route}-report.md` : "joint-report.md"));
  if (!single && !options.has("joint")) fail("a joint campaign needs --joint <path>");
  const names = new Map<string, string>();
  for (const item of tokens(String(options.get("names") ?? ""))) { const split = item.indexOf("="); if (split > 0) names.set(item.slice(0, split), item.slice(split + 1)); }
  if (!single) for (const name of ["A", "B", "fixer", "master"]) if (!names.get(name)) fail(`--names is missing ${name}=...`);
  withWriteLock(() => withDatabase(SHARED, (db) => {
    db.exec(readFileSync(SCHEMA_FILE, "utf8"));
    transaction(db, () => {
      const entries: Record<string, string> = {
        mode: single ? "single" : "joint", route, policy, scribe,
        joint_path: isAbsolute(joint) ? joint : resolve(joint), created_at: now(),
        name_A: names.get("A") ?? "A", name_B: names.get("B") ?? "B",
        name_fixer: names.get("fixer") ?? "fixer", name_master: names.get("master") ?? "master",
      };
      for (const [key, value] of Object.entries(entries)) setMeta(db, key, value);
      for (const cluster of tokens(String(options.get("clusters") ?? ""))) run(db, "INSERT INTO partition(kind,name) VALUES ('cluster',?)", cluster);
      event(db, who, "init", null, null, `${entries.mode} ${route}, policy ${policy}`);
    });
  }));
  pinHelper();
  console.log(`initialized ${single ? "single seat A" : `joint, scribe ${scribe}`} at ${SHARED}`);
  console.log(`stopping policy: ${policy}`);
  console.log(`pinned helper: ${join(DIR, "bin", "ledger.ts")}`);
}
function initializeCold(): void {
  const who = seat("init --cold");
  if (!existsSync(SHARED)) fail("initialize the shared campaign first");
  const cold = join(DIR, `cold-${who}.db`);
  if (existsSync(cold)) fail(`${cold} already exists`);
  withWriteLock(() => {
    const sharedData = withDatabase(SHARED, (db) => {
      validateDatabase(db);
      if (!isJoint(db)) fail("single-seat campaigns do not use cold ledgers");
      if (one(db, "SELECT 1 FROM imports WHERE seat=?", who)) fail(`${who} has already imported`);
      return { metadata: all(db, "SELECT key,value FROM meta"), partition: all(db, "SELECT kind,name FROM partition") };
    }, true);
    withDatabase(cold, (db) => {
      db.exec(readFileSync(SCHEMA_FILE, "utf8"));
      transaction(db, () => {
        for (const row of sharedData.metadata) setMeta(db, asString(row.key), asString(row.value));
        setMeta(db, "mode", "cold"); setMeta(db, "cold_seat", who);
        for (const row of sharedData.partition) run(db, "INSERT INTO partition(kind,name) VALUES (?,?)", row.kind, row.name);
        event(db, who, "cold-init", null, null, "independent ledger");
      });
    });
  });
  console.log(`initialized cold seat ${who}: ${cold}`);
}

function coverageCommand(operation: string, args: string[]): void {
  const who = seat(`coverage ${operation}`), values = parseKeyValues(operation === "add" ? args : args.slice(1));
  assertAllowed(values, ["rev", "kind", "target", "description", "state", "claim", "evidence", "evidence_path", "note"]);
  mutate((db) => {
    if (operation === "add") {
      const id = objectId(db, "coverage", who), kind = pick(values, "kind", "cluster")!, target = required(values, "target"), state = pick(values, "state", CoverageState.Open)!;
      if (!Object.values(CoverageState).includes(state as never)) fail(`unknown coverage state '${state}'`);
      const claimId = pick(values, "claim"), claimRev = claimId ? currentRef(db, "claims", claimId) : null;
      run(db, "INSERT INTO coverage(id,owner,state) VALUES (?,?,?)", id, who, state);
      run(db, `INSERT INTO coverage_revisions(coverage_id,rev,editor,kind,target,description,claim_id,claim_rev,evidence_path,note) VALUES (?,0,?,?,?,?,?,?,?,?)`,
        id, who, kind, target, pick(values, "description"), claimId, claimRev, pick(values, "evidence", null, "evidence_path"), pick(values, "note"));
      event(db, who, "coverage-add", id, 0, `${kind}:${target} ${state}`); console.log(`added Coverage ${id} rev 0 (${state})`); return;
    }
    if (operation !== "set") fail(`unknown coverage operation '${operation}'`);
    const id = args[0], old = current(db, "current_coverage", id); expectedRevision(values, Number(old.current_rev));
    const rev = Number(old.current_rev) + 1, state = pick(values, "state", asString(old.state))!;
    if (!Object.values(CoverageState).includes(state as never)) fail(`unknown coverage state '${state}'`);
    const claimId = values.has("claim") ? pick(values, "claim") : asString(old.claim_id) || null, claimRev = claimId ? currentRef(db, "claims", claimId) : null;
    run(db, `INSERT INTO coverage_revisions(coverage_id,rev,editor,kind,target,description,claim_id,claim_rev,evidence_path,note) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      id, rev, who, pick(values, "kind", asString(old.kind)), pick(values, "target", asString(old.target)), pick(values, "description", asString(old.description) || null),
      claimId, claimRev, pick(values, "evidence", asString(old.evidence_path) || null, "evidence_path"), pick(values, "note", asString(old.note) || null));
    run(db, "UPDATE coverage SET current_rev=?,state=? WHERE id=?", rev, state, id); event(db, who, "coverage-edit", id, rev, state);
    console.log(`updated Coverage ${id} to rev ${rev} (${state})`);
  });
}

const CLAIM_FIELDS = ["rev", "label", "proposition", "claim", "clusters", "site", "trigger", "cause", "impact", "scope", "frequency", "certainty", "step", "evidence", "evidence_path", "probe", "assumption", "disposition", "reason", "release_gating", "gating", "state", "parents"];
function claimCommand(operation: string, args: string[]): void {
  const who = seat(`claim ${operation}`);
  if (["agree", "contest", "disprove", "dup"].includes(operation)) { markClaim(operation, args, who); return; }
  const values = parseKeyValues(operation === "add" ? args : args.slice(1)); assertAllowed(values, CLAIM_FIELDS);
  mutate((db) => {
    if (operation === "add") {
      const id = objectId(db, "claim", who), state = pick(values, "state", ClaimState.Candidate)!;
      const label = required(values, "label");
      const content: Row = {
        label, proposition: required(values, "proposition", "claim"), clusters: pick(values, "clusters"), site: pick(values, "site"),
        trigger: pick(values, "trigger"), cause: pick(values, "cause"), impact: pick(values, "impact"), scope: pick(values, "scope"), frequency: pick(values, "frequency"),
        certainty: integer(pick(values, "certainty", pick(values, "step", "1")), "certainty"), evidence_path: pick(values, "evidence", null, "evidence_path"),
        probe: pick(values, "probe"), assumption: pick(values, "assumption"), disposition: pick(values, "disposition", pick(values, "reason")),
        release_gating: booleanValue(pick(values, "release_gating", pick(values, "gating")), "release_gating", ["Bug", "Restructure"].includes(label)),
      };
      if (![ClaimState.Candidate, ClaimState.Verifying, ClaimState.Verified, ClaimState.Assumed].includes(state as never)) fail(`Claim add cannot enter '${state}'; use the named transition`);
      validateClaimContent(content, state);
      run(db, "INSERT INTO claims(id,owner,state) VALUES (?,?,?)", id, who, state);
      run(db, `INSERT INTO claim_revisions(claim_id,rev,editor,label,proposition,clusters,site,trigger,cause,impact,scope,frequency,certainty,evidence_path,probe,assumption,disposition,release_gating) VALUES (?,0,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        id, who, content.label, content.proposition, content.clusters, content.site, content.trigger, content.cause, content.impact, content.scope, content.frequency, content.certainty, content.evidence_path, content.probe, content.assumption, content.disposition, content.release_gating);
      addLinks(db, "claim_parents", id, 0, tokens(pick(values, "parents"))); event(db, who, "claim-add", id, 0, `${content.label}: ${content.proposition}`);
      console.log(`added Claim ${id} rev 0 (${state})`); return;
    }
    if (!["set", "accept"].includes(operation)) fail(`unknown claim operation '${operation}'`);
    const id = args[0], old = current(db, "current_claims", id); expectedRevision(values, Number(old.current_rev));
    const rev = Number(old.current_rev) + 1, state = operation === "accept" ? ClaimState.Accepted : pick(values, "state", ClaimState.Candidate)!;
    const content: Row = {
      label: pick(values, "label", asString(old.label)), proposition: pick(values, "proposition", asString(old.proposition), "claim"), clusters: pick(values, "clusters", asString(old.clusters) || null),
      site: pick(values, "site", asString(old.site) || null), trigger: pick(values, "trigger", asString(old.trigger) || null), cause: pick(values, "cause", asString(old.cause) || null),
      impact: pick(values, "impact", asString(old.impact) || null), scope: pick(values, "scope", asString(old.scope) || null), frequency: pick(values, "frequency", asString(old.frequency) || null),
      certainty: integer(pick(values, "certainty", pick(values, "step", asString(old.certainty))), "certainty"), evidence_path: pick(values, "evidence", asString(old.evidence_path) || null, "evidence_path"),
      probe: pick(values, "probe", asString(old.probe) || null), assumption: pick(values, "assumption", asString(old.assumption) || null),
      disposition: pick(values, "disposition", pick(values, "reason", asString(old.disposition) || null)),
      release_gating: booleanValue(pick(values, "release_gating", pick(values, "gating")), "release_gating", Boolean(old.release_gating)),
    };
    const editableStates = [ClaimState.Candidate, ClaimState.Verifying, ClaimState.Verified, ClaimState.Assumed];
    if (operation !== "accept" && !editableStates.includes(state as never)) fail(`Claim set cannot enter '${state}'; use the named transition`);
    validateClaimContent(content, state);
    run(db, `INSERT INTO claim_revisions(claim_id,rev,editor,label,proposition,clusters,site,trigger,cause,impact,scope,frequency,certainty,evidence_path,probe,assumption,disposition,release_gating) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      id, rev, who, content.label, content.proposition, content.clusters, content.site, content.trigger, content.cause, content.impact, content.scope, content.frequency, content.certainty, content.evidence_path, content.probe, content.assumption, content.disposition, content.release_gating);
    const parents = values.has("parents") ? tokens(pick(values, "parents")) : existingLinks(db, "claim_parents", id, Number(old.current_rev));
    addLinks(db, "claim_parents", id, rev, parents); run(db, "UPDATE claims SET current_rev=?,state=?,dup_of=NULL WHERE id=?", rev, state, id);
    event(db, who, "claim-edit", id, rev, state); console.log(`updated Claim ${id} to rev ${rev} (${state}); linked descendants are stale until rebased`);
  });
}
function markClaim(operation: string, args: string[], who: Seat): void {
  if (!args[0]) fail(`claim ${operation} needs an id`);
  const values = parseKeyValues(args.slice(1)); assertAllowed(values, ["rev", "probe", "evidence", "evidence_path", "of", "note"]);
  mutate((db) => {
    const row = current(db, "current_claims", args[0]); expectedRevision(values, Number(row.current_rev));
    if (!(isSingle(db) && who === Role.A && operation === "agree")) ensureEditorIsOther(row, who);
    let probe: string | null = null, evidence: string | null = null, target: string | null = null;
    if (operation === "agree") {
      if (![ClaimState.Verified, ClaimState.Assumed].includes(asString(row.state) as never)) fail("only a verified or assumed Claim can be agreed");
      validateClaimContent(row, asString(row.state));
    } else if (operation === "contest") { probe = required(values, "probe"); }
    else if (operation === "disprove") { evidence = required(values, "evidence", "evidence_path"); }
    else if (operation === "dup") {
      target = required(values, "of"); if (target === row.id) fail("a claim cannot duplicate itself");
      const targetRow = current(db, "current_claims", target);
      if (asString(targetRow.state) === ClaimState.Duplicate || asString(targetRow.dup_of)) fail("a duplicate target must be a live non-duplicate Claim");
      if (one(db, "SELECT 1 FROM claims WHERE dup_of=?", row.id)) fail("a Claim targeted by another duplicate cannot itself become a duplicate");
    }
    run(db, `INSERT INTO claim_marks(claim_id,claim_rev,seat,verdict,probe,evidence_path,target_id,note) VALUES (?,?,?,?,?,?,?,?)`,
      row.id, row.current_rev, who, operation, probe, evidence, target, pick(values, "note"));
    if (operation === "contest") run(db, "UPDATE claims SET state='contested',dup_of=NULL WHERE id=?", row.id);
    else if (operation === "disprove") run(db, "UPDATE claims SET state='disproved',dup_of=NULL WHERE id=?", row.id);
    else if (operation === "dup") run(db, "UPDATE claims SET state='dup',dup_of=? WHERE id=?", target, row.id);
    event(db, who, `claim-${operation}`, asString(row.id), Number(row.current_rev), probe ?? evidence ?? target ?? "");
    console.log(`${operation}: Claim ${row.id} rev ${row.current_rev} by ${who}`);
  });
}

function decisionCommand(operation: string, args: string[]): void {
  if (operation === "review") { reviewObject("decision", args); return; }
  const who = actor();
  if (who === Role.Fixer) fail("Decisions are edited by A, B, or master");
  const values = parseKeyValues(operation === "add" ? args : args.slice(1));
  assertAllowed(values, ["rev", "claims", "state", "question", "options", "recommendation", "answer", "external_task"]);
  mutate((db) => {
    if (operation === "add") {
      const id = objectId(db, "decision", who), state = required(values, "state");
      if (!Object.values(DecisionState).includes(state as never)) fail(`unknown Decision state '${state}'`);
      const question = required(values, "question"), answer = pick(values, "answer"), claims = tokens(required(values, "claims"));
      if (state === DecisionState.Decided && !answer) fail("a decided Decision needs answer=...");
      run(db, "INSERT INTO decisions(id,owner,state) VALUES (?,?,?)", id, who, state);
      run(db, `INSERT INTO decision_revisions(decision_id,rev,editor,question,options,recommendation,answer,external_task) VALUES (?,0,?,?,?,?,?,?)`,
        id, who, question, pick(values, "options"), pick(values, "recommendation"), answer, pick(values, "external_task"));
      addLinks(db, "decision_claims", id, 0, claims); event(db, who, "decision-add", id, 0, state);
      console.log(`added Decision ${id} rev 0 (${state})`); return;
    }
    if (!["set", "decide"].includes(operation)) fail(`unknown decision operation '${operation}'`);
    const id = args[0], old = current(db, "current_decisions", id); expectedRevision(values, Number(old.current_rev));
    const rev = Number(old.current_rev) + 1, state = operation === "decide" ? DecisionState.Decided : pick(values, "state", asString(old.state))!;
    if (!Object.values(DecisionState).includes(state as never)) fail(`unknown Decision state '${state}'`);
    const question = pick(values, "question", asString(old.question))!, answer = pick(values, "answer", asString(old.answer) || null);
    if (state === DecisionState.Decided && !answer) fail("a decided Decision needs answer=...");
    const claims = values.has("claims") ? tokens(pick(values, "claims")) : existingLinks(db, "decision_claims", id, Number(old.current_rev));
    run(db, `INSERT INTO decision_revisions(decision_id,rev,editor,question,options,recommendation,answer,external_task) VALUES (?,?,?,?,?,?,?,?)`,
      id, rev, who, question, pick(values, "options", asString(old.options) || null), pick(values, "recommendation", asString(old.recommendation) || null), answer, pick(values, "external_task", asString(old.external_task) || null));
    addLinks(db, "decision_claims", id, rev, claims); run(db, "UPDATE decisions SET current_rev=?,state=? WHERE id=?", rev, state, id);
    event(db, who, `decision-${operation}`, id, rev, state); console.log(`updated Decision ${id} to rev ${rev} (${state})`);
  });
}

function remedyComplete(row: Row): string[] {
  return ["origin_class", "fix_shape", "sites_walked", "rulings_checked", "test_seam", "cost", "risk"].filter((field) => !asString(row[field]));
}
function remedyLinksCurrent(db: DatabaseSync, id: string, rev: number): string[] {
  return all(db, `SELECT rc.claim_id FROM remedy_claims rc JOIN claims c ON c.id=rc.claim_id
                  WHERE rc.remedy_id=? AND rc.remedy_rev=? AND (rc.claim_rev<>c.current_rev OR c.state NOT IN ('verified','assumed'))`, id, rev).map((row) => asString(row.claim_id));
}
function remedyCommand(operation: string, args: string[]): void {
  if (operation === "review") { reviewObject("remedy", args); return; }
  const who = seat(`remedy ${operation}`);
  if (operation === "fixable") {
    const values = parseKeyValues(args.slice(1)); assertAllowed(values, ["rev"]);
    mutate((db) => {
      const row = current(db, "current_remedies", args[0]); expectedRevision(values, Number(row.current_rev));
      const missing = remedyComplete(row); if (missing.length) fail(`Remedy ${row.id} is missing ${missing.join(", ")}`);
      if (!Number(row.group_stable)) fail(`Remedy ${row.id} needs stable=yes after its sibling and interaction sweeps`);
      const stale = remedyLinksCurrent(db, asString(row.id), Number(row.current_rev));
      if (stale.length) fail(`Remedy ${row.id} has stale or unsettled Claims: ${stale.join(", ")}`);
      if (isJoint(db) && asString(row.review_mode) === "prior" && !one(db, "SELECT 1 FROM object_marks WHERE kind='remedy' AND object_id=? AND object_rev=? AND verdict='agree'", row.id, row.current_rev)) fail(`Remedy ${row.id} needs an independent agreeing review`);
      if (asString(row.review_mode) === "landing" && (asString(row.origin_class) !== "attention-miss"
        || [row.interface_change, row.ownership_change, row.risk_surface, row.owner_ruling].some((value) => value !== 0))) {
        fail(`Remedy ${row.id} may defer review to its Landing only for an attention-miss with interface_change=no ownership_change=no risk_surface=no owner_ruling=no`);
      }
      if (asString(row.state) === RemedyState.Rejected) fail("a rejected Remedy cannot become fixable without a content revision");
      run(db, "UPDATE remedies SET state='fixable' WHERE id=?", row.id); event(db, who, "remedy-fixable", asString(row.id), Number(row.current_rev), "");
      console.log(`Remedy ${row.id} rev ${row.current_rev} is fixable`);
    });
    return;
  }
  const values = parseKeyValues(operation === "add" ? args : args.slice(1));
  assertAllowed(values, ["rev", "claims", "state", "origin_class", "fix_shape", "sites_walked", "rulings_checked", "test_seam", "cost", "risk", "constraints", "stable", "selected", "review_mode", "interface_change", "ownership_change", "risk_surface", "owner_ruling"]);
  mutate((db) => {
    const add = operation === "add", old = add ? undefined : current(db, "current_remedies", args[0]);
    if (!add && operation !== "set") fail(`unknown remedy operation '${operation}'`);
    if (old) expectedRevision(values, Number(old.current_rev));
    const id = old ? asString(old.id) : objectId(db, "remedy", who), rev = old ? Number(old.current_rev) + 1 : 0;
    const state = pick(values, "state", RemedyState.Draft)!;
    if (state !== RemedyState.Draft) fail(`Remedy content edits return to draft; use review or fixable to enter '${state}'`);
    const content: Row = {
      origin_class: pick(values, "origin_class", old ? asString(old.origin_class) || null : null),
      fix_shape: pick(values, "fix_shape", old ? asString(old.fix_shape) || null : null),
      sites_walked: pick(values, "sites_walked", old ? asString(old.sites_walked) || null : null),
      rulings_checked: pick(values, "rulings_checked", old ? asString(old.rulings_checked) || null : null),
      test_seam: pick(values, "test_seam", old ? asString(old.test_seam) || null : null), cost: pick(values, "cost", old ? asString(old.cost) || null : null),
      risk: pick(values, "risk", old ? asString(old.risk) || null : null), constraints: pick(values, "constraints", old ? asString(old.constraints) || null : null),
      group_stable: booleanValue(pick(values, "stable"), "stable", old ? Boolean(old.group_stable) : false),
      selected: booleanValue(pick(values, "selected"), "selected", old ? Boolean(old.selected) : true),
      review_mode: pick(values, "review_mode", old ? asString(old.review_mode) : "prior"),
      interface_change: optionalBoolean(pick(values, "interface_change"), "interface_change", old?.interface_change ?? null),
      ownership_change: optionalBoolean(pick(values, "ownership_change"), "ownership_change", old?.ownership_change ?? null),
      risk_surface: optionalBoolean(pick(values, "risk_surface"), "risk_surface", old?.risk_surface ?? null),
      owner_ruling: optionalBoolean(pick(values, "owner_ruling"), "owner_ruling", old?.owner_ruling ?? null),
    };
    const claims = values.has("claims") ? tokens(pick(values, "claims")) : old ? existingLinks(db, "remedy_claims", id, Number(old.current_rev)) : tokens(required(values, "claims"));
    if (!claims.length) fail("a Remedy needs claims=...");
    if (!old) run(db, "INSERT INTO remedies(id,owner,state) VALUES (?,?,?)", id, who, state);
    run(db, `INSERT INTO remedy_revisions(remedy_id,rev,editor,origin_class,fix_shape,sites_walked,rulings_checked,test_seam,cost,risk,constraints,group_stable,selected,review_mode,interface_change,ownership_change,risk_surface,owner_ruling)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, id, rev, who, content.origin_class, content.fix_shape, content.sites_walked, content.rulings_checked, content.test_seam,
      content.cost, content.risk, content.constraints, content.group_stable, content.selected, content.review_mode, content.interface_change, content.ownership_change, content.risk_surface, content.owner_ruling);
    addLinks(db, "remedy_claims", id, rev, claims); if (old) run(db, "UPDATE remedies SET current_rev=?,state=? WHERE id=?", rev, state, id);
    event(db, who, old ? "remedy-edit" : "remedy-add", id, rev, state);
    console.log(`${old ? "updated" : "added"} Remedy ${id} rev ${rev} (${state})${old ? "; linked Landings are stale" : ""}`);
  });
}

function reviewObject(kind: "decision"|"remedy"|"landing"|"delivery", args: string[]): void {
  const who = seat(`${kind} review`);
  if (!args[0]) fail(`${kind} review needs an id`);
  const values = parseKeyValues(args.slice(1)); assertAllowed(values, ["rev", "verdict", "note"]);
  const views = { decision: "current_decisions", remedy: "current_remedies", landing: "current_landings", delivery: "current_deliveries" } as const;
  mutate((db) => {
    const row = current(db, views[kind], args[0]); expectedRevision(values, Number(row.current_rev));
    const single = isSingle(db);
    if (!single) ensureEditorIsOther(row, who);
    else if (who !== Role.A) fail("single-seat campaigns use seat A");
    const verdict = pick(values, "verdict", "agree")!;
    if (!["agree", "contest", "reject"].includes(verdict)) fail("verdict must be agree, contest, or reject");
    if (verdict === "reject" && kind !== "remedy") fail("only a Remedy review uses reject");
    if (kind === "landing") {
      if (asString(row.state) !== LandingState.RedGreenProved) fail(`Landing ${row.id} must be red-green-proved before review`);
      const remedy = current(db, "current_remedies", asString(row.remedy_id));
      if (Number(row.remedy_rev) !== Number(remedy.current_rev) || asString(remedy.state) !== RemedyState.Fixable) fail(`Landing ${row.id} references a stale or non-fixable Remedy`);
      if (remedyLinksCurrent(db, asString(remedy.id), Number(remedy.current_rev)).length) fail(`Landing ${row.id} references a Remedy with stale Claims`);
      if (asString(remedy.review_mode) === "landing" && asString(remedy.editor) === who) fail(`Landing reviewer ${who} authored Remedy ${remedy.id}; deferred Remedy review needs the other seat`);
      if (!single && verdict === "agree" && asString(remedy.review_mode) === "landing") {
        run(db, "INSERT INTO object_marks(kind,object_id,object_rev,seat,verdict,note) VALUES ('remedy',?,?,?,?,?)", remedy.id, remedy.current_rev, who, verdict, pick(values, "note"));
      }
    }
    if (!single) run(db, "INSERT INTO object_marks(kind,object_id,object_rev,seat,verdict,note) VALUES (?,?,?,?,?,?)", kind, row.id, row.current_rev, who, verdict, pick(values, "note"));
    if (kind === "remedy") run(db, "UPDATE remedies SET state=? WHERE id=?", verdict === "agree" ? RemedyState.Reviewed : verdict === "reject" ? RemedyState.Rejected : RemedyState.Draft, row.id);
    if (kind === "landing" && verdict === "agree") run(db, "UPDATE landings SET state='fix-reviewed' WHERE id=?", row.id);
    event(db, who, `${kind}-review`, asString(row.id), Number(row.current_rev), verdict); console.log(`${kind} ${row.id} rev ${row.current_rev}: ${verdict} by ${who}`);
  });
}

function fileRecord(value: string | null, requiredFile: boolean): [string | null, string | null] {
  if (!value) return [null, null];
  if (requiredFile) { const path = resolveEvidence(value, true); return [value, hashFile(path)]; }
  const path = resolveEvidence(value, false);
  return existsSync(path) && statSync(path).isFile() ? [value, hashFile(path)] : [value, hashText(`reference:${value}`)];
}
function landingCommand(operation: string, args: string[]): void {
  if (operation === "review") { reviewObject("landing", args); return; }
  const who = actor(), single = read((db) => isSingle(db));
  if ((single && who !== Role.A) || (!single && who !== Role.Fixer)) fail(`Landing edits belong to ${single ? "A in a single-seat campaign" : "the fixer"}`);
  const values = parseKeyValues(operation === "add" ? args : args.slice(1)); assertAllowed(values, ["rev", "remedy", "artifact", "red_run", "green_run", "note"]);
  mutate((db) => {
    const add = operation === "add", old = add ? undefined : current(db, "current_landings", args[0]);
    if (!add && !["land", "prove"].includes(operation)) fail(`unknown landing operation '${operation}'`);
    if (old) expectedRevision(values, Number(old.current_rev));
    const remedyId = pick(values, "remedy", old ? asString(old.remedy_id) : null); if (!remedyId) fail("a Landing needs remedy=...");
    const remedy = current(db, "current_remedies", remedyId); if (asString(remedy.state) !== RemedyState.Fixable) fail(`Remedy ${remedyId} is not fixable`);
    if (remedyLinksCurrent(db, remedyId, Number(remedy.current_rev)).length) fail(`Remedy ${remedyId} has stale or unsettled Claims`);
    const id = old ? asString(old.id) : objectId(db, "landing", who), rev = old ? Number(old.current_rev) + 1 : 0;
    const artifact = pick(values, "artifact", old ? asString(old.artifact) || null : null), red = pick(values, "red_run", old ? asString(old.red_run) || null : null), green = pick(values, "green_run", old ? asString(old.green_run) || null : null);
    const [artifactValue, artifactHash] = fileRecord(artifact, false), [redValue, redHash] = fileRecord(red, true), [greenValue, greenHash] = fileRecord(green, true);
    let state: (typeof LandingState)[keyof typeof LandingState] = LandingState.Implementing;
    if (operation === "land" || (artifact && operation === "add")) state = LandingState.Landed;
    if (operation === "prove" || (green && operation === "add")) {
      if (!artifact) fail("a proved Landing needs artifact=...");
      if (!green) fail("a proved Landing needs green_run=...");
      if (!red && !asString(remedy.test_seam).startsWith("none:")) fail("a proved Landing needs red_run=... unless the Remedy test seam is none:");
      state = LandingState.RedGreenProved;
    }
    if (!old) run(db, "INSERT INTO landings(id,owner,state) VALUES (?,?,?)", id, who, state);
    run(db, `INSERT INTO landing_revisions(landing_id,rev,editor,remedy_id,remedy_rev,artifact,artifact_hash,red_run,red_hash,green_run,green_hash,note)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, id, rev, who, remedyId, remedy.current_rev, artifactValue, artifactHash, redValue, redHash, greenValue, greenHash, pick(values, "note", old ? asString(old.note) || null : null));
    if (old) run(db, "UPDATE landings SET current_rev=?,state=? WHERE id=?", rev, state, id);
    event(db, who, `landing-${operation}`, id, rev, state); console.log(`${old ? "updated" : "added"} Landing ${id} rev ${rev} (${state})`);
  });
}

function deliveryCommand(operation: string, args: string[]): void {
  if (operation === "review") { reviewObject("delivery", args); return; }
  if (actor() !== Role.Master) fail("Delivery transitions require LEDGER_ME=master");
  const values = parseKeyValues(operation === "add" ? args : args.slice(1)); assertAllowed(values, ["rev", "landing", "changeset", "reason"]);
  mutate((db) => {
    if (operation === "add") {
      const landingId = required(values, "landing"), landing = current(db, "current_landings", landingId);
      if (asString(landing.state) !== LandingState.FixReviewed) fail(`Landing ${landingId} is not fix-reviewed`);
      const remedy = current(db, "current_remedies", asString(landing.remedy_id));
      if (Number(landing.remedy_rev) !== Number(remedy.current_rev) || remedyLinksCurrent(db, asString(remedy.id), Number(remedy.current_rev)).length) fail(`Landing ${landingId} has stale dependencies`);
      const id = objectId(db, "delivery", Role.Master);
      run(db, "INSERT INTO deliveries(id,owner,state) VALUES (?,'master','awaiting-approval')", id);
      run(db, "INSERT INTO delivery_revisions(delivery_id,rev,editor,landing_id,landing_rev) VALUES (?,0,'master',?,?)", id, landingId, landing.current_rev);
      event(db, Role.Master, "delivery-add", id, 0, landingId); console.log(`added Delivery ${id} rev 0 (awaiting-approval)`); return;
    }
    const id = args[0], old = current(db, "current_deliveries", id); expectedRevision(values, Number(old.current_rev));
    if (operation === "approve") {
      if (asString(old.state) !== DeliveryState.AwaitingApproval) fail(`Delivery ${id} is not awaiting approval`);
      run(db, "UPDATE deliveries SET state='approved' WHERE id=?", id); event(db, Role.Master, "delivery-approve", id, Number(old.current_rev), "");
      console.log(`Delivery ${id} approved`); return;
    }
    if (!["check-in", "drop"].includes(operation)) fail(`unknown delivery operation '${operation}'`);
    if (operation === "check-in" && asString(old.state) !== DeliveryState.Approved) fail(`Delivery ${id} must be approved before check-in`);
    const rev = Number(old.current_rev) + 1, changeset = operation === "check-in" ? required(values, "changeset") : asString(old.changeset) || null;
    const reason = operation === "drop" ? required(values, "reason") : asString(old.reason) || null;
    run(db, `INSERT INTO delivery_revisions(delivery_id,rev,editor,landing_id,landing_rev,changeset,reason) VALUES (?,?,'master',?,?,?,?)`,
      id, rev, old.landing_id, old.landing_rev, changeset, reason);
    const state = operation === "check-in" ? DeliveryState.CheckedIn : DeliveryState.Dropped;
    run(db, "UPDATE deliveries SET current_rev=?,state=? WHERE id=?", rev, state, id); event(db, Role.Master, `delivery-${operation}`, id, rev, changeset ?? reason ?? "");
    console.log(`Delivery ${id} ${state}${changeset ? ` in ${changeset}` : ""}`);
  });
}

const IMPORT_TABLES = [
  "claims", "coverage", "decisions", "remedies", "landings", "deliveries",
  "claim_revisions", "claim_parents", "claim_marks", "coverage_revisions",
  "decision_revisions", "decision_claims", "remedy_revisions", "remedy_claims",
  "landing_revisions", "delivery_revisions", "object_marks",
];

function importCold(): void {
  const who = seat("import"), cold = join(DIR, `cold-${who}.db`);
  if (!existsSync(cold)) fail(`no cold ledger for ${who}`);
  withWriteLock(() => withDatabase(SHARED, (db) => {
    validateDatabase(db);
    if (!isJoint(db)) fail("single-seat campaigns do not import");
    if (one(db, "SELECT 1 FROM imports WHERE seat=?", who)) fail(`${who} already imported`);
    db.exec(`ATTACH DATABASE ${quoteSql(cold)} AS cold`);
    try {
      transaction(db, () => {
        db.exec("PRAGMA defer_foreign_keys=ON;");
        const coldApp = Number(asString(one(db, "PRAGMA cold.application_id")?.application_id));
        if (coldApp !== APPLICATION_ID) fail("cold ledger has an incompatible schema");
        for (const table of IMPORT_TABLES) db.exec(`INSERT INTO main.${table} SELECT * FROM cold.${table}`);
        db.exec("INSERT INTO main.events(ts,who,kind,object_id,object_rev,detail) SELECT ts,who,kind,object_id,object_rev,detail FROM cold.events");
        const count = IMPORT_TABLES.slice(0, 6).reduce((sum, table) => sum + Number(asString(one(db, `SELECT count(*) AS n FROM cold.${table}`)?.n)), 0);
        run(db, "INSERT INTO imports(seat,ts,objects) VALUES (?,?,?)", who, now(), count);
        event(db, who, "import", null, null, `${count} objects`); db.exec("DELETE FROM signatures;");
        console.log(`imported ${who}: ${count} objects`);
      });
    } finally { db.exec("DETACH DATABASE cold"); }
  }));
  notify(other(who), `report ready: seat ${who} imported; run ledger status`);
}

function linksStale(db: DatabaseSync, table: string, idColumn: string, revColumn: string, id: string, rev: number): string[] {
  return all(db, `SELECT x.claim_id FROM ${table} x JOIN claims c ON c.id=x.claim_id
                  WHERE x.${idColumn}=? AND x.${revColumn}=? AND x.claim_rev<>c.current_rev`, id, rev).map((row) => asString(row.claim_id));
}

function certificateBlockers(db: DatabaseSync): string[] {
  const blockers: string[] = [];
  if (isJoint(db)) for (const name of ["A", "B"]) if (!one(db, "SELECT 1 FROM imports WHERE seat=?", name)) blockers.push(`seat ${name} has not imported`);
  for (const row of all(db, `SELECT p.kind,p.name FROM partition p WHERE NOT EXISTS (
      SELECT 1 FROM current_coverage c WHERE c.kind=p.kind AND c.target=p.name AND c.state='accounted') ORDER BY p.kind,p.name`)) blockers.push(`uncovered ${row.kind} ${row.name}`);
  for (const row of all(db, "SELECT id,target FROM current_coverage WHERE state='gap' ORDER BY id")) blockers.push(`Coverage ${row.id} is a gap (${row.target})`);
  for (const row of all(db, "SELECT * FROM current_coverage WHERE claim_id IS NOT NULL")) {
    const claim = one(db, "SELECT current_rev FROM claims WHERE id=?", row.claim_id);
    if (!claim || Number(claim.current_rev) !== Number(row.claim_rev)) blockers.push(`Coverage ${row.id} references stale Claim ${row.claim_id}`);
  }
  for (const row of all(db, "SELECT * FROM current_claims ORDER BY id")) {
    const state = asString(row.state);
    if (Number(row.release_gating) && [ClaimState.Candidate, ClaimState.Verifying, ClaimState.Contested].includes(state as never)) blockers.push(`Claim ${row.id} is ${state}`);
    try { validateClaimContent(row, state); } catch (error) { blockers.push(`Claim ${row.id}: ${errorText(error)}`); }
    for (const parent of all(db, `SELECT cp.parent_id FROM claim_parents cp JOIN claims c ON c.id=cp.parent_id
                                 WHERE cp.claim_id=? AND cp.claim_rev=? AND cp.parent_rev<>c.current_rev`, row.id, row.current_rev)) blockers.push(`Claim ${row.id} has stale parent ${parent.parent_id}`);
    if (isJoint(db) && Number(row.release_gating) && [ClaimState.Verified, ClaimState.Assumed].includes(state as never)
      && !one(db, "SELECT 1 FROM claim_marks WHERE claim_id=? AND claim_rev=? AND verdict='agree' AND seat<>?", row.id, row.current_rev, row.editor)) blockers.push(`Claim ${row.id} lacks a current independent agreement`);
  }
  for (const row of all(db, "SELECT * FROM current_decisions ORDER BY id")) {
    for (const stale of linksStale(db, "decision_claims", "decision_id", "decision_rev", asString(row.id), Number(row.current_rev))) blockers.push(`Decision ${row.id} references stale Claim ${stale}`);
    if (asString(row.state) !== DecisionState.Decided) blockers.push(`Decision ${row.id} is ${row.state}`);
    if (isJoint(db) && asString(row.state) === DecisionState.Decided
      && !one(db, "SELECT 1 FROM object_marks WHERE kind='decision' AND object_id=? AND object_rev=? AND verdict='agree' AND seat<>?", row.id, row.current_rev, row.editor)) blockers.push(`Decision ${row.id} lacks a current independent agreement`);
  }
  const policy = meta(db, "policy"), needsPrepare = [Policy.Prepare, Policy.Land, Policy.CheckIn].includes(policy as never);
  for (const row of all(db, "SELECT * FROM current_remedies ORDER BY id")) {
    for (const stale of remedyLinksCurrent(db, asString(row.id), Number(row.current_rev))) blockers.push(`Remedy ${row.id} references stale or unsettled Claim ${stale}`);
    if (needsPrepare && Number(row.selected) && ![RemedyState.Fixable, RemedyState.Rejected].includes(asString(row.state) as never)) blockers.push(`Remedy ${row.id} is ${row.state}`);
  }
  if ([Policy.Land, Policy.CheckIn].includes(policy as never)) {
    for (const remedy of all(db, "SELECT * FROM current_remedies WHERE selected=1 AND state='fixable' ORDER BY id")) {
      if (!one(db, "SELECT 1 FROM current_landings l WHERE l.remedy_id=? AND l.remedy_rev=? AND l.state='fix-reviewed'", remedy.id, remedy.current_rev)) blockers.push(`Remedy ${remedy.id} has no current fix-reviewed Landing`);
    }
  }
  for (const row of all(db, "SELECT * FROM current_landings ORDER BY id")) {
    const remedy = one(db, "SELECT current_rev FROM remedies WHERE id=?", row.remedy_id);
    if (!remedy || Number(remedy.current_rev) !== Number(row.remedy_rev)) blockers.push(`Landing ${row.id} references stale Remedy ${row.remedy_id}`);
    else if (remedyLinksCurrent(db, asString(row.remedy_id), Number(row.remedy_rev)).length) blockers.push(`Landing ${row.id} references stale Remedy ${row.remedy_id}`);
  }
  if (policy === Policy.CheckIn) {
    for (const landing of all(db, "SELECT * FROM current_landings WHERE state='fix-reviewed' ORDER BY id")) {
      if (!one(db, "SELECT 1 FROM current_deliveries d WHERE d.landing_id=? AND d.landing_rev=? AND d.state IN ('checked-in','dropped')", landing.id, landing.current_rev)) blockers.push(`Landing ${landing.id} has no checked-in or dropped Delivery`);
    }
  }
  for (const row of all(db, "SELECT * FROM current_deliveries ORDER BY id")) {
    const landing = one(db, "SELECT current_rev FROM landings WHERE id=?", row.landing_id);
    if (!landing || Number(landing.current_rev) !== Number(row.landing_rev)) blockers.push(`Delivery ${row.id} references stale Landing ${row.landing_id}`);
    else {
      const landingRow = one(db, "SELECT remedy_id,remedy_rev FROM current_landings WHERE id=?", row.landing_id);
      const remedy = landingRow ? one(db, "SELECT current_rev FROM remedies WHERE id=?", landingRow.remedy_id) : undefined;
      if (!landingRow || !remedy || Number(remedy.current_rev) !== Number(landingRow.remedy_rev)
        || remedyLinksCurrent(db, asString(landingRow.remedy_id), Number(landingRow.remedy_rev)).length) blockers.push(`Delivery ${row.id} references stale Landing ${row.landing_id}`);
    }
    if (policy === Policy.CheckIn && !one(db, "SELECT 1 FROM object_marks WHERE kind='delivery' AND object_id=? AND object_rev=? AND verdict='agree'", row.id, row.current_rev)) blockers.push(`Delivery ${row.id} lacks a current independent agreement`);
  }
  return blockers;
}

const HASH_TABLES = [
  "meta", "partition", "imports", "coverage", "coverage_revisions", "claims", "claim_revisions", "claim_parents", "claim_marks",
  "decisions", "decision_revisions", "decision_claims", "remedies", "remedy_revisions", "remedy_claims", "object_marks",
  "landings", "landing_revisions", "deliveries", "delivery_revisions",
];
function stateHash(db: DatabaseSync): string {
  const state: Record<string, Row[]> = {};
  for (const tableName of HASH_TABLES) state[tableName] = all(db, `SELECT * FROM ${tableName} ORDER BY 1,2`);
  return hashText(JSON.stringify(state));
}

function md(value: SqlValue | undefined): string { return asString(value).replaceAll("|", "\\|").replaceAll("\n", "<br>") || "-"; }
function markdownTable(headers: string[], rows: string[][]): string {
  if (!rows.length) return "_None._\n";
  return `| ${headers.join(" | ")} |\n| ${headers.map(() => "---").join(" | ")} |\n${rows.map((row) => `| ${row.join(" | ")} |`).join("\n")}\n`;
}
function renderReport(db: DatabaseSync, kind = "Snapshot"): string {
  const blockers = certificateBlockers(db), coverage = all(db, "SELECT * FROM current_coverage ORDER BY kind,target,id"), claims = all(db, "SELECT * FROM current_claims ORDER BY id");
  const decisions = all(db, "SELECT * FROM current_decisions ORDER BY id"), remedies = all(db, "SELECT * FROM current_remedies ORDER BY id");
  const landings = all(db, "SELECT * FROM current_landings ORDER BY id"), deliveries = all(db, "SELECT * FROM current_deliveries ORDER BY id");
  const lines = [
    `# ${kind}: ${meta(db, "route")} campaign`, "", `- Stopping policy: ${meta(db, "policy")}`,
    `- Mode: ${meta(db, "mode") === "cold" ? "cold" : meta(db, "mode")}`,
    `- Frozen partition: ${all(db, "SELECT kind,name FROM partition ORDER BY kind,name").map((row) => `${row.kind}:${row.name}`).join(", ") || "none declared"}`,
    `- Certificate blockers: ${blockers.length}`, "", "## Coverage", "",
    markdownTable(["ID", "Kind", "Target", "State", "Claim", "Evidence"], coverage.map((row) => [md(row.id), md(row.kind), md(row.target), md(row.state), md(row.claim_id), md(row.evidence_path)])), "",
    "## Claims", "", markdownTable(["ID", "Rev", "Label", "Gating", "State", "Step", "Proposition", "Evidence"], claims.map((row) => [md(row.id), md(row.current_rev), md(row.label), Number(row.release_gating) ? "yes" : "no", md(row.state), md(row.certainty), md(row.proposition), md(row.evidence_path)])), "",
    "## Decisions", "", markdownTable(["ID", "Rev", "State", "Question", "Recommendation", "Answer"], decisions.map((row) => [md(row.id), md(row.current_rev), md(row.state), md(row.question), md(row.recommendation), md(row.answer)])), "",
    "## Remedies", "", markdownTable(["ID", "Rev", "State", "Shape", "Seam", "Cost", "Risk"], remedies.map((row) => [md(row.id), md(row.current_rev), md(row.state), md(row.fix_shape), md(row.test_seam), md(row.cost), md(row.risk)])), "",
    "## Landings", "", markdownTable(["ID", "Rev", "State", "Remedy", "Artifact", "Red", "Green"], landings.map((row) => [md(row.id), md(row.current_rev), md(row.state), md(row.remedy_id), md(row.artifact), md(row.red_run), md(row.green_run)])), "",
    "## Deliveries", "", markdownTable(["ID", "Rev", "State", "Landing", "Changeset", "Reason"], deliveries.map((row) => [md(row.id), md(row.current_rev), md(row.state), md(row.landing_id), md(row.changeset), md(row.reason)])), "",
    "## Open work", "", ...(blockers.length ? blockers.map((item) => `- ${item}`) : ["- None. This state can be certified."]), "",
  ];
  for (const note of ["A-notes.md", "B-notes.md"]) {
    const path = join(DIR, note);
    if (existsSync(path) && statSync(path).size > 0) lines.push(`## ${note}`, "", readFileSync(path, "utf8").trimEnd(), "");
  }
  return lines.join("\n");
}

function status(): void {
  read((db) => {
    const who = actor(), mode = meta(db, "mode"), scribe = meta(db, "scribe");
    console.log(`${meta(db, "route")} campaign, policy ${meta(db, "policy")}, ${mode}${mode === "joint" ? `, scribe ${scribe}` : ""}`);
    console.log(`you: ${who}${who === scribe ? " (scribe)" : mode === "joint" && who === other(scribe as Seat) ? " (countersigner)" : ""}`);
    if (mode === "cold") console.log("cold: independent until import");
    const summary = (view: string) => all(db, `SELECT state,count(*) AS n FROM ${view} GROUP BY state ORDER BY state`).map((row) => `${row.state} ${row.n}`).join(", ") || "none";
    console.log(`coverage: ${summary("current_coverage")}`);
    const uncovered = all(db, `SELECT p.kind,p.name FROM partition p WHERE NOT EXISTS (SELECT 1 FROM current_coverage c WHERE c.kind=p.kind AND c.target=p.name AND c.state='accounted') ORDER BY p.kind,p.name`);
    console.log(`uncovered: ${uncovered.map((row) => `${row.kind}:${row.name}`).join(", ") || "none"}`);
    console.log(`claims: ${summary("current_claims")}`); console.log(`decisions: ${summary("current_decisions")}`); console.log(`remedies: ${summary("current_remedies")}`);
    console.log(`landings: ${summary("current_landings")}`); console.log(`deliveries: ${summary("current_deliveries")}`);
    const ready: string[] = [];
    if (who === Role.A || who === Role.B) {
      for (const row of all(db, `SELECT id,current_rev,editor FROM current_claims c WHERE state IN ('verified','assumed') AND editor<>?
        AND NOT EXISTS (SELECT 1 FROM claim_marks m WHERE m.claim_id=c.id AND m.claim_rev=c.current_rev AND m.seat=?)`, who, who)) ready.push(`review Claim ${row.id} rev=${row.current_rev}`);
      for (const row of all(db, `SELECT id,current_rev FROM current_remedies r WHERE editor<>? AND state='draft'
        AND NOT EXISTS (SELECT 1 FROM object_marks m WHERE m.kind='remedy' AND m.object_id=r.id AND m.object_rev=r.current_rev AND m.seat=?)`, who, who)) ready.push(`review Remedy ${row.id} rev=${row.current_rev}`);
      for (const row of all(db, `SELECT id,current_rev FROM current_landings l WHERE editor<>? AND state='red-green-proved'
        AND NOT EXISTS (SELECT 1 FROM object_marks m WHERE m.kind='landing' AND m.object_id=l.id AND m.object_rev=l.current_rev AND m.seat=?)`, who, who)) ready.push(`review Landing ${row.id} rev=${row.current_rev}`);
      for (const row of all(db, `SELECT id,current_rev FROM current_deliveries d WHERE editor<>?
        AND NOT EXISTS (SELECT 1 FROM object_marks m WHERE m.kind='delivery' AND m.object_id=d.id AND m.object_rev=d.current_rev AND m.seat=?)`, who, who)) ready.push(`review Delivery ${row.id} rev=${row.current_rev}`);
    }
    if (who === Role.Fixer || isSingle(db)) for (const row of all(db, `SELECT r.id,r.current_rev FROM current_remedies r
      WHERE r.state='fixable' AND r.selected=1 AND NOT EXISTS (
        SELECT 1 FROM current_landings l WHERE l.remedy_id=r.id AND l.remedy_rev=r.current_rev AND l.state IN ('red-green-proved','fix-reviewed'))`)) ready.push(`implement Remedy ${row.id} rev=${row.current_rev}`);
    if (who === Role.Master) {
      for (const row of all(db, "SELECT id,current_rev,state FROM current_decisions WHERE state<>'decided'")) ready.push(`resolve Decision ${row.id} rev=${row.current_rev} (${row.state})`);
      for (const row of all(db, "SELECT id,current_rev FROM current_deliveries WHERE state='awaiting-approval'")) ready.push(`seek approval for Delivery ${row.id} rev=${row.current_rev}`);
    }
    console.log("ready work:"); for (const item of ready.length ? ready : ["none"]) console.log(`  ${item}`);
    const blockers = certificateBlockers(db); console.log(`certificate blockers: ${blockers.length}`); for (const item of blockers) console.log(`  ${item}`);
    const signature = one(db, "SELECT seat,ts,state_hash FROM signatures"); console.log(`signature: ${signature ? `${signature.seat} at ${signature.ts}${signature.state_hash === stateHash(db) ? "" : " (stale)"}` : "none"}`);
  });
}

function report(args: string[], certificate = false): void {
  const options = parseOptions(args), explicit = options.get("out");
  withWriteLock(() => withDatabase(SHARED, (db) => transaction(db, () => {
    validateDatabase(db);
    const output = renderReport(db, certificate ? "Exhaustive certificate" : "Round snapshot"), destination = explicit ? String(explicit) : meta(db, "joint_path");
    mkdirSync(dirname(destination), { recursive: true }); writeFileSync(destination, output);
    const blockers = certificateBlockers(db);
    run(db, "INSERT INTO snapshots(kind,policy,created_by,state_hash,output_path,open_count) VALUES (?,?,?,?,?,?)", certificate ? "certificate" : "snapshot", meta(db, "policy"), actor(), stateHash(db), destination, blockers.length);
    console.log(`${certificate ? "certificate" : "snapshot"}: ${destination}, open ${blockers.length}, ${output.split("\n").length} lines`);
  })));
}
function render(): void { read((db) => process.stdout.write(renderReport(db) + "\n")); }

function validateNotes(db: DatabaseSync): { a: string; b: string } {
  const result: Record<string, string> = {};
  for (const seatName of ["A", "B"]) {
    const path = join(DIR, `${seatName}-notes.md`);
    if (!existsSync(path) || statSync(path).size === 0) fail(`${seatName}-notes.md is missing or empty`);
    const body = readFileSync(path, "utf8");
    for (const token of ["passes:", "retrospective:", "vote:"]) if (!body.toLowerCase().includes(token)) fail(`${seatName}-notes.md is missing ${token}`);
    if (meta(db, "route") === "review") for (const heading of ["goal closure", "domain scenarios"]) if (!body.toLowerCase().includes(heading)) fail(`${seatName}-notes.md is missing ${heading}`);
    result[seatName.toLowerCase()] = hashText(body);
  }
  return { a: result.a, b: result.b };
}
function testSignBarrier(): void {
  const barrier = process.env.LEDGER_TEST_SIGN_BARRIER;
  if (!barrier) return;
  writeFileSync(`${barrier}.ready`, "ready\n");
  for (let attempt = 0; attempt < 500 && !existsSync(`${barrier}.release`); attempt += 1) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
  if (!existsSync(`${barrier}.release`)) fail("test sign barrier timed out");
}
function sign(args: string[]): void {
  const who = seat("sign"), values = parseKeyValues(args); assertAllowed(values, ["note"]);
  withWriteLock(() => withDatabase(SHARED, (db) => transaction(db, () => {
    validateDatabase(db); if (!isJoint(db)) fail("single-seat campaigns use report, not sign");
    const scribe = meta(db, "scribe") as Seat; if (who !== other(scribe)) fail(`only countersigner ${other(scribe)} signs`);
    const blockers = certificateBlockers(db); if (blockers.length) fail(`cannot sign: ${blockers.length} certificate blockers; first: ${blockers[0]}`);
    testSignBarrier();
    const notes = validateNotes(db), hash = stateHash(db), timestamp = now();
    run(db, "INSERT OR REPLACE INTO signatures(seat,ts,state_hash,notes_a_hash,notes_b_hash,note) VALUES (?,?,?,?,?,?)", who, timestamp, hash, notes.a, notes.b, pick(values, "note"));
    console.log(`signed by ${who} at ${timestamp}, state ${hash.slice(0, 12)}`);
  })));
  notify(metaFromShared("scribe") as Seat, `signed: ${metaFromShared("joint_path")} by seat ${who}; ledger converge`);
}
function converge(): void {
  const who = seat("converge");
  withWriteLock(() => withDatabase(SHARED, (db) => transaction(db, () => {
    validateDatabase(db); const scribe = meta(db, "scribe") as Seat; if (who !== scribe) fail(`only scribe ${scribe} converges`);
    const blockers = certificateBlockers(db); if (blockers.length) fail(`cannot converge: ${blockers.length} certificate blockers; first: ${blockers[0]}`);
    const signature = one(db, "SELECT * FROM signatures WHERE seat=?", other(scribe)); if (!signature) fail(`missing countersignature from ${other(scribe)}`);
    const notes = validateNotes(db), hash = stateHash(db);
    if (asString(signature.state_hash) !== hash) fail("ledger changed after signature");
    if (asString(signature.notes_a_hash) !== notes.a || asString(signature.notes_b_hash) !== notes.b) fail("seat notes changed after signature");
    const output = renderReport(db, "Exhaustive certificate"), destination = meta(db, "joint_path");
    mkdirSync(dirname(destination), { recursive: true }); writeFileSync(destination, output);
    run(db, "INSERT INTO snapshots(kind,policy,created_by,state_hash,output_path,open_count) VALUES ('certificate',?,?,?,?,0)", meta(db, "policy"), who, hash, destination);
    event(db, who, "converge", null, null, hash);
    console.log(`converged: ${destination}. blockers 0, signed by ${signature.seat} at ${signature.ts}, ${output.split("\n").length} lines`);
  })));
  notify("master", `converged: ${metaFromShared("joint_path")}. Gate it.`);
}

function show(id: string): void {
  if (!id) fail("show needs an object id");
  read((db) => {
    const mapping: Record<string, { view: string; revisions: string; key: string; links?: string; linkKey?: string; marks?: string }> = {
      V: { view: "current_coverage", revisions: "coverage_revisions", key: "coverage_id" },
      C: { view: "current_claims", revisions: "claim_revisions", key: "claim_id", links: "claim_parents", linkKey: "claim_id", marks: "claim_marks" },
      D: { view: "current_decisions", revisions: "decision_revisions", key: "decision_id", links: "decision_claims", linkKey: "decision_id", marks: "object_marks" },
      R: { view: "current_remedies", revisions: "remedy_revisions", key: "remedy_id", links: "remedy_claims", linkKey: "remedy_id", marks: "object_marks" },
      L: { view: "current_landings", revisions: "landing_revisions", key: "landing_id", marks: "object_marks" },
      Y: { view: "current_deliveries", revisions: "delivery_revisions", key: "delivery_id", marks: "object_marks" },
    };
    const entry = mapping[id[0]]; if (!entry) fail(`cannot infer object kind from '${id}'`);
    const result: Record<string, unknown> = { current: current(db, entry.view, id), revisions: all(db, `SELECT * FROM ${entry.revisions} WHERE ${entry.key}=? ORDER BY rev`, id) };
    if (entry.links) result.links = all(db, `SELECT * FROM ${entry.links} WHERE ${entry.linkKey}=? ORDER BY 2,3`, id);
    if (entry.marks) result.marks = entry.marks === "claim_marks" ? all(db, "SELECT * FROM claim_marks WHERE claim_id=? ORDER BY claim_rev,seat", id) : all(db, "SELECT * FROM object_marks WHERE object_id=? ORDER BY object_rev,seat", id);
    result.events = all(db, "SELECT ts,who,kind,object_rev,detail FROM events WHERE object_id=? ORDER BY seq", id);
    console.log(JSON.stringify(result, null, 2));
  });
}
function log(id?: string): void {
  read((db) => { for (const row of id ? all(db, "SELECT * FROM events WHERE object_id=? ORDER BY seq", id) : all(db, "SELECT * FROM events ORDER BY seq")) console.log(`${row.ts} ${row.who} ${row.kind}${row.object_id ? ` ${row.object_id}@${row.object_rev}` : ""}${row.detail ? `: ${row.detail}` : ""}`); });
}
function query(sql: string): void {
  if (!/^\s*(select|pragma)\b/i.test(sql) || /;\s*\S/.test(sql.trim())) fail("query accepts one read-only SELECT or PRAGMA");
  read((db) => { for (const row of all(db, sql)) console.log(Object.values(row).map((value) => asString(value)).join("\t")); });
}
function handoff(): void { const who = seat("handoff"); status(); notify(other(who), `ledger: seat ${who} handed off; run ledger status`); }
function metaFromShared(key: string): string { return withDatabase(SHARED, (db) => { validateDatabase(db); return meta(db, key); }, true); }
function notify(target: Seat | "master", message: string): void {
  const configured = (process.env.LEDGER_NOTIFY ?? "").trim(); if (configured === "true" || configured === "false" || configured === "") return;
  let name: string = target;
  try { name = metaFromShared(`name_${target}`); } catch {}
  const [command, ...prefix] = configured.split(/\s+/); spawnSync(command, [...prefix, name, message], { stdio: "ignore" });
}

function main(args: string[]): void {
  delegateToPinned(args);
  if (!args.length || args[0] === "--help" || args[0] === "help") { console.log(HELP); return; }
  const [command, ...rest] = args;
  if (command === "init") return initialize(rest);
  if (command === "migrate") fail("object-ledger migration is intentionally unsupported; finish a live schema-v8 campaign with its pinned ledger.sh or start a new campaign");
  if (command === "coverage") return coverageCommand(rest[0] ?? "", rest.slice(1));
  if (command === "claim") return claimCommand(rest[0] ?? "", rest.slice(1));
  if (command === "decision") return decisionCommand(rest[0] ?? "", rest.slice(1));
  if (command === "remedy") return remedyCommand(rest[0] ?? "", rest.slice(1));
  if (command === "landing") return landingCommand(rest[0] ?? "", rest.slice(1));
  if (command === "delivery") return deliveryCommand(rest[0] ?? "", rest.slice(1));
  if (command === "import") return importCold();
  if (command === "handoff") return handoff();
  if (command === "status") return status();
  if (command === "render") return render();
  if (command === "report" || command === "snapshot") return report(rest);
  if (command === "sign") return sign(rest);
  if (command === "converge") return converge();
  if (command === "show") return show(rest[0]);
  if (command === "log") return log(rest[0]);
  if (command === "query") return query(rest.join(" "));
  if (["add", "set", "agree", "contest", "review", "land", "go", "close"].includes(command)) fail(`schema-v8 command '${command}' is ambiguous in the object ledger; use claim/remedy/landing/delivery <operation> (see --help)`);
  fail(`unknown command '${command}'; run --help`);
}

try { main(process.argv.slice(2)); }
catch (error) { console.error(`ledger: ${errorText(error)}`); process.exitCode = 1; }
