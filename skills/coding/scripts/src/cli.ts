import * as NodeRuntime from "@effect/platform-node/NodeRuntime"
import * as NodeServices from "@effect/platform-node/NodeServices"
import { Console, Effect } from "effect"
import { Argument, CliError, Command, Flag } from "effect/unstable/cli"
import { createHash, randomUUID } from "node:crypto"
import { existsSync, readFileSync, realpathSync, statSync } from "node:fs"
import { extname, isAbsolute, join, relative, resolve } from "node:path"

import {
  ACTORS,
  ALLOW_NO_RED_ANSWER,
  COVERAGE_STATES,
  DEFAULT_POLICY,
  ISSUE_LABELS,
  POLICIES,
  ROUTES,
  type Actor,
  type Certainty,
  type CheckInId,
  type CoverageId,
  type ImpactRank,
  type IssueId,
  type IssueLabel,
  type LedgerRow,
  type Policy,
  type ProposedFixId,
  type ProposedFixShape,
  type ProtocolCommand,
  type ProtocolState,
  type QuestionId,
  type RowId,
  type Seat,
  type ShelvedFixId,
  decodeProtocolState,
  initialProtocolState,
  parseClusterTokens,
  readyWork,
} from "./protocol.js"
import {
  InputError,
  allowOnly,
  assertNoPositionals,
  assertOnePositional,
  booleanField,
  integerInRange,
  listField,
  optionList,
  optional,
  parseFields,
  required,
  requiredRevision,
  type Fields,
} from "./fields.js"
import { renderReport, renderStatus, renderTimeline, type ReportNotes } from "./report.js"
import {
  type MutationResult,
  type TimelineEvent,
  importedEventsFrom,
  initializeDatabase,
  mutateDatabase,
  mutateDatabaseFromState,
  protocolEngine,
  readLedgerView,
  sealImportBundle,
  readSnapshot,
} from "./store.js"
import {
  actorFromEnvironment,
  coldDatabasePath,
  delegateToPinned,
  deliverNotification,
  pinCurrentHelper,
  runDirectory,
  sharedDatabasePath,
  writeReportAtomically,
} from "./runtime.js"

delegateToPinned()

const VERSION = "2.0.0"

const codec = protocolEngine

function now(): string {
  return new Date().toISOString()
}

function asError(value: unknown): CliError.UserError {
  if (CliError.isCliError(value) && value._tag === "UserError") return value
  const cause = value instanceof Error ? value : new Error(String(value))
  return new CliError.UserError({ cause, userMessage: cause.message })
}

function trySync<A>(work: () => A): Effect.Effect<A, Error> {
  return Effect.try({ try: work, catch: asError })
}

function reviewer(actor: Actor, command: string): Seat {
  if (actor === "A" || actor === "B") return actor
  throw new InputError(`LEDGER_ME must be A or B for '${command}'`)
}

function master(actor: Actor, command: string): "master" {
  if (actor === "master") return actor
  throw new InputError(`LEDGER_ME must be master for '${command}'`)
}

function rowId(value: string): RowId {
  if (/^(?:C|I|Q|P|S)-(?:A|B)-\d+$/.test(value) || /^K-M-\d+$/.test(value)) return value as RowId
  throw new InputError(`invalid row id '${value}'`)
}

function typedId<Id extends RowId>(value: string, prefix: string): Id {
  const id = rowId(value)
  if (!id.startsWith(`${prefix}-`)) throw new InputError(`${value} is not a ${prefix} row id`)
  return id as Id
}

function nextId(state: ProtocolState, prefix: "C" | "I" | "Q" | "P" | "S" | "K", actor: Actor): RowId {
  const owner = prefix === "K" ? "M" : actor
  if (owner === "master") throw new InputError(`${prefix} rows cannot be authored by master`)
  const pattern = new RegExp(`^${prefix}-${owner}-(\\d+)$`)
  const current = state.rows.reduce((maximum, row) => {
    const found = pattern.exec(row.id)
    return found ? Math.max(maximum, Number(found[1])) : maximum
  }, 0)
  return `${prefix}-${owner}-${current + 1}` as RowId
}

function findRow<Kind extends LedgerRow["kind"]>(state: ProtocolState, id: RowId, kind: Kind): Extract<LedgerRow, { kind: Kind }> {
  const row = state.rows.find((candidate) => candidate.id === id)
  if (!row) throw new InputError(`row ${id} does not exist`)
  if (row.kind !== kind) throw new InputError(`${id} is ${row.kind}, not ${kind}`)
  return row as Extract<LedgerRow, { kind: Kind }>
}

function runLogPath(value: string, field: string): string {
  const directory = runDirectory()
  const absolute = isAbsolute(value) ? resolve(value) : resolve(directory, value)
  const inside = relative(directory, absolute)
  if (inside.startsWith("..") || isAbsolute(inside)) {
    throw new InputError(`${field} must name a log inside ${directory}`)
  }
  if (!existsSync(absolute) || !statSync(absolute).isFile()) {
    throw new InputError(`${field} log does not exist: ${value}`)
  }
  const realDirectory = realpathSync(directory)
  const realLog = realpathSync(absolute)
  const realInside = relative(realDirectory, realLog)
  if (realInside.startsWith("..") || isAbsolute(realInside)) {
    throw new InputError(`${field} must not escape ${directory} through a symlink`)
  }
  return inside || value
}

function parseNames(raw: string, requireAll = false): Readonly<Record<Actor, string>> {
  const names: Record<Actor, string> = { A: "A", B: "B", master: "master" }
  const seen = new Set<Actor>()
  const assignments = raw.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? []
  for (const assignment of assignments) {
    const separator = assignment.indexOf("=")
    if (separator < 1) throw new InputError(`--names entries are A=name, B=name, or master=name (got '${assignment}')`)
    const key = assignment.slice(0, separator) as Actor
    let value = assignment.slice(separator + 1)
    if (!ACTORS.includes(key)) throw new InputError(`unknown name '${key}'`)
    if (seen.has(key)) throw new InputError(`name ${key} was provided twice`)
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!value) throw new InputError(`name ${key} must not be empty`)
    seen.add(key)
    names[key] = value
  }
  if (requireAll) {
    const missing = ACTORS.filter((actor) => !seen.has(actor))
    if (missing.length > 0) throw new InputError(`--names needs A, B, and master; missing ${missing.join(", ")}`)
  }
  return names
}

function parseDeclaredCoverage(input: {
  readonly hunks: string
  readonly symptoms: string
  readonly clusters: string
  readonly scenarios: string
}): ProtocolState["declaredCoverage"] {
  const exactTargets = (raw: string): readonly string[] =>
    raw.split(/[\n,]+/).map((target) => target.trim()).filter(Boolean)
  return [
    ...exactTargets(input.hunks).map((target) => ({ coverageKind: "hunk" as const, target })),
    ...exactTargets(input.symptoms).map((target) => ({ coverageKind: "symptom" as const, target })),
    ...parseClusterTokens(input.clusters).map((target) => ({ coverageKind: "cluster" as const, target })),
    ...exactTargets(input.scenarios).map((target) => ({ coverageKind: "scenario" as const, target })),
  ]
}

function reportPath(value: string): string {
  const directory = runDirectory()
  const destination = resolve(value)
  const inside = relative(directory, destination)
  if (!inside || inside.startsWith("..") || isAbsolute(inside)) {
    throw new InputError(`report path must be a Markdown file inside ${directory}`)
  }
  if (extname(destination).toLowerCase() !== ".md") {
    throw new InputError("report path must end in .md")
  }
  if (inside === "A-notes.md" || inside === "B-notes.md" || inside.startsWith(`bin${process.platform === "win32" ? "\\" : "/"}`)) {
    throw new InputError(`report path is reserved: ${destination}`)
  }
  return destination
}

function sectionBody(notes: string, title: string): string | null {
  const lines = notes.split(/\r?\n/)
  const heading = new RegExp(`^#{1,6}\\s+${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i")
  const start = lines.findIndex((line) => heading.test(line))
  if (start < 0) return null
  const endOffset = lines.slice(start + 1).findIndex((line) => /^#{1,6}\s+/.test(line))
  const end = endOffset < 0 ? lines.length : start + 1 + endOffset
  return lines.slice(start + 1, end).join("\n").trim()
}

function validateNotes(notes: string, label: string): void {
  const match = notes.match(/^passes:\s*(\d+)\s+sweeps,\s*(\d+)\s+lenses,\s*(\d+)\s+probes,\s*(\d+)\s+diff reviews\s*$/im)
  if (match === null) {
    throw new InputError(`${label} need 'passes: N sweeps, N lenses, N probes, N diff reviews'`)
  }
  const skipped = notes.match(/^skipped:\s*(\S.*)$/im)?.[1]
  const categories = ["sweeps", "lenses", "probes", "diff reviews"] as const
  const missingNames = categories.filter((category, index) => Number(match[index + 1]) === 0 &&
    (skipped === undefined || !skipped.toLowerCase().includes(category)))
  if (missingNames.length > 0) {
    throw new InputError(`${label} need a skipped: line naming every zero-count pass: ${missingNames.join(", ")}`)
  }
  if (!/^retrospective:\s*\S/im.test(notes)) {
    throw new InputError(`${label} need a nonempty retrospective: line`)
  }
}

function validateReviewSections(notes: string, label: string): void {
  if (!sectionBody(notes, "Goal closure")) throw new InputError(`${label} need a nonempty Goal closure section`)
  if (!sectionBody(notes, "Domain scenarios")) throw new InputError(`${label} need a nonempty Domain scenarios section`)
  if (!/^closed\s+\d+\s+issues:\s*\S.*\bby execution\b.*\bby proof\b.*\bby evidence\b/im.test(notes)) {
    throw new InputError(`${label} need 'closed N issues: X by execution, Y by proof, Z by evidence'`)
  }
}

function validateHandoffNotes(state: ProtocolState, actor: Seat): void {
  if (state.mode !== "joint") throw new InputError("handoff is only used by a two-reviewer joint run")
  const path = join(runDirectory(), `${actor}-notes.md`)
  if (!existsSync(path) || !statSync(path).isFile()) {
    throw new InputError(`handoff needs ${path}`)
  }
  const notes = readFileSync(path, "utf8")
  validateNotes(notes, "handoff notes")
  if (state.route === "review") validateReviewSections(notes, "review handoff notes")
}

function validateSingleReportNotes(state: ProtocolState): void {
  if (state.route === "review" && !state.deep) return
  const path = join(runDirectory(), "A-notes.md")
  if (!existsSync(path) || !statSync(path).isFile()) throw new InputError(`report needs ${path}`)
  const notes = readFileSync(path, "utf8")
  validateNotes(notes, "report notes")
  if (state.deep && state.route === "review") validateReviewSections(notes, "deep review report notes")
}

function hashNotes(state: ProtocolState, notes = readNotes(state)): string {
  return createHash("sha256")
    .update(JSON.stringify([notes.A ?? null, notes.B ?? null]))
    .digest("hex")
}

function freshNotifications(result: MutationResult<ProtocolState>): ReadonlyArray<ProtocolState["notifications"][number]> {
  const start = result.previousState.notifications.length
  return result.state.notifications.slice(start).filter((notification) => {
    if (notification.kind !== "ready-work") return true
    return readyWork(result.state, notification.recipient).length > 0
  })
}

function printReadySummary(state: ProtocolState, actor: Actor): void {
  const pinned = '"$LEDGER_DIR/bin/ledger.ts"'
  const a = readyWork(state, "A")
  const b = readyWork(state, "B")
  const mine = readyWork(state, actor)
  console.log(`ready work: A ${a.length}, B ${b.length}`)
  if (mine.length > 0) {
    console.log(`next for ${actor}: run ${pinned} status for the exact command`)
  } else if (actor === "master") {
    const singleDone = state.mode === "single" && a.length === 0 && b.length === 0 &&
      state.checkout === null && state.issueTakes.length === 0
    const jointDone = state.mode === "joint" && state.handoffs.A !== null && state.handoffs.B !== null
    console.log(`next for ${actor}: ${state.reportCheckpoint ? "wait for the user's check-in decision" : singleDone || jointDone ? `run ${pinned} report` : state.mode === "single" ? "wait for reviewer ready work to finish" : "wait for a Question or both reviewer handoffs"}`)
  } else if (state.mode === "single") {
    console.log(`next for ${actor}: ${state.reportCheckpoint ? "wait for the user's check-in decision" : actor === "A" && b.length > 0 ? `dispatch the fresh diff review shown by ${pinned} status` : actor === "A" ? `run ${pinned} report` : "no further fresh-review work"}`)
  } else if (state.mode === "cold") {
    console.log(`next for ${actor}: run ${pinned} import`)
  } else if (state.handoffs[actor] !== null) {
    console.log(`next for ${actor}: handoff already recorded; wait for new ready work`)
  } else {
    console.log(`next for ${actor}: run ${pinned} handoff`)
  }
}

function deliver(result: MutationResult<ProtocolState>): void {
  for (const notification of freshNotifications(result)) {
    const delivery = deliverNotification(notification, result.state.names)
    if (!delivery.ok && delivery.fallback) console.error(delivery.fallback)
  }
}

function mutate(
  path: string,
  commands: ProtocolCommand | readonly ProtocolCommand[],
  success: (state: ProtocolState) => string,
): Effect.Effect<void, Error> {
  return mutateDatabase(path, protocolEngine, commands, undefined).pipe(
    Effect.tap((result) => Effect.sync(() => deliver(result))),
    Effect.tap((result) => Console.log(success(result.state))),
    Effect.tap((result) => Effect.sync(() => printReadySummary(result.state, actorFromEnvironment()))),
    Effect.asVoid,
    Effect.mapError(asError),
  )
}

function activePath(actor: Actor): Effect.Effect<string, Error> {
  const shared = sharedDatabasePath()
  if (!existsSync(shared)) return Effect.fail(new InputError(`no ledger at ${shared}; run ledger init first`))
  if (actor === "master") return Effect.succeed(shared)
  const cold = coldDatabasePath(actor)
  if (!existsSync(cold)) return Effect.succeed(shared)
  return readSnapshot(shared, codec).pipe(
    Effect.flatMap((sharedSnapshot) => {
      if (sharedSnapshot.state.imports[actor]) return Effect.succeed(shared)
      return readSnapshot(cold, codec).pipe(
        Effect.flatMap((coldSnapshot) => coldSnapshot.state.campaignId === sharedSnapshot.state.campaignId
          ? Effect.succeed(cold)
          : Effect.fail(new InputError(`cold ledger ${cold} belongs to a different campaign; move it aside before init --cold`))),
      )
    }),
    Effect.mapError(asError),
  )
}

function withSnapshot<A>(
  actor: Actor,
  work: (path: string, state: ProtocolState) => Effect.Effect<A, Error>,
): Effect.Effect<A, Error> {
  return Effect.gen(function*() {
    const path = yield* activePath(actor)
    const snapshot = yield* readSnapshot(path, codec).pipe(Effect.mapError(asError))
    return yield* work(path, snapshot.state)
  })
}

function mutationHandler(
  build: (actor: Actor, state: ProtocolState) => ProtocolCommand | readonly ProtocolCommand[],
  success: (commands: readonly ProtocolCommand[]) => string,
): Effect.Effect<void, Error> {
  return Effect.gen(function*() {
    const actor = yield* trySync(actorFromEnvironment)
    const path = yield* activePath(actor)
    let submitted: readonly ProtocolCommand[] = []
    const result = yield* mutateDatabaseFromState(path, protocolEngine, (state) => {
      const built = build(actor, state)
      submitted = Array.isArray(built) ? built : [built]
      return submitted
    }, undefined).pipe(Effect.mapError(asError))
    yield* Effect.sync(() => deliver(result))
    yield* Console.log(success(submitted))
    yield* Effect.sync(() => printReadySummary(result.state, actor))
  })
}

const initCommand = Command.make("init", {
  single: Flag.boolean("single").pipe(Flag.withDescription("Create a one-reviewer run"), Flag.withDefault(false)),
  cold: Flag.boolean("cold").pipe(Flag.withDescription("Create this reviewer's independent cold database"), Flag.withDefault(false)),
  joint: Flag.string("joint").pipe(Flag.withDescription("Report path for a two-reviewer run"), Flag.withDefault("")),
  route: Flag.choice("route", ROUTES).pipe(Flag.withDefault("review")),
  howFar: Flag.choice("how-far", POLICIES).pipe(Flag.withDefault(DEFAULT_POLICY)),
  deep: Flag.boolean("deep").pipe(Flag.withDescription("Use deep evidence and note gates in a single-reviewer run"), Flag.withDefault(false)),
  names: Flag.string("names").pipe(Flag.withDescription("A=name B=name master=name"), Flag.withDefault("")),
  hunks: Flag.string("hunks").pipe(Flag.withDescription("Comma-separated exact review hunk names"), Flag.withDefault("")),
  symptoms: Flag.string("symptoms").pipe(Flag.withDescription("Comma-separated exact diagnosis symptom names"), Flag.withDefault("")),
  clusters: Flag.string("clusters").pipe(Flag.withDescription("Whitespace- or comma-separated exact cluster names"), Flag.withDefault("")),
  scenarios: Flag.string("scenarios").pipe(Flag.withDescription("Comma-separated exact domain scenario names"), Flag.withDefault("")),
}, ({ single, cold, joint, route, howFar, deep, names, hunks, symptoms, clusters, scenarios }) => Effect.gen(function*() {
  const actor = yield* trySync(actorFromEnvironment)
  const directory = runDirectory()
  const timestamp = now()

  if (cold) {
    const seat = yield* trySync(() => reviewer(actor, "init --cold"))
    if (single || joint) return yield* Effect.fail(new InputError("--cold cannot be combined with --single or --joint"))
    const shared = yield* readSnapshot(sharedDatabasePath(), codec).pipe(Effect.mapError(asError))
    if (shared.state.mode !== "joint") return yield* Effect.fail(new InputError("--cold requires a joint run"))
    const state = yield* trySync(() => initialProtocolState({
      campaignId: shared.state.campaignId,
      mode: "cold",
      coldSeat: seat,
      route: shared.state.route,
      policy: shared.state.policy,
      reportPath: shared.state.reportPath,
      names: shared.state.names,
      declaredCoverage: shared.state.declaredCoverage,
    }))
    yield* initializeDatabase(coldDatabasePath(seat), state, codec, {
      occurredAt: timestamp,
      events: [{ occurredAt: timestamp, actor: seat, action: "init.cold", fromState: null, toState: "cold" }],
    }).pipe(Effect.mapError(asError))
    yield* Console.log(`initialized cold ledger for ${seat}: ${coldDatabasePath(seat)}`)
    yield* Effect.sync(() => printReadySummary(state, seat))
    return
  }

  if (single === Boolean(joint)) {
    return yield* Effect.fail(new InputError("init needs exactly one of --single or --joint <report path>"))
  }
  if (existsSync(sharedDatabasePath())) {
    return yield* Effect.fail(new InputError(`refusing to overwrite existing ledger: ${sharedDatabasePath()}`))
  }
  if (single && actor !== "A") return yield* Effect.fail(new InputError("LEDGER_ME must be A for init --single"))
  if (joint) master(actor, "init --joint")
  const mode = single ? "single" as const : "joint" as const
  const state = yield* trySync(() => initialProtocolState({
    campaignId: randomUUID(),
    mode,
    deep,
    route,
    policy: howFar,
    reportPath: reportPath(joint || join(directory, `${route}-report.md`)),
    names: parseNames(names, mode === "joint"),
    declaredCoverage: parseDeclaredCoverage({ hunks, symptoms, clusters, scenarios }),
  }))
  // Pin first. If database publication fails, retrying through this same pin is
  // safe; publishing a database without its helper would wedge the run.
  const pinned = yield* trySync(() => pinCurrentHelper(directory))
  yield* initializeDatabase(sharedDatabasePath(), state, codec, {
    occurredAt: timestamp,
    events: [{ occurredAt: timestamp, actor, action: "init", fromState: null, toState: mode }],
  }).pipe(Effect.mapError(asError))
  yield* Console.log(`initialized ${mode} ${deep || mode === "joint" ? "deep " : ""}${route} ledger (${howFar}): ${sharedDatabasePath()}`)
  yield* Console.log(`pinned helper: ${pinned.bundle} sha256=${pinned.hash}`)
  yield* Effect.sync(() => printReadySummary(state, actor))
})).pipe(
  Command.withDescription("Create a single, joint, or independent cold ledger. The default how-far is fix."),
)

const runCommand = Command.make("run", {
  operation: Argument.choice("operation", ["escalate"] as const).pipe(Argument.withDescription("escalate")),
  values: Argument.string("field").pipe(Argument.withDescription("optional coverage declarations as key=value fields"), Argument.variadic),
}, ({ operation: _, values }) => mutationHandler((who, state) => {
  const actor = reviewer(who, "run escalate")
  const parsed = parseFields(values as readonly string[])
  assertNoPositionals(parsed, "run escalate")
  allowOnly(parsed.fields, ["hunks", "symptoms", "clusters", "scenarios"])
  return {
    type: "run.escalate",
    actor,
    at: now(),
    declaredCoverage: parseDeclaredCoverage({
      hunks: optional(parsed.fields, "hunks"),
      symptoms: optional(parsed.fields, "symptoms"),
      clusters: optional(parsed.fields, "clusters"),
      scenarios: optional(parsed.fields, "scenarios"),
    }),
  }
}, () => "Run escalated to deep" )).pipe(Command.withDescription(
  "escalate [hunks=<targets>] [symptoms=<targets>] [clusters=<targets>] [scenarios=<targets>] — monotonically change a quick or plain single-seat run to deep",
))

const coverageCommand = Command.make("coverage", {
  operation: Argument.choice("operation", ["add", "set"] as const).pipe(Argument.withDescription("add | set")),
  values: Argument.string("field").pipe(Argument.withDescription("operation-specific key=value field"), Argument.variadic),
}, ({ operation, values }) => mutationHandler((who, state) => {
  const actor = reviewer(who, `coverage ${operation}`)
  const parsed = parseFields(values as readonly string[])
  if (operation === "add") {
    assertNoPositionals(parsed, "coverage add")
    allowOnly(parsed.fields, ["kind", "target", "state", "issue", "evidence", "reason", "note"])
    const id = nextId(state, "C", actor) as CoverageId
    const kind = required(parsed.fields, "kind")
    if (!["hunk", "symptom", "cluster", "scenario"].includes(kind)) throw new InputError(`invalid coverage kind '${kind}'`)
    const stateName = optional(parsed.fields, "state", "open")
    if (!COVERAGE_STATES.includes(stateName as never)) throw new InputError(`invalid Coverage state '${stateName}'`)
    const result = stateName === "covered"
      ? optional(parsed.fields, "evidence", optional(parsed.fields, "note"))
      : stateName === "gap"
        ? optional(parsed.fields, "reason", optional(parsed.fields, "note"))
        : ""
    const add: ProtocolCommand = {
      type: "coverage.add", actor, at: now(), id,
      coverageKind: kind as "hunk" | "symptom" | "cluster" | "scenario",
      target: required(parsed.fields, "target"),
      ...(parsed.fields.has("issue") ? { issueId: typedId<IssueId>(required(parsed.fields, "issue"), "I") } : {}),
      ...(stateName === "covered"
        ? { initial: { state: "covered" as const, evidence: result } }
        : stateName === "gap"
          ? { initial: { state: "gap" as const, reason: result } }
          : {}),
    }
    return add
  }
  const id = typedId<CoverageId>(assertOnePositional(parsed, "coverage set"), "C")
  allowOnly(parsed.fields, ["rev", "state", "evidence", "reason", "note"])
  const expectedRevision = requiredRevision(parsed.fields)
  const stateName = required(parsed.fields, "state")
  if (stateName === "covered") return {
    type: "coverage.cover", actor, at: now(), id, expectedRevision,
    evidence: optional(parsed.fields, "evidence", optional(parsed.fields, "note")),
  }
  if (stateName === "gap") return {
    type: "coverage.gap", actor, at: now(), id, expectedRevision,
    reason: optional(parsed.fields, "reason", optional(parsed.fields, "note")),
  }
  throw new InputError("coverage set state must be covered or gap")
}, (commands) => {
  const command = commands.at(-1)!
  return `Coverage ${"id" in command ? command.id : "updated"}: ${command.type.split(".").at(-1)}`
})).pipe(Command.withDescription(
  "add kind=<hunk|symptom|cluster|scenario> target=<name> [state=<open|covered|gap>] [issue=<I-id>] [evidence=<text>|reason=<text>|note=<text>]\n" +
  "set <C-id> rev=<N> state=<covered|gap> (evidence=<text>|reason=<text>|note=<text>)",
))

const ISSUE_FACT_KEYS = [
  "claim", "proposition", "site", "trigger", "cause", "scope", "frequency", "impact", "impact_rank", "detector", "detector_gap",
] as const

function issueFacts(fields: Fields, prior?: Extract<LedgerRow, { kind: "Issue" }>["facts"]): Extract<LedgerRow, { kind: "Issue" }>["facts"] {
  return {
    proposition: optional(fields, "claim", optional(fields, "proposition", prior?.proposition ?? "")),
    site: optional(fields, "site", prior?.site ?? ""),
    trigger: optional(fields, "trigger", prior?.trigger ?? ""),
    cause: optional(fields, "cause", prior?.cause ?? ""),
    scope: optional(fields, "scope", prior?.scope ?? ""),
    frequency: optional(fields, "frequency", prior?.frequency ?? ""),
    impact: optional(fields, "impact", prior?.impact ?? ""),
    ...(fields.has("impact_rank") || prior?.impactRank !== undefined
      ? { impactRank: fields.has("impact_rank")
          ? integerInRange(fields, "impact_rank", 1, 5) as ImpactRank
          : prior!.impactRank! }
      : {}),
    ...(fields.has("detector") || prior?.detector !== undefined
      ? { detector: optional(fields, "detector", prior?.detector ?? "") }
      : {}),
    ...(fields.has("detector_gap") || prior?.detectorGap !== undefined
      ? { detectorGap: optional(fields, "detector_gap", prior?.detectorGap ?? "") }
      : {}),
  }
}

function issueFactChanges(fields: Fields): Partial<Extract<LedgerRow, { kind: "Issue" }>["facts"]> {
  const changes: Record<string, string | ImpactRank> = {}
  for (const key of ISSUE_FACT_KEYS) {
    if (!fields.has(key)) continue
    if (key === "impact_rank") {
      changes.impactRank = integerInRange(fields, "impact_rank", 1, 5) as ImpactRank
      continue
    }
    const target = key === "claim" || key === "proposition"
      ? "proposition"
      : key === "detector_gap"
        ? "detectorGap"
        : key
    changes[target] = optional(fields, key)
  }
  return changes
}

function issueCommandForAdd(actor: Seat, state: ProtocolState, fields: Fields): readonly ProtocolCommand[] {
  allowOnly(fields, [
    "label", "state", "certainty", ...ISSUE_FACT_KEYS, "evidence", "assumption", "no_probe_reason",
    "clusters", "parents", "reason",
  ])
  const id = nextId(state, "I", actor) as IssueId
  const label = required(fields, "label")
  if (!ISSUE_LABELS.includes(label as IssueLabel)) throw new InputError(`invalid Issue label '${label}'`)
  const certainty = integerInRange(fields, "certainty", 1, 5) as Certainty
  const timestamp = now()
  const requestedState = optional(fields, "state", "new")
  const initial = requestedState === "verified"
    ? {
        state: "verified" as const,
        certainty: (() => {
          if (certainty < 4) throw new InputError("verified Issue certainty must be 4 or 5")
          return certainty as 4 | 5
        })(),
        evidence: runLogPath(required(fields, "evidence"), "evidence"),
      }
    : requestedState === "assumed"
      ? {
          state: "assumed" as const,
          certainty,
          assumption: required(fields, "assumption"),
          noProbeReason: required(fields, "no_probe_reason"),
        }
      : requestedState === "accepted"
        ? { state: "accepted" as const, reason: required(fields, "reason") }
        : undefined
  if (!["new", "verified", "assumed", "accepted"].includes(requestedState)) {
    throw new InputError("issue add state must be new, verified, assumed, or accepted")
  }
  const add: ProtocolCommand = {
    type: "issue.add",
    actor,
    at: timestamp,
    id,
    label: label as IssueLabel,
    certainty,
    facts: issueFacts(fields),
    clusters: parseClusterTokens(optional(fields, "clusters")),
    parentIssueIds: listField(fields, "parents", false).map((value) => typedId<IssueId>(value, "I")),
    ...(initial ? { initial } : {}),
  }
  return [add]
}

const issueOperations = ["add", "set", "agree", "contest", "probe", "disprove", "duplicate", "accept", "take", "release", "exit", "drop"] as const
const issueCommand = Command.make("issue", {
  operation: Argument.choice("operation", issueOperations).pipe(Argument.withDescription(issueOperations.join(" | "))),
  values: Argument.string("field").pipe(Argument.withDescription("operation-specific row id or key=value field"), Argument.variadic),
}, ({ operation, values }) => mutationHandler((who, state) => {
  const parsed = parseFields(values as readonly string[])
  if (operation === "drop") {
    const actor = master(who, "issue drop")
    const id = typedId<IssueId>(assertOnePositional(parsed, "issue drop"), "I")
    allowOnly(parsed.fields, ["rev", "reason"])
    return {
      type: "issue.exit", actor, at: now(), id, expectedRevision: requiredRevision(parsed.fields),
      exit: { kind: "user-drop", reason: required(parsed.fields, "reason") },
    }
  }
  const actor = reviewer(who, `issue ${operation}`)
  if (operation === "add") {
    assertNoPositionals(parsed, "issue add")
    return issueCommandForAdd(actor, state, parsed.fields)
  }
  const id = typedId<IssueId>(assertOnePositional(parsed, `issue ${operation}`), "I")
  const expectedRevision = requiredRevision(parsed.fields)
  const timestamp = now()
  if (operation === "set") {
    allowOnly(parsed.fields, [
      "rev", "state", "label", "label_reason", "clusters", "parents", "certainty", ...ISSUE_FACT_KEYS,
      "evidence", "assumption", "no_probe_reason",
    ])
    const before = findRow(state, id, "Issue")
    const commands: Array<ProtocolCommand> = []
    let revision = expectedRevision
    let effectiveState = before.state
    const requestedState = optional(parsed.fields, "state")
    if (requestedState && requestedState !== "verified" && requestedState !== "assumed") {
      throw new InputError("issue set state must be verified or assumed; use the named disposition command otherwise")
    }
    const stateTransition = requestedState !== "" && requestedState !== effectiveState
    const hasContent = ISSUE_FACT_KEYS.some((key) => parsed.fields.has(key)) ||
      parsed.fields.has("label") || parsed.fields.has("clusters") || parsed.fields.has("parents") ||
      (!stateTransition && ["certainty", "evidence", "assumption", "no_probe_reason"].some((key) => parsed.fields.has(key)))
    if (hasContent) {
      const label = parsed.fields.has("label") ? required(parsed.fields, "label") : undefined
      if (label !== undefined && !ISSUE_LABELS.includes(label as IssueLabel)) throw new InputError(`invalid Issue label '${label}'`)
      const edit: Extract<ProtocolCommand, { type: "issue.edit" }> = {
        type: "issue.edit", actor, at: timestamp, id, expectedRevision: revision,
        facts: issueFactChanges(parsed.fields),
        ...(label === undefined ? {} : { label: label as IssueLabel }),
        ...(parsed.fields.has("label_reason") ? { labelChangeReason: required(parsed.fields, "label_reason") } : {}),
        ...(parsed.fields.has("clusters") ? { clusters: parseClusterTokens(optional(parsed.fields, "clusters")) } : {}),
        ...(parsed.fields.has("parents")
          ? { parentIssueIds: listField(parsed.fields, "parents", false).map((value) => typedId<IssueId>(value, "I")) }
          : {}),
        ...(!stateTransition && parsed.fields.has("certainty")
          ? { certainty: integerInRange(parsed.fields, "certainty", 1, 5) as Certainty }
          : {}),
        ...(!stateTransition && parsed.fields.has("evidence")
          ? { evidence: before.state === "verified" ? runLogPath(required(parsed.fields, "evidence"), "evidence") : required(parsed.fields, "evidence") }
          : {}),
        ...(!stateTransition && parsed.fields.has("assumption") ? { assumption: required(parsed.fields, "assumption") } : {}),
        ...(!stateTransition && parsed.fields.has("no_probe_reason") ? { noProbeReason: required(parsed.fields, "no_probe_reason") } : {}),
      }
      commands.push(edit)
      revision += 1
      if (effectiveState === "contested") effectiveState = "new"
    }
    if (requestedState === "verified" && effectiveState !== "verified") {
      const certainty = integerInRange(parsed.fields, "certainty", 4, 5) as 4 | 5
      commands.push({
        type: "issue.verify", actor, at: timestamp, id, expectedRevision: revision, certainty,
        evidence: runLogPath(required(parsed.fields, "evidence"), "evidence"),
      })
    } else if (requestedState === "assumed" && effectiveState !== "assumed") {
      commands.push({
        type: "issue.assume", actor, at: timestamp, id, expectedRevision: revision,
        certainty: integerInRange(parsed.fields, "certainty", 1, 5) as Certainty,
        assumption: required(parsed.fields, "assumption"),
        noProbeReason: required(parsed.fields, "no_probe_reason"),
      })
    }
    if (commands.length === 0) throw new InputError("issue set did not change anything")
    return commands
  }
  if (operation === "agree") {
    allowOnly(parsed.fields, ["rev"])
    return { type: "issue.mark", actor, at: timestamp, id, expectedRevision }
  }
  if (operation === "contest") {
    allowOnly(parsed.fields, ["rev", "probe"])
    return { type: "issue.contest", actor, at: timestamp, id, expectedRevision, probe: required(parsed.fields, "probe") }
  }
  if (operation === "probe") {
    allowOnly(parsed.fields, ["rev", "verdict", "certainty", "evidence"])
    const verdict = required(parsed.fields, "verdict")
    if (verdict !== "verified" && verdict !== "disproved") throw new InputError("verdict must be verified or disproved")
    return {
      type: "issue.probe", actor, at: timestamp, id, expectedRevision, verdict,
      certainty: integerInRange(parsed.fields, "certainty", 4, 5) as 4 | 5,
      evidence: runLogPath(required(parsed.fields, "evidence"), "evidence"),
    }
  }
  if (operation === "disprove") {
    allowOnly(parsed.fields, ["rev", "certainty", "evidence"])
    return {
      type: "issue.disprove", actor, at: timestamp, id, expectedRevision,
      certainty: integerInRange(parsed.fields, "certainty", 2, 5) as Certainty,
      evidence: required(parsed.fields, "evidence"),
    }
  }
  if (operation === "duplicate") {
    allowOnly(parsed.fields, ["rev", "of"])
    return { type: "issue.duplicate", actor, at: timestamp, id, expectedRevision, duplicateOf: typedId<IssueId>(required(parsed.fields, "of"), "I") }
  }
  if (operation === "accept") {
    allowOnly(parsed.fields, ["rev", "reason"])
    return { type: "issue.accept", actor, at: timestamp, id, expectedRevision, reason: required(parsed.fields, "reason") }
  }
  if (operation === "take" || operation === "release") {
    allowOnly(parsed.fields, ["rev"])
    return { type: `issue.${operation}`, actor, at: timestamp, id, expectedRevision } as ProtocolCommand
  }
  allowOnly(parsed.fields, ["rev", "kind", "reference", "reason"])
  const kind = required(parsed.fields, "kind")
  if (kind === "user-drop") throw new InputError("only master may record a user-drop")
  if (kind !== "comment-or-assert" && kind !== "ruling-or-baseline" && kind !== "todo") {
    throw new InputError("exit kind must be comment-or-assert, ruling-or-baseline, or todo")
  }
  return {
    type: "issue.exit", actor, at: timestamp, id, expectedRevision,
    exit: { kind, reference: required(parsed.fields, "reference") },
  }
}, (commands) => {
  const command = commands.at(-1)!
  return `Issue ${"id" in command ? command.id : "updated"}: ${command.type.split(".").at(-1)}`
})).pipe(Command.withDescription(
  "add label=<label> certainty=<1-5> claim=<text> [state=<new|verified|assumed|accepted>] plus site, trigger, cause, scope, frequency, impact, impact_rank=1..5, evidence/assumption/no_probe_reason/reason, clusters, parents\n" +
  "set <I-id> rev=<N> with changed Issue fields, label_reason=<reason> on a downgrade, and optional state=<verified|assumed>; agree <I-id> rev=<N>; contest <I-id> rev=<N> probe=<text>; probe <I-id> rev=<N> verdict=<verified|disproved> certainty=<4|5> evidence=<path>\n" +
  "disprove <I-id> rev=<N> certainty=<2-5> evidence=<path>; duplicate <I-id> rev=<N> of=<I-id>; accept <I-id> rev=<N> reason=<text>; take|release <I-id> rev=<N>; exit <I-id> rev=<N> kind=<comment-or-assert|ruling-or-baseline|todo> reference=<text>; drop <I-id> rev=<N> reason=<text> (master)",
))

const questionCommand = Command.make("question", {
  operation: Argument.choice("operation", ["add", "answer"] as const).pipe(Argument.withDescription("add | answer")),
  values: Argument.string("field").pipe(Argument.withDescription("operation-specific row id or key=value field"), Argument.variadic),
}, ({ operation, values }) => Effect.gen(function*() {
  const parsed = yield* trySync(() => parseFields(values as readonly string[]))
  if (operation === "add") {
    const effect = mutationHandler((who, state) => {
      const actor = reviewer(who, "question add")
      assertNoPositionals(parsed, "question add")
      allowOnly(parsed.fields, ["issues", "proposed_fix", "shelved_fix", "purpose", "question", "options", "user_effect", "code_cost", "recommendation"])
      const purpose = optional(parsed.fields, "purpose", "decision")
      if (purpose !== "decision" && purpose !== "no-red") throw new InputError("purpose must be decision or no-red")
      let options = optionList(required(parsed.fields, "options"))
      if (purpose === "no-red" && !options.some((option) => option.trim().toLowerCase() === ALLOW_NO_RED_ANSWER)) {
        throw new InputError(`a no-red Question must offer the exact answer '${ALLOW_NO_RED_ANSWER}'`)
      }
      const id = nextId(state, "Q", actor) as QuestionId
      const proposedFixId = parsed.fields.has("proposed_fix")
        ? typedId<ProposedFixId>(required(parsed.fields, "proposed_fix"), "P")
        : undefined
      const proposedFix = proposedFixId === undefined
        ? undefined
        : state.rows.find((row) => row.id === proposedFixId && row.kind === "Proposed fix")
      if (proposedFixId !== undefined && proposedFix === undefined) {
        throw new InputError(`unknown Proposed fix ${proposedFixId}`)
      }
      const shelvedFixId = parsed.fields.has("shelved_fix")
        ? typedId<ShelvedFixId>(required(parsed.fields, "shelved_fix"), "S")
        : undefined
      const shelvedFix = shelvedFixId === undefined
        ? undefined
        : state.rows.find((row) => row.id === shelvedFixId && row.kind === "Shelved fix")
      if (shelvedFixId !== undefined && shelvedFix === undefined) {
        throw new InputError(`unknown Shelved fix ${shelvedFixId}`)
      }
      return {
        type: "question.add", actor, at: now(), id,
        issueIds: listField(parsed.fields, "issues").map((value) => typedId<IssueId>(value, "I")),
        purpose,
        ...(proposedFix === undefined
          ? {}
          : { proposedFixRef: { id: proposedFixId!, revision: proposedFix.revision } }),
        ...(shelvedFix === undefined
          ? {}
          : { shelvedFixRef: { id: shelvedFixId!, revision: shelvedFix.revision } }),
        question: required(parsed.fields, "question"),
        options,
        userEffect: required(parsed.fields, "user_effect"),
        codeCost: required(parsed.fields, "code_cost"),
        recommendation: required(parsed.fields, "recommendation"),
      }
    }, (commands) => `Question ${(commands.at(-1) as Extract<ProtocolCommand, { type: "question.add" }>).id}: open`)
    return yield* effect
  }

  const actor = yield* trySync(actorFromEnvironment)
  master(actor, "question answer")
  const id = typedId<QuestionId>(assertOnePositional(parsed, "question answer"), "Q")
  allowOnly(parsed.fields, ["rev", "answer"])
  return yield* withSnapshot(actor, (path) => mutate(path, {
    type: "question.answer", actor: "master", at: now(), id,
    expectedRevision: requiredRevision(parsed.fields),
    answer: required(parsed.fields, "answer"),
  }, () => `Question ${id}: answered`))
})).pipe(Command.withDescription(
  `add issues=<I-ids> [proposed_fix=<P-id>|shelved_fix=<S-id>] purpose=<decision|no-red> question=<text> options=<choices> user_effect=<text> code_cost=<text> recommendation=<choice>\n` +
  `answer <Q-id> rev=<N> answer=<choice> (master). Missing-red authorization requires purpose=no-red and the exact answer ${ALLOW_NO_RED_ANSWER}.`,
))

const PROPOSED_FIX_KEYS = [
  "origin_class", "shape", "sites", "rulings", "test", "cost",
  "interface_change", "ownership_change", "risk_surface", "guardrail", "coordination",
] as const

function proposedFixShape(
  fields: Fields,
  proposalKind: "proposal" | "direction",
  prior?: ProposedFixShape,
): ProposedFixShape {
  const shape = optional(fields, "shape", prior?.shape ?? "")
  const cost = optional(fields, "cost", prior?.cost ?? "")
  if (proposalKind === "direction") {
    const notDirection = PROPOSED_FIX_KEYS.filter((key) =>
      key !== "shape" && key !== "cost" && key !== "coordination" && fields.has(key)
    )
    if (notDirection.length > 0) {
      throw new InputError(`a direction accepts only shape, cost, and coordination (got ${notDirection.join(", ")})`)
    }
    return {
      shape: shape || required(fields, "shape"),
      cost: cost || required(fields, "cost"),
      ...(fields.has("coordination") || prior?.coordination !== undefined
        ? { coordination: optional(fields, "coordination", prior?.coordination ?? "") }
        : {}),
    }
  }
  const originClass = optional(fields, "origin_class", prior?.originClass ?? "")
  if (originClass !== "attention-miss" && originClass !== "self-consistency" && originClass !== "design-absence") {
    throw new InputError("origin_class must be attention-miss, self-consistency, or design-absence")
  }
  return {
    originClass,
    shape,
    sitesWalked: optional(fields, "sites", prior?.sitesWalked ?? ""),
    rulingsChecked: optional(fields, "rulings", prior?.rulingsChecked ?? ""),
    testLocation: optional(fields, "test", prior?.testLocation ?? ""),
    cost,
    interfaceChange: fields.has("interface_change") ? booleanField(fields, "interface_change") : prior?.interfaceChange ?? false,
    ownershipChange: fields.has("ownership_change") ? booleanField(fields, "ownership_change") : prior?.ownershipChange ?? false,
    riskSurface: fields.has("risk_surface") ? booleanField(fields, "risk_surface") : prior?.riskSurface ?? false,
    ...(fields.has("guardrail") || prior?.guardrail !== undefined
      ? { guardrail: optional(fields, "guardrail", prior?.guardrail ?? "") }
      : {}),
    ...(fields.has("coordination") || prior?.coordination !== undefined
      ? { coordination: optional(fields, "coordination", prior?.coordination ?? "") }
      : {}),
  }
}

const proposedFixCommand = Command.make("proposed-fix", {
  operation: Argument.choice("operation", ["add", "set", "mark", "reject"] as const).pipe(Argument.withDescription("add | set | mark | reject")),
  values: Argument.string("field").pipe(Argument.withDescription("operation-specific row id or key=value field"), Argument.variadic),
}, ({ operation, values }) => mutationHandler((who, state) => {
  const actor = reviewer(who, `proposed-fix ${operation}`)
  const parsed = parseFields(values as readonly string[])
  const timestamp = now()
  if (operation === "add") {
    assertNoPositionals(parsed, "proposed-fix add")
    allowOnly(parsed.fields, ["issues", "kind", ...PROPOSED_FIX_KEYS])
    const id = nextId(state, "P", actor) as ProposedFixId
    const proposalKind = optional(parsed.fields, "kind", "proposal")
    if (proposalKind !== "proposal" && proposalKind !== "direction") throw new InputError("kind must be proposal or direction")
    return {
      type: "proposed-fix.add", actor, at: timestamp, id,
      issueIds: listField(parsed.fields, "issues").map((value) => typedId<IssueId>(value, "I")),
      fix: proposedFixShape(parsed.fields, proposalKind),
      proposalKind,
    }
  }
  const id = typedId<ProposedFixId>(assertOnePositional(parsed, `proposed-fix ${operation}`), "P")
  const expectedRevision = requiredRevision(parsed.fields)
  if (operation === "set") {
    allowOnly(parsed.fields, ["rev", ...PROPOSED_FIX_KEYS])
    const before = findRow(state, id, "Proposed fix")
    return {
      type: "proposed-fix.edit", actor, at: timestamp, id, expectedRevision,
      fix: proposedFixShape(parsed.fields, before.proposalKind, before.fix),
    }
  }
  if (operation === "mark") {
    allowOnly(parsed.fields, ["rev"])
    return { type: "proposed-fix.mark", actor, at: timestamp, id, expectedRevision }
  }
  allowOnly(parsed.fields, ["rev", "reason"])
  return { type: "proposed-fix.reject", actor, at: timestamp, id, expectedRevision, reason: required(parsed.fields, "reason") }
}, (commands) => {
  const command = commands.at(-1)!
  return `Proposed fix ${"id" in command ? command.id : "updated"}: ${command.type.split(".").at(-1)}`
})).pipe(Command.withDescription(
  "add issues=<I-ids> kind=proposal origin_class=<attention-miss|self-consistency|design-absence> shape=<text> sites=<walked-sites> rulings=<checks> test=<location|none> cost=<text> [interface_change=<yes|no>] [ownership_change=<yes|no>] [risk_surface=<yes|no>] [guardrail=<text>] [coordination=<text>]\n" +
  "add issues=<I-ids> kind=direction shape=<summary> cost=<text> [coordination=<text>]; set <P-id> rev=<N> with fields for its existing kind; mark <P-id> rev=<N>; reject <P-id> rev=<N> reason=<text>",
))

const shelvedFixCommand = Command.make("shelved-fix", {
  operation: Argument.choice("operation", ["add", "set", "conditions", "review"] as const).pipe(Argument.withDescription("add | set | conditions | review")),
  values: Argument.string("field").pipe(Argument.withDescription("operation-specific row id or key=value field"), Argument.variadic),
}, ({ operation, values }) => mutationHandler((who, state) => {
  const actor = reviewer(who, `shelved-fix ${operation}`)
  const parsed = parseFields(values as readonly string[])
  const timestamp = now()
  if (operation === "add") {
    assertNoPositionals(parsed, "shelved-fix add")
    allowOnly(parsed.fields, ["proposed_fixes", "artifact", "red", "green"])
    const id = nextId(state, "S", actor) as ShelvedFixId
    const red = optional(parsed.fields, "red")
    return {
      type: "shelved-fix.add", actor, at: timestamp, id,
      proposedFixIds: listField(parsed.fields, "proposed_fixes").map((value) => typedId<ProposedFixId>(value, "P")),
      artifact: required(parsed.fields, "artifact"),
      redRun: red ? { path: runLogPath(red, "red") } : null,
      greenRun: { path: runLogPath(required(parsed.fields, "green"), "green") },
    }
  }
  const id = typedId<ShelvedFixId>(assertOnePositional(parsed, `shelved-fix ${operation}`), "S")
  const expectedRevision = requiredRevision(parsed.fields)
  if (operation === "set") {
    allowOnly(parsed.fields, ["rev", "artifact", "red", "green"])
    const before = findRow(state, id, "Shelved fix")
    const red = parsed.fields.has("red") ? optional(parsed.fields, "red") : before.redRun?.path ?? ""
    const green = optional(parsed.fields, "green", before.greenRun.path)
    return {
      type: "shelved-fix.edit", actor, at: timestamp, id, expectedRevision,
      artifact: optional(parsed.fields, "artifact", before.artifact),
      redRun: red ? { path: runLogPath(red, "red") } : null,
      greenRun: { path: runLogPath(green, "green") },
    }
  }
  if (operation === "conditions") {
    allowOnly(parsed.fields, ["rev", "conditions"])
    return {
      type: "shelved-fix.review", actor, at: timestamp, id, expectedRevision,
      verdict: "conditions", conditions: required(parsed.fields, "conditions"),
    }
  }
  allowOnly(parsed.fields, ["rev"])
  return { type: "shelved-fix.review", actor, at: timestamp, id, expectedRevision, verdict: "reviewed" }
}, (commands) => {
  const command = commands.at(-1)!
  return `Shelved fix ${"id" in command ? command.id : "updated"}: ${command.type.split(".").at(-1)}`
})).pipe(Command.withDescription(
  "add proposed_fixes=<P-ids> artifact=<shelve> red=<path> green=<path>; an answered no-red Question is the only red omission\n" +
  "set <S-id> rev=<N> artifact=<shelve> [red=<path>] [green=<path>]; conditions <S-id> rev=<N> conditions=<text>; review <S-id> rev=<N>. Log paths stay inside the run directory.",
))

const checkoutCommand = Command.make("checkout", {
  operation: Argument.choice("operation", ["take", "baseline", "release", "force-release"] as const).pipe(Argument.withDescription("take | baseline | release | force-release")),
  values: Argument.string("field").pipe(Argument.withDescription("operation-specific key=value field"), Argument.variadic),
}, ({ operation, values }) => mutationHandler((who) => {
  const parsed = parseFields(values as readonly string[])
  assertNoPositionals(parsed, `checkout ${operation}`)
  const timestamp = now()
  if (operation === "force-release") {
    const actor = master(who, "checkout force-release")
    allowOnly(parsed.fields, ["reason"])
    return {
      type: "checkout.release", actor, at: timestamp,
      probesRemoved: true, shelvesRecorded: true,
      reason: required(parsed.fields, "reason"),
    }
  }
  const actor = reviewer(who, `checkout ${operation}`)
  if (operation === "take") {
    allowOnly(parsed.fields, ["purpose", "rows"])
    return {
      type: "checkout.take", actor, at: timestamp,
      purpose: required(parsed.fields, "purpose"),
      rowIds: listField(parsed.fields, "rows", false).map(rowId),
    }
  }
  if (operation === "baseline") {
    allowOnly(parsed.fields, ["build", "test"])
    return {
      type: "checkout.baseline", actor, at: timestamp,
      buildLog: runLogPath(required(parsed.fields, "build"), "build"),
      testLog: runLogPath(required(parsed.fields, "test"), "test"),
    }
  }
  allowOnly(parsed.fields, [])
  return { type: "checkout.release", actor, at: timestamp, probesRemoved: true, shelvesRecorded: true }
}, (commands) => `Checkout: ${commands.at(-1)!.type.split(".").at(-1)}`)).pipe(
  Command.withDescription("Take the shared checkout, record its first baseline, or release it. `release` declares probes removed and shelves recorded. `force-release reason=...` is for master only, acting on the user's word; holds never expire."),
)

const checkInCommand = Command.make("check-in", {
  operation: Argument.choice("operation", ["approve", "record", "drop"] as const).pipe(Argument.withDescription("approve | record | drop")),
  values: Argument.string("field").pipe(Argument.withDescription("operation-specific row id or key=value field"), Argument.variadic),
}, ({ operation, values }) => mutationHandler((who, state) => {
  const parsed = parseFields(values as readonly string[])
  const timestamp = now()
  if (operation === "approve") {
    const actor = master(who, "check-in approve")
    assertNoPositionals(parsed, "check-in approve")
    allowOnly(parsed.fields, ["shelves", "executor", "approval"])
    const executorName = optional(parsed.fields, "executor", "master")
    if (!ACTORS.includes(executorName as Actor)) throw new InputError("executor must be A, B, or master")
    const id = nextId(state, "K", actor) as CheckInId
    return {
      type: "check-in.approve", actor, at: timestamp, id,
      shelvedFixIds: listField(parsed.fields, "shelves").map((value) => typedId<ShelvedFixId>(value, "S")),
      executor: executorName as Actor,
      approval: required(parsed.fields, "approval"),
      notesHash: hashNotes(state),
    }
  }
  const id = typedId<CheckInId>(assertOnePositional(parsed, `check-in ${operation}`), "K")
  const expectedRevision = requiredRevision(parsed.fields)
  if (operation === "record") {
    allowOnly(parsed.fields, ["rev", "changeset", "departures"])
    return {
      type: "check-in.record", actor: who, at: timestamp, id, expectedRevision,
      changeset: required(parsed.fields, "changeset"),
      departures: required(parsed.fields, "departures"),
    }
  }
  const actor = master(who, "check-in drop")
  allowOnly(parsed.fields, ["rev", "reason"])
  return { type: "check-in.drop", actor, at: timestamp, id, expectedRevision, reason: required(parsed.fields, "reason") }
}, (commands) => {
  const command = commands.at(-1)!
  return `Check-in ${"id" in command ? command.id : "updated"}: ${command.type.split(".").at(-1)}`
})).pipe(Command.withDescription(
  "approve shelves=<S-ids> approval=<user words> [executor=<A|B|master>] (master); record <K-id> rev=<N> changeset=<id> departures=<none-or-text> (executor); drop <K-id> rev=<N> reason=<text> (master)",
))

const importCommand = Command.make("import", {}, () => Effect.gen(function*() {
  const actor = yield* trySync(actorFromEnvironment)
  const seat = yield* trySync(() => reviewer(actor, "import"))
  const cold = coldDatabasePath(seat)
  if (!existsSync(cold)) return yield* Effect.fail(new InputError(`cold ledger does not exist: ${cold}`))
  const timestamp = now()
  const bundle = yield* sealImportBundle(cold, codec, timestamp, {
    validate: (state) => {
      const pending = readyWork(state, seat).filter((item) => item.command !== "cold.import")
      if (pending.length > 0) {
        throw new InputError(`cold pass still has ready work: ${pending.map((item) => item.rowId ?? item.reason).join(", ")}`)
      }
    },
  }).pipe(Effect.mapError(asError))
  const rows = bundle.state.rows.filter((row): row is Extract<LedgerRow, { kind: "Coverage" | "Issue" }> =>
    row.kind === "Coverage" || row.kind === "Issue")
  const additionalEvents = importedEventsFrom(bundle, seat)
  const result = yield* mutateDatabase(sharedDatabasePath(), protocolEngine, {
    type: "cold.import", actor: seat, at: timestamp, campaignId: bundle.state.campaignId, rows,
  }, undefined, { additionalEvents }).pipe(Effect.mapError(asError))
  yield* Effect.sync(() => deliver(result))
  yield* Console.log(`imported ${seat}: ${rows.length} rows`)
  yield* Effect.sync(() => printReadySummary(result.state, seat))
})).pipe(Command.withDescription("Atomically import this reviewer's cold Coverage and Issues into the shared database."))

const handoffCommand = Command.make("handoff", {}, () => mutationHandler((who, state) => {
  const actor = reviewer(who, "handoff")
  validateHandoffNotes(state, actor)
  return { type: "handoff", actor, at: now() }
}, (commands) => `handoff recorded for ${commands[0]!.actor}`)).pipe(
  Command.withDescription("Hand off only when ready work is empty and this reviewer holds neither checkout nor Issue take."),
)

function readNotes(state: ProtocolState): ReportNotes {
  const notes: Partial<Record<Seat, string>> = {}
  for (const seat of state.mode === "single" ? ["A"] as const : ["A", "B"] as const) {
    const path = join(runDirectory(), `${seat}-notes.md`)
    if (existsSync(path) && statSync(path).isFile()) notes[seat] = readFileSync(path, "utf8")
  }
  return notes
}

const statusCommand = Command.make("status", {}, () => Effect.gen(function*() {
  const actor = yield* trySync(actorFromEnvironment)
  const path = yield* activePath(actor)
  const view = yield* readLedgerView(path, codec).pipe(Effect.mapError(asError))
  yield* Console.log(renderStatus(view.state, { actor, events: view.events, notes: readNotes(view.state) }).trimEnd())
})).pipe(Command.withDescription("Show rows, ownership, questions, A/B ready counts, and the caller's next exact command."))

const reportCommand = Command.make("report", {}, () => Effect.gen(function*() {
  const actor = yield* trySync(actorFromEnvironment)
  const path = yield* activePath(actor)
  const view = yield* readLedgerView(path, codec).pipe(Effect.mapError(asError))
  if (view.state.mode === "cold") return yield* Effect.fail(new InputError("import the cold pass before reporting"))
  if (view.state.mode === "joint") {
    yield* trySync(() => master(actor, "report"))
    for (const seat of ["A", "B"] as const) {
      if (view.state.handoffs[seat] !== null) yield* trySync(() => validateHandoffNotes(view.state, seat))
    }
  }
  else {
    if (actor !== "A") return yield* Effect.fail(new InputError("LEDGER_ME must be A for a single-run report"))
    yield* trySync(() => validateSingleReportNotes(view.state))
  }
  const notes = readNotes(view.state)
  const notesHash = hashNotes(view.state, notes)
  const destination = view.state.reportPath === null ? null : yield* trySync(() => reportPath(view.state.reportPath!))
  const recordsFinalReport = readyWork(view.state, actor).some((item) => item.command === "report.record") ||
    (view.state.reportCheckpoint !== null && view.state.reportCheckpoint.notesHash !== notesHash)
  const recorded = recordsFinalReport
    ? yield* mutateDatabase(path, protocolEngine, {
        type: "report.record",
        actor: actor as "A" | "master",
        at: now(),
        notesHash,
      }, undefined, { expectedStorageRevision: view.storageRevision }).pipe(Effect.mapError(asError))
    : null
  if (recorded) yield* Effect.sync(() => deliver(recorded))
  const reportState = recorded?.state ?? view.state
  const reportEvents = recorded?.events ?? view.events
  const report = renderReport(reportState, { events: reportEvents, notes })
  if (destination) yield* trySync(() => writeReportAtomically(destination, report, runDirectory()))
  yield* Console.log(destination ? `report: ${destination}` : "report: stdout only")
  yield* Effect.sync(() => printReadySummary(reportState, actor))
  yield* Console.log(report.trimEnd())
})).pipe(Command.withDescription("Print the current report. Open work stays visibly open; review reports end with the Fix table and diagnosis reports with Validation."))

const timelineCommand = Command.make("timeline", {
  actors: Argument.string("actor").pipe(Argument.variadic({ max: 1 })),
}, ({ actors }) => Effect.gen(function*() {
  const caller = yield* trySync(actorFromEnvironment)
  const selected = (actors as readonly string[])[0]
  if (selected !== undefined && !ACTORS.includes(selected as Actor)) {
    return yield* Effect.fail(new InputError("timeline actor must be A, B, or master"))
  }
  const path = yield* activePath(caller)
  const view = yield* readLedgerView(path, codec).pipe(Effect.mapError(asError))
  yield* Console.log(renderTimeline(view.state, view.events, selected as Actor | undefined).trimEnd())
  yield* Effect.sync(() => printReadySummary(view.state, caller))
})).pipe(Command.withDescription("Print timestamped state transitions for A, B, master, or all actors."))

const root = Command.make("ledger").pipe(
  Command.withDescription("Typed review and diagnosis ledger"),
  Command.withSubcommands([
    initCommand,
    runCommand,
    coverageCommand,
    issueCommand,
    questionCommand,
    proposedFixCommand,
    shelvedFixCommand,
    checkoutCommand,
    checkInCommand,
    importCommand,
    handoffCommand,
    statusCommand,
    reportCommand,
    timelineCommand,
  ]),
)

root.pipe(
  Command.run({ version: VERSION }),
  Effect.provide(NodeServices.layer),
  NodeRuntime.runMain,
)
