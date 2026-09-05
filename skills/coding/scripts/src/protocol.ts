// The run's rules as a pure reducer: (state, command) -> state, events, notifications.
// Every refusal here restates a sentence of the coding skill. Storage, argument
// parsing, and rendering live elsewhere and know nothing about the rules.

export const SCHEMA = 5

export type Seat = "A" | "B"
export type Actor = Seat | "master"
export type Mode = "single" | "joint" | "cold"
export type Route = "review" | "diagnose" | "write"
export type HowFar = "fix" | "report-only" | "check-in"
export const HOW_FAR: readonly HowFar[] = ["fix", "report-only", "check-in"]
export const ROUTES: readonly Route[] = ["review", "diagnose", "write"]
export const LABELS = ["Bug", "Restructure", "Hardening", "Nit", "telemetry-quality"] as const
export type Label = (typeof LABELS)[number]
export const COVERAGE_KINDS = ["hunk", "symptom", "cluster", "scenario"] as const
export type CoverageKind = (typeof COVERAGE_KINDS)[number]
export const EXIT_KINDS = ["comment", "ruling", "todo", "drop"] as const
export type ExitKind = (typeof EXIT_KINDS)[number]

export interface Mark {
  readonly by: Seat
  readonly at: string
}

interface Base {
  readonly id: string
  readonly author: Actor
  /** Who wrote the current revision. Nobody marks a revision they wrote. */
  readonly editor: Actor
  readonly rev: number
  readonly created: string
  readonly updated: string
}

export interface Coverage extends Base {
  readonly kind: "Coverage"
  readonly coverage: CoverageKind
  readonly target: string
  readonly state: "open" | "covered" | "gap"
  readonly note: string
}

export interface Facts {
  readonly claim: string
  readonly site: string
  readonly trigger: string
  readonly cause: string
  readonly scope: string
  readonly frequency: string
  readonly impact: string
  readonly rank: number | null
  readonly detector: string
}

export const ISSUE_STATES = ["new", "verified", "assumed", "contested", "disproved", "duplicate", "accepted"] as const
export type IssueState = (typeof ISSUE_STATES)[number]

export interface Issue extends Base {
  readonly kind: "Issue"
  readonly label: Label
  readonly labelReason: string
  readonly state: IssueState
  readonly certainty: number
  readonly facts: Facts
  readonly evidence: string
  readonly assumption: string
  readonly reason: string
  readonly probe: string
  readonly contestedBy: Seat | null
  readonly contests: number
  readonly duplicateOf: string
  readonly parents: readonly string[]
  readonly clusters: readonly string[]
  readonly mark: Mark | null
  readonly taken: Seat | null
  readonly exit: { readonly kind: ExitKind; readonly reference: string } | null
}

export interface Question extends Base {
  readonly kind: "Question"
  readonly issues: readonly string[]
  readonly fix: string
  readonly question: string
  readonly options: readonly string[]
  readonly recommendation: string
  readonly effect: string
  readonly cost: string
  readonly state: "open" | "answered" | "withdrawn"
  readonly answer: string
}

export interface Shape {
  readonly goal: string
  readonly origin: string
  readonly shape: string
  readonly sites: string
  readonly rulings: string
  readonly test: string
  readonly cost: string
  readonly guardrail: string
  readonly coordination: string
}

export interface ProposedFix extends Base, Shape {
  readonly kind: "Proposed fix"
  readonly issues: readonly string[]
  readonly disputes: number
  readonly state: "draft" | "marked" | "rejected" | "dropped"
  readonly rejection: string
  readonly dropReason: string
  readonly mark: Mark | null
}

export interface ShelvedFix extends Base {
  readonly kind: "Shelved fix"
  readonly fixes: readonly string[]
  readonly artifact: string
  readonly baseline: string
  readonly dependencies: readonly Dependency[]
  readonly validation: string
  readonly validationDigest: string
  readonly state: "shelved" | "conditions" | "reviewed" | "stale"
  readonly conditions: string
  readonly review: Mark | null
}

export interface Dependency {
  readonly id: string
  readonly rev: number
}

export interface CheckIn extends Base {
  readonly kind: "Check-in"
  readonly shelves: readonly string[]
  readonly revisions: readonly Dependency[]
  readonly executor: Actor
  readonly approval: string
  readonly state: "approved" | "checked in" | "dropped"
  readonly changeset: string
  readonly departures: string
  readonly reason: string
}

export type Row = Coverage | Issue | Question | ProposedFix | ShelvedFix | CheckIn
export type Kind = Row["kind"]

export interface Declared {
  readonly coverage: CoverageKind
  readonly target: string
}

export interface State {
  readonly schema: typeof SCHEMA
  readonly mode: Mode
  readonly seat: Seat | null
  readonly deep: boolean
  readonly route: Route
  readonly howFar: HowFar
  readonly names: Readonly<Record<Actor, string>>
  readonly declared: readonly Declared[]
  readonly rows: readonly Row[]
  readonly checkout: { readonly holder: Seat; readonly purpose: string; readonly since: string } | null
  readonly baseline: { readonly by: Seat; readonly build: string; readonly test: string; readonly at: string } | null
  readonly imported: Readonly<Record<Seat, boolean>>
  readonly handedOff: Readonly<Record<Seat, boolean>>
}

export function initialState(options: {
  mode: Mode
  seat?: Seat
  deep?: boolean
  route: Route
  howFar: HowFar
  names: Readonly<Record<Actor, string>>
  declared: readonly Declared[]
}): State {
  return {
    schema: SCHEMA,
    mode: options.mode,
    seat: options.seat ?? null,
    deep: options.mode !== "single" || options.deep === true,
    route: options.route,
    howFar: options.howFar,
    names: options.names,
    declared: options.declared,
    rows: [],
    checkout: null,
    baseline: null,
    imported: { A: false, B: false },
    handedOff: { A: false, B: false },
  }
}

// ---------------------------------------------------------------------------
// Commands

interface Envelope<T extends string> {
  readonly type: T
  readonly actor: Actor
  readonly at: string
}
interface Target {
  readonly id: string
  readonly rev: number
}

export type Command =
  | (Envelope<"run.escalate"> & { readonly declared: readonly Declared[] })
  | (Envelope<"run.set"> & { readonly howFar: HowFar; readonly reason: string })
  | (Envelope<"cold.import"> & { readonly rows: readonly Row[] })
  | (Envelope<"coverage.add"> & { readonly coverage: CoverageKind; readonly target: string; readonly state: Coverage["state"]; readonly note: string })
  | (Envelope<"coverage.set"> & Target & { readonly state: "covered" | "gap"; readonly note: string })
  | (Envelope<"issue.add"> & {
      readonly label: Label
      readonly certainty: number
      readonly facts: Facts
      readonly parents: readonly string[]
      readonly clusters: readonly string[]
      readonly state: "new" | "verified" | "assumed" | "accepted"
      readonly evidence: string
      readonly assumption: string
      readonly reason: string
    })
  | (Envelope<"issue.set"> & Target & {
      readonly facts: Partial<Facts>
      readonly label?: Label
      readonly labelReason: string
      readonly certainty?: number
      readonly parents?: readonly string[]
      readonly clusters?: readonly string[]
    })
  | (Envelope<"issue.verify"> & Target & { readonly certainty: number; readonly evidence: string })
  | (Envelope<"issue.assume"> & Target & { readonly certainty: number; readonly assumption: string; readonly reason: string })
  | (Envelope<"issue.agree"> & Target)
  | (Envelope<"issue.contest"> & Target & { readonly probe: string })
  | (Envelope<"issue.probe"> & Target & { readonly verdict: "verified" | "disproved"; readonly certainty: number; readonly evidence: string })
  | (Envelope<"issue.disprove"> & Target & { readonly certainty: number; readonly evidence: string })
  | (Envelope<"issue.duplicate"> & Target & { readonly of: string })
  | (Envelope<"issue.accept"> & Target & { readonly reason: string })
  | (Envelope<"issue.take"> & Target)
  | (Envelope<"issue.release"> & Target)
  | (Envelope<"issue.exit"> & Target & { readonly exit: ExitKind; readonly reference: string })
  | (Envelope<"question.add"> & {
      readonly issues: readonly string[]
      readonly fix: string
      readonly question: string
      readonly options: readonly string[]
      readonly recommendation: string
      readonly effect: string
      readonly cost: string
    })
  | (Envelope<"question.answer"> & Target & { readonly answer: string })
  | (Envelope<"proposed-fix.add"> & Shape & { readonly issues: readonly string[] })
  | (Envelope<"proposed-fix.set"> & Target & Partial<Shape>)
  | (Envelope<"proposed-fix.mark"> & Target)
  | (Envelope<"proposed-fix.reject"> & Target & { readonly reason: string })
  | (Envelope<"proposed-fix.drop"> & Target & { readonly reason: string })
  | (Envelope<"shelved-fix.add"> & { readonly fixes: readonly string[]; readonly artifact: string; readonly baseline: string; readonly dependencies: readonly Dependency[]; readonly validation: string; readonly validationDigest: string })
  | (Envelope<"shelved-fix.set"> & Target & { readonly artifact?: string; readonly baseline?: string; readonly dependencies?: readonly Dependency[]; readonly validation: string; readonly validationDigest: string })
  | (Envelope<"shelved-fix.review"> & Target & { readonly conditions: string })
  | (Envelope<"checkout.take"> & { readonly purpose: string })
  | (Envelope<"checkout.baseline"> & { readonly build: string; readonly test: string })
  | (Envelope<"checkout.release"> & { readonly reason: string })
  | (Envelope<"check-in.approve"> & { readonly shelves: readonly string[]; readonly executor: Actor; readonly approval: string })
  | (Envelope<"check-in.record"> & Target & { readonly changeset: string; readonly departures: string })
  | (Envelope<"check-in.drop"> & Target & { readonly reason: string })
  | Envelope<"handoff">

export type CommandType = Command["type"]

/** One command as it happened: who ran it, on which row, and the substance of what they said. */
export interface Event {
  readonly at: string
  readonly actor: Actor
  readonly command: CommandType | "init"
  readonly row: string
  readonly note: string
}

export const SITUATION_KINDS = ["cold pass", "working", "checkout", "waiting on checkout", "idle", "waiting on user", "no handoff", "done"] as const
export type SituationKind = (typeof SITUATION_KINDS)[number]

/** What an actor is doing or waiting on, derived from the state alone. */
export interface Situation {
  readonly kind: SituationKind
  readonly detail: string
}

/** An event with every actor's situation once it had landed. The timeline is derived from these. */
export interface Moment extends Event {
  readonly situations: Readonly<Partial<Record<Actor, Situation>>>
}

export interface Notification {
  readonly to: Actor
  readonly message: string
}

export interface Ready {
  readonly actor: Actor
  readonly command: CommandType
  readonly row: string
  readonly reason: string
}

export type Result =
  | { readonly ok: true; readonly state: State; readonly events: readonly Event[]; readonly notifications: readonly Notification[] }
  | { readonly ok: false; readonly error: string }

export class Refused extends Error {}

function refuse(message: string): never {
  throw new Refused(message)
}

// ---------------------------------------------------------------------------
// Lookups

export function otherSeat(seat: Seat): Seat {
  return seat === "A" ? "B" : "A"
}

export function isSeat(actor: Actor): actor is Seat {
  return actor === "A" || actor === "B"
}

export function rowById(state: State, id: string): Row | undefined {
  return state.rows.find((row) => row.id === id)
}

function row<K extends Kind>(state: State, id: string, kind: K): Extract<Row, { kind: K }> {
  const found = rowById(state, id)
  if (!found) refuse(`${id} does not exist`)
  if (found.kind !== kind) refuse(`${id} is a ${found.kind}, not a ${kind}`)
  return found as Extract<Row, { kind: K }>
}

function target<K extends Kind>(state: State, command: Target, kind: K): Extract<Row, { kind: K }> {
  const found = row(state, command.id, kind)
  if (found.rev !== command.rev) refuse(`${found.id} is at rev ${found.rev}, you read rev ${command.rev}; read it again`)
  return found
}

export function rowsOf<K extends Kind>(state: State, kind: K): readonly Extract<Row, { kind: K }>[] {
  return state.rows.filter((candidate): candidate is Extract<Row, { kind: K }> => candidate.kind === kind)
}

export function fixesForIssue(state: State, issueId: string): readonly ProposedFix[] {
  return rowsOf(state, "Proposed fix").filter((fix) => fix.issues.includes(issueId))
}

export function shelvesForFix(state: State, fixId: string): readonly ShelvedFix[] {
  return rowsOf(state, "Shelved fix").filter((shelf) => shelf.fixes.includes(fixId))
}

export function issuesOfShelf(state: State, shelf: ShelvedFix): readonly string[] {
  return [...new Set(shelf.fixes.flatMap((fixId) => rowById(state, fixId)?.kind === "Proposed fix" ? (rowById(state, fixId) as ProposedFix).issues : []))]
}

export function openQuestionFor(state: State, issueId: string): Question | undefined {
  return rowsOf(state, "Question").find((question) => question.state === "open" && question.issues.includes(issueId))
}

export function isSubstantive(issue: Issue): boolean {
  return issue.label === "Bug" || issue.label === "Restructure"
}

export function isComplete(fix: ProposedFix): boolean {
  return Boolean(fix.origin && fix.shape && fix.sites && fix.rulings && fix.test && fix.cost)
}

/** A proposed fix that is not live: its issues fell away, or a sibling proposal superseded it. */
export function isActiveFix(state: State, fix: ProposedFix): boolean {
  if (fix.state === "dropped") return false
  if (fix.goal) return true
  return fix.issues.some((id) => {
    const issue = rowById(state, id)
    return issue?.kind === "Issue" && !issue.exit && (issue.state === "verified" || issue.state === "assumed" || issue.state === "new" || issue.state === "contested")
  })
}

function isActiveShelf(state: State, shelf: ShelvedFix): boolean {
  return shelf.fixes.some((id) => isActiveFix(state, row(state, id, "Proposed fix")))
}

const FACT_SLOTS = ["trigger", "cause", "scope", "frequency", "impact"] as const

type Changes<T> = { -readonly [K in keyof T]?: T[K] }

// ---------------------------------------------------------------------------
// The reducer

interface Draft {
  rows: Row[]
  events: Event[]
  state: State
}

function nextId(state: State, prefix: string, owner: string): string {
  const pattern = new RegExp(`^${prefix}-${owner}-(\\d+)$`)
  const max = state.rows.reduce((high, candidate) => {
    const found = pattern.exec(candidate.id)
    return found ? Math.max(high, Number(found[1])) : high
  }, 0)
  return `${prefix}-${owner}-${max + 1}`
}

function seatOf(command: Command): Seat {
  if (!isSeat(command.actor)) refuse(`${command.type} is a reviewer's command; LEDGER_ME must be A or B`)
  return command.actor
}

function masterOf(command: Command): "master" {
  if (command.actor !== "master") refuse(`${command.type} is the master's command, on the user's word`)
  return "master"
}

function nonempty(value: string, what: string): string {
  if (!value.trim()) refuse(`${what} must not be empty`)
  return value.trim()
}

function certaintyIn(value: number, low: number, high: number, what: string): number {
  if (!Number.isInteger(value) || value < low || value > high) refuse(`${what} must be a certainty step from ${low} to ${high}`)
  return value
}

function replace(rows: Row[], next: Row): void {
  const index = rows.findIndex((candidate) => candidate.id === next.id)
  if (index < 0) rows.push(next)
  else rows[index] = next
}

function revise<R extends Row>(rows: Row[], current: R, changes: Partial<R>, editor: Actor, at: string): R {
  const next = { ...current, ...changes, editor, rev: current.rev + 1, updated: at } as R
  replace(rows, next)
  return next
}

/** Review changes propagate without pretending the saved candidate inputs changed. */
function clearDownstream(rows: Row[], from: Row, at: string, invalidation: "review" | "validation" = from.kind === "Shelved fix" ? "validation" : "review"): void {
  if (from.kind === "Issue") {
    for (const fix of rows.filter((candidate): candidate is ProposedFix => candidate.kind === "Proposed fix" && candidate.issues.includes(from.id))) {
      if (fix.mark) revise(rows, fix, { mark: null, state: "draft" } as Partial<ProposedFix>, fix.editor, at)
      clearDownstream(rows, fix, at, invalidation)
    }
  }
  if (from.kind === "Proposed fix" || from.kind === "Shelved fix") {
    const dependents = rows.filter((candidate): candidate is ShelvedFix => candidate.kind === "Shelved fix" && (from.kind === "Proposed fix"
      ? candidate.fixes.includes(from.id)
      : candidate.dependencies.some((dependency) => dependency.id === from.id)))
    for (const shelf of dependents) {
      replace(rows, { ...shelf, review: null,
        state: invalidation === "validation" ? "stale" : shelf.state === "reviewed" ? "shelved" : shelf.state,
        conditions: invalidation === "validation" ? `${from.id} changed or was dropped; refresh dependencies and validation` : shelf.conditions,
        updated: at })
      clearDownstream(rows, shelf, at, invalidation)
    }
  }
}

function requireSharedWriter(state: State, command: Command): void {
  if (state.mode === "cold" && command.actor !== state.seat) refuse(`this cold database belongs to ${state.seat}`)
  if (state.mode === "joint" && isSeat(command.actor) && !state.imported[command.actor]) {
    refuse(`import your cold pass before working in the shared database`)
  }
}

function requireShared(state: State, command: Command): void {
  requireSharedWriter(state, command)
  if (state.mode === "cold") refuse(`a cold pass finds issues alone; ${command.type.split(".")[0]} work starts after import into the shared database`)
}

function requireNoOpenQuestion(state: State, issueIds: readonly string[], fixIds: readonly string[] = []): void {
  for (const id of issueIds) {
    const question = openQuestionFor(state, id)
    if (question) refuse(`${id} waits for the user's answer to ${question.id}; take another issue`)
  }
  const question = rowsOf(state, "Question").find((question) => question.state === "open" && fixIds.includes(question.fix))
  if (question) refuse(`${question.fix} waits for the user's answer to ${question.id}; take other work`)
}

function requireDependencies(state: State, dependencies: readonly Dependency[], self = "", visited = new Set<string>()): void {
  for (const dependency of dependencies) {
    if (dependency.id === self) refuse("candidate dependencies must not form a cycle")
    const shelf = row(state, dependency.id, "Shelved fix")
    requireNoOpenQuestion(state, issuesOfShelf(state, shelf), shelf.fixes)
    if (shelf.rev !== dependency.rev) refuse(`${shelf.id} is at rev ${shelf.rev}; refresh its dependency revision and validation`)
    if (shelf.state === "stale") refuse(`${shelf.id} needs refreshed validation before dependent work can be reviewed`)
    if (!visited.has(shelf.id)) {
      visited.add(shelf.id)
      requireDependencies(state, shelf.dependencies, self, visited)
    }
  }
}

function requireSelection(state: State, shelves: readonly string[]): void {
  const visited = new Set<string>()
  const visit = (id: string) => {
    if (visited.has(id)) return
    visited.add(id)
    const shelf = row(state, id, "Shelved fix")
    if (!isActiveShelf(state, shelf)) refuse(`${shelf.id} no longer answers an active issue or feature goal`)
    if (shelf.state !== "reviewed") refuse(`${shelf.id} is ${shelf.state}; only a reviewed shelve is checked in`)
    requireDependencies(state, shelf.dependencies, shelf.id)
    requireNoOpenQuestion(state, issuesOfShelf(state, shelf), shelf.fixes)
    for (const dependency of shelf.dependencies) {
      const present = rowsOf(state, "Check-in").some((checkIn) => checkIn.state === "checked in" && checkIn.revisions.some((revision) => revision.id === dependency.id && revision.rev === dependency.rev))
      if (!present && !shelves.includes(dependency.id)) refuse(`${id} depends on ${dependency.id} rev ${dependency.rev}; include it in the user's selection or check it in first`)
      if (!present) visit(dependency.id)
    }
  }
  for (const id of shelves) visit(id)
}

function requireTakes(state: State, actor: Seat, issueIds: readonly string[]): void {
  if (state.mode !== "joint") return
  for (const id of issueIds) {
    const issue = row(state, id, "Issue")
    if (!isSubstantive(issue)) continue
    if (issue.taken !== actor) refuse(`take ${id} before writing its fix${issue.taken ? ` (taken by ${issue.taken})` : ""}`)
  }
}

function requireIssueSlots(issue: Issue, facts: Facts): void {
  if (!isSubstantive(issue)) return
  const missing: string[] = FACT_SLOTS.filter((slot) => !facts[slot].trim())
  if (facts.rank === null) missing.push("rank")
  if (missing.length > 0) refuse(`a ${issue.label} needs ${missing.join(", ")} before it is verified or assumed`)
}

function withText(text: string): string {
  return text.trim() ? `: ${text.trim()}` : ""
}

function decide(state: State, command: Command): Draft {
  const rows: Row[] = [...state.rows]
  const events: Event[] = []
  let next: State = state
  const at = command.at
  const note = (rowId: string, text: string) => events.push({ at, actor: command.actor, command: command.type, row: rowId, note: text })
  const base = (id: string, author: Actor) => ({ id, author, editor: author, rev: 1, created: at, updated: at })

  switch (command.type) {
    case "run.set": {
      if (state.mode === "cold") refuse("import the cold pass before changing the run's scope")
      if (state.mode === "joint") masterOf(command)
      else if (command.actor !== "A") refuse("the single run's owner changes its scope")
      if (!HOW_FAR.includes(command.howFar)) refuse(`how_far must be one of ${HOW_FAR.join(", ")}`)
      next = { ...state, howFar: command.howFar }
      note("run", `how far: ${command.howFar}; ${nonempty(command.reason, "reason: the user's instruction")}`)
      break
    }
    case "run.escalate": {
      seatOf(command)
      if (state.mode !== "single") refuse("only a single-reviewer run escalates; a two-reviewer run is already deep")
      next = { ...state, deep: true, declared: [...state.declared, ...command.declared] }
      note("run", "escalated to deep")
      break
    }

    case "cold.import": {
      const seat = seatOf(command)
      if (state.mode !== "joint") refuse("cold passes import into the shared two-reviewer database")
      if (state.imported[seat]) refuse(`${seat} already imported`)
      for (const imported of command.rows) {
        if (imported.kind !== "Coverage" && imported.kind !== "Issue") continue
        if (rows.some((candidate) => candidate.id === imported.id)) refuse(`${imported.id} already exists in the shared database`)
        rows.push(imported)
      }
      next = { ...state, imported: { ...state.imported, [seat]: true } }
      note("run", `${seat} imported ${command.rows.length} rows${command.rows.length > 0 ? `: ${command.rows.map((imported) => imported.id).join(", ")}` : ""}`)
      break
    }

    case "coverage.add": {
      const seat = seatOf(command)
      requireSharedWriter(state, command)
      const id = nextId(state, "C", seat)
      rows.push({ ...base(id, seat), kind: "Coverage", coverage: command.coverage, target: nonempty(command.target, "target"), state: command.state, note: command.note })
      note(id, `${command.coverage} ${command.target}: ${command.state}${withText(command.note)}`)
      break
    }

    case "coverage.set": {
      const seat = seatOf(command)
      requireSharedWriter(state, command)
      const coverage = target(state, command, "Coverage")
      if (coverage.author !== seat) refuse(`${coverage.id} is ${coverage.author}'s sweep`)
      revise(rows, coverage, { state: command.state, note: command.note }, seat, at)
      note(coverage.id, `${command.state}${withText(command.note)}`)
      break
    }

    case "issue.add": {
      const seat = seatOf(command)
      requireSharedWriter(state, command)
      if (!LABELS.includes(command.label)) refuse(`label must be one of ${LABELS.join(", ")}`)
      certaintyIn(command.certainty, 1, 5, "certainty")
      for (const parent of command.parents) row(state, parent, "Issue")
      const id = nextId(state, "I", seat)
      const issue: Issue = {
        ...base(id, seat), kind: "Issue", label: command.label, labelReason: "", state: "new", certainty: command.certainty,
        facts: { ...command.facts, claim: nonempty(command.facts.claim, "claim"), site: nonempty(command.facts.site, "site") },
        evidence: "", assumption: "", reason: "", probe: "", contestedBy: null, contests: 0, duplicateOf: "",
        parents: command.parents, clusters: command.clusters, mark: null, taken: null, exit: null,
      }
      let placed: Issue = issue
      if (command.state === "verified") {
        certaintyIn(command.certainty, 3, 5, "a verified issue's certainty")
        requireIssueSlots(issue, issue.facts)
        placed = { ...issue, state: "verified", evidence: nonempty(command.evidence, "evidence") }
      } else if (command.state === "assumed") {
        requireIssueSlots(issue, issue.facts)
        placed = { ...issue, state: "assumed", assumption: nonempty(command.assumption, "assumption"), reason: nonempty(command.reason, "why the uncertainty remains and what would resolve it") }
      } else if (command.state === "accepted") {
        if (issue.label !== "Nit") refuse("only a Nit is accepted with a reason; every other label gets its steps")
        placed = { ...issue, state: "accepted", reason: nonempty(command.reason, "reason") }
      }
      rows.push(placed)
      note(id, `${placed.label} ${placed.state}${placed.state === "verified" ? ` at step ${placed.certainty}` : ""}: ${placed.facts.claim} (${placed.facts.site})`)
      break
    }

    case "issue.set": {
      const seat = seatOf(command)
      requireSharedWriter(state, command)
      const issue = target(state, command, "Issue")
      if (issue.state === "disproved" || issue.state === "duplicate" || issue.state === "accepted") refuse(`${issue.id} is closed as ${issue.state}`)
      const changes: Changes<Issue> = { facts: { ...issue.facts, ...command.facts } }
      if (command.label !== undefined && command.label !== issue.label) {
        if (!LABELS.includes(command.label)) refuse(`label must be one of ${LABELS.join(", ")}`)
        changes.label = command.label
        changes.labelReason = nonempty(command.labelReason, "label_reason: every relabeled issue names its reason")
      }
      if (command.certainty !== undefined) {
        changes.certainty = issue.state === "verified"
          ? certaintyIn(command.certainty, 3, 5, "a verified issue's certainty")
          : certaintyIn(command.certainty, 1, 5, "certainty")
      }
      if (command.parents) { for (const parent of command.parents) row(state, parent, "Issue"); changes.parents = command.parents }
      if (command.clusters) changes.clusters = command.clusters
      if (issue.state === "contested") { changes.state = "new"; changes.contestedBy = null; changes.probe = "" }
      changes.mark = null
      const revised = revise(rows, issue, changes, seat, at)
      if (isSubstantive(revised) && (revised.state === "verified" || revised.state === "assumed")) requireIssueSlots(revised, revised.facts)
      clearDownstream(rows, revised, at)
      const edits = Object.entries(command.facts).map(([key, value]) => `${key}=${value ?? ""}`)
      if (changes.label) edits.push(`label=${changes.label} (${changes.labelReason})`)
      if (command.certainty !== undefined) edits.push(`certainty=${command.certainty}`)
      if (command.parents) edits.push(`parents=${command.parents.join(",")}`)
      if (command.clusters) edits.push(`clusters=${command.clusters.join(",")}`)
      note(issue.id, `${issue.state === "contested" ? "answered the contest with an edit" : "edited"}: ${edits.join("; ") || "nothing"}; marks cleared`)
      break
    }

    case "issue.verify":
    case "issue.assume": {
      const seat = seatOf(command)
      requireSharedWriter(state, command)
      const issue = target(state, command, "Issue")
      if (!["new", "contested", "verified", "assumed"].includes(issue.state)) refuse(`${issue.id} is ${issue.state}`)
      requireIssueSlots(issue, issue.facts)
      const changes: Partial<Issue> = command.type === "issue.verify"
        ? { state: "verified", certainty: certaintyIn(command.certainty, 3, 5, "a verified issue's certainty"), evidence: nonempty(command.evidence, "evidence") }
        : { state: "assumed", certainty: certaintyIn(command.certainty, 1, 5, "certainty"), assumption: nonempty(command.assumption, "assumption"), reason: nonempty(command.reason, "why the uncertainty remains and what would resolve it") }
      const revised = revise(rows, issue, { ...changes, mark: null, contestedBy: null, probe: "" }, seat, at)
      clearDownstream(rows, revised, at)
      note(issue.id, command.type === "issue.verify" ? `verified at step ${command.certainty}: evidence ${command.evidence}` : `assumed at step ${command.certainty}: ${command.assumption} (uncertainty: ${command.reason})`)
      break
    }

    case "issue.agree": {
      const seat = seatOf(command)
      requireSharedWriter(state, command)
      const issue = target(state, command, "Issue")
      if (issue.editor === seat) refuse(`nobody marks their own work: ${issue.id} rev ${issue.rev} is yours`)
      if (issue.state !== "verified" && issue.state !== "assumed") refuse(`${issue.id} is ${issue.state}; agree with a verified or assumed issue, or verify, disprove, duplicate, correct, or contest it`)
      if (issue.mark) refuse(`${issue.id} already carries ${issue.mark.by}'s mark`)
      replace(rows, { ...issue, mark: { by: seat, at }, updated: at })
      note(issue.id, `agreed by ${seat}`)
      break
    }

    case "issue.contest": {
      const seat = seatOf(command)
      requireSharedWriter(state, command)
      const issue = target(state, command, "Issue")
      if (issue.editor === seat) refuse(`${issue.id} rev ${issue.rev} is yours; the other reviewer contests it`)
      if (!["new", "verified", "assumed"].includes(issue.state)) refuse(`${issue.id} is ${issue.state}`)
      const contests = issue.contests + 1
      replace(rows, { ...issue, state: "contested", probe: nonempty(command.probe, "the probe that settles it"), contestedBy: seat, contests, mark: null, rev: issue.rev + 1, updated: at })
      clearDownstream(rows, issue, at)
      note(issue.id, `contested by ${seat}: ${command.probe}`)
      break
    }

    case "issue.probe": {
      const seat = seatOf(command)
      requireSharedWriter(state, command)
      const issue = target(state, command, "Issue")
      if (issue.state !== "contested") refuse(`${issue.id} is not contested`)
      if (issue.contestedBy !== seat) refuse(`${issue.contestedBy} contested ${issue.id} and runs its probe`)
      certaintyIn(command.certainty, 3, 5, "a discriminating check's certainty")
      const revised = revise(rows, issue, { state: command.verdict, certainty: command.certainty, evidence: nonempty(command.evidence, "evidence"), mark: null, contestedBy: null }, seat, at)
      clearDownstream(rows, revised, at)
      note(issue.id, `check settled: ${command.verdict} at step ${command.certainty}, evidence ${command.evidence}`)
      break
    }

    case "issue.disprove": {
      const seat = seatOf(command)
      requireSharedWriter(state, command)
      const issue = target(state, command, "Issue")
      if (!["new", "verified", "assumed", "contested"].includes(issue.state)) refuse(`${issue.id} is ${issue.state}`)
      certaintyIn(command.certainty, 3, 5, "a disproof's certainty")
      const revised = revise(rows, issue, { state: "disproved", certainty: command.certainty, evidence: nonempty(command.evidence, "evidence"), mark: null, taken: null }, seat, at)
      clearDownstream(rows, revised, at)
      note(issue.id, `disproved by ${seat} at step ${command.certainty}: ${command.evidence}`)
      break
    }

    case "issue.duplicate": {
      const seat = seatOf(command)
      requireSharedWriter(state, command)
      const issue = target(state, command, "Issue")
      if (!["new", "verified", "assumed", "contested"].includes(issue.state)) refuse(`${issue.id} is ${issue.state}`)
      const of = row(state, command.of, "Issue")
      if (of.id === issue.id) refuse("an issue cannot duplicate itself")
      if (of.state === "duplicate") refuse(`${of.id} is itself a duplicate of ${of.duplicateOf}`)
      const revised = revise(rows, issue, { state: "duplicate", duplicateOf: of.id, mark: null, taken: null }, seat, at)
      clearDownstream(rows, revised, at)
      note(issue.id, `duplicate of ${of.id}`)
      break
    }

    case "issue.accept": {
      const seat = seatOf(command)
      requireSharedWriter(state, command)
      const issue = target(state, command, "Issue")
      if (issue.label !== "Nit") refuse("only a Nit is accepted with a reason; every other label gets its steps")
      if (["disproved", "duplicate", "accepted"].includes(issue.state)) refuse(`${issue.id} is closed as ${issue.state}`)
      revise(rows, issue, { state: "accepted", reason: nonempty(command.reason, "reason") }, seat, at)
      note(issue.id, `accepted: ${command.reason}`)
      break
    }

    case "issue.take": {
      const seat = seatOf(command)
      requireShared(state, command)
      const issue = target(state, command, "Issue")
      if (issue.taken) refuse(`${issue.id} is taken by ${issue.taken}`)
      if (!["new", "verified", "assumed", "contested"].includes(issue.state) || issue.exit) refuse(`${issue.id} is closed as ${issue.state}`)
      requireNoOpenQuestion(state, [issue.id])
      replace(rows, { ...issue, taken: seat, updated: at })
      note(issue.id, `taken by ${seat}`)
      break
    }

    case "issue.release": {
      const seat = seatOf(command)
      requireShared(state, command)
      const issue = target(state, command, "Issue")
      if (issue.taken !== seat) refuse(`${issue.id} is ${issue.taken ? `taken by ${issue.taken}` : "not taken"}`)
      replace(rows, { ...issue, taken: null, updated: at })
      note(issue.id, "released")
      break
    }

    case "issue.exit": {
      requireSharedWriter(state, command)
      const issue = target(state, command, "Issue")
      if (issue.exit) refuse(`${issue.id} already left through ${issue.exit.kind}`)
      if (command.exit === "drop") masterOf(command)
      else seatOf(command)
      replace(rows, { ...issue, exit: { kind: command.exit, reference: nonempty(command.reference, "reference") }, taken: null, rev: issue.rev + 1, updated: at })
      clearDownstream(rows, issue, at)
      note(issue.id, `exit: ${command.exit} ${command.reference}`)
      break
    }

    case "question.add": {
      const seat = seatOf(command)
      requireShared(state, command)
      if (command.issues.length === 0 && !command.fix) refuse("a question names the issues or feature proposal it decides")
      for (const id of command.issues) row(state, id, "Issue")
      requireNoOpenQuestion(state, command.issues, command.fix ? [command.fix] : [])
      const options = command.options.map((option) => option.trim()).filter(Boolean)
      if (options.length < 2) refuse("a question offers at least two options")
      if (new Set(options).size !== options.length) refuse("question options must differ")
      const recommendation = nonempty(command.recommendation, "recommendation")
      if (!options.includes(recommendation)) refuse("the recommendation is one of the options, spelled the same")
      if (command.fix) {
        const fix = row(state, command.fix, "Proposed fix")
        if (!command.issues.every((id) => fix.issues.includes(id))) refuse(`${fix.id} does not answer every issue this question names`)
      }
      const id = nextId(state, "Q", seat)
      rows.push({
        ...base(id, seat), kind: "Question", issues: command.issues, fix: command.fix, question: nonempty(command.question, "question"),
        options, recommendation, effect: nonempty(command.effect, "effect: each option's cost in user effect"), cost: nonempty(command.cost, "cost: each option's cost in code"),
        state: "open", answer: "",
      })
      note(id, `asked about ${command.issues.join(", ")}: ${command.question}; options: ${options.join(" / ")}; recommendation: ${recommendation}`)
      break
    }

    case "question.answer": {
      masterOf(command)
      const question = target(state, command, "Question")
      if (question.state !== "open") refuse(`${question.id} is ${question.state}`)
      revise(rows, question, { state: "answered", answer: nonempty(command.answer, "answer") }, "master", at)
      if (question.fix) {
        const fix = rowById(state, question.fix)
        if (fix?.kind === "Proposed fix") {
          const revised = revise(rows, fix, { disputes: 0, state: "draft", mark: null, rejection: "" }, fix.editor, at)
          clearDownstream(rows, revised, at)
        }
      }
      for (const id of question.issues) clearDownstream(rows, row(state, id, "Issue"), at)
      note(question.id, `answered: ${command.answer}`)
      break
    }

    case "proposed-fix.add": {
      const seat = seatOf(command)
      requireShared(state, command)
      if (command.issues.length === 0 && !command.goal.trim()) refuse("a proposed fix names the issues or feature goal it answers")
      for (const id of command.issues) {
        const issue = row(state, id, "Issue")
        if (!["new", "verified", "assumed", "contested"].includes(issue.state) || issue.exit) refuse(`${id} is closed as ${issue.state}`)
      }
      requireNoOpenQuestion(state, command.issues)
      requireTakes(state, seat, command.issues)
      const id = nextId(state, "P", seat)
      rows.push({
        ...base(id, seat), kind: "Proposed fix", issues: command.issues, goal: command.goal, origin: command.origin, shape: nonempty(command.shape, "shape"),
        sites: command.sites, rulings: command.rulings, test: command.test, cost: nonempty(command.cost, "cost"), guardrail: command.guardrail,
        coordination: command.coordination, disputes: 0, state: "draft", rejection: "", dropReason: "", mark: null,
      })
      note(id, `proposed for ${command.issues.join(", ") || command.goal}: ${command.shape}`)
      break
    }

    case "proposed-fix.set": {
      const seat = seatOf(command)
      requireShared(state, command)
      const fix = target(state, command, "Proposed fix")
      if (fix.author !== seat) refuse(`${fix.id} is ${fix.author}'s proposal; reject it with a reason instead`)
      if (fix.state === "dropped") refuse(`${fix.id} was dropped on the user's word; retain it and create a new proposal if the goal changes`)
      requireNoOpenQuestion(state, fix.issues, [fix.id])
      const { type: _type, actor: _actor, at: _at, id: _id, rev: _rev, ...shape } = command
      const revised = revise(rows, fix, { ...shape, state: "draft", mark: null, rejection: "" }, seat, at)
      if (!revised.shape.trim() || !revised.cost.trim()) refuse("a proposed fix keeps its shape and cost")
      if (!revised.goal.trim() && revised.issues.length === 0) refuse("a proposed fix keeps its issues or feature goal")
      clearDownstream(rows, revised, at)
      const edits = Object.entries(shape).filter(([, value]) => value !== undefined).map(([key, value]) => `${key}=${value}`)
      note(fix.id, `${fix.state === "rejected" ? "revised after rejection" : "edited"}: ${edits.join("; ") || "nothing"}; mark cleared`)
      break
    }

    case "proposed-fix.mark": {
      const seat = seatOf(command)
      requireShared(state, command)
      const fix = target(state, command, "Proposed fix")
      if (fix.author === seat) refuse(`nobody marks their own work: ${fix.id} is yours`)
      if (fix.state !== "draft") refuse(`${fix.id} is ${fix.state}`)
      requireNoOpenQuestion(state, fix.issues, [fix.id])
      revise(rows, fix, { state: "marked", mark: { by: seat, at } }, fix.editor, at)
      note(fix.id, `marked by ${seat}`)
      break
    }

    case "proposed-fix.reject": {
      const seat = seatOf(command)
      requireShared(state, command)
      const fix = target(state, command, "Proposed fix")
      if (fix.author === seat) refuse(`${fix.id} is yours; edit it instead`)
      if (fix.state !== "draft") refuse(`${fix.id} is ${fix.state}`)
      const disputes = fix.disputes + 1
      revise(rows, fix, { state: "rejected", rejection: nonempty(command.reason, "reason"), disputes, mark: null }, fix.editor, at)
      note(fix.id, `rejected by ${seat}: ${command.reason}`)
      break
    }

    case "proposed-fix.drop": {
      masterOf(command)
      const fix = target(state, command, "Proposed fix")
      if (fix.state === "dropped") refuse(`${fix.id} was already dropped`)
      const revised = revise(rows, fix, { state: "dropped", dropReason: nonempty(command.reason, "reason: the user's instruction to drop this change"), mark: null }, command.actor, at)
      clearDownstream(rows, revised, at, "validation")
      for (const question of rowsOf(state, "Question")) {
        if (question.fix === fix.id && question.state === "open") revise(rows, question, { state: "withdrawn" }, command.actor, at)
      }
      for (const id of fix.issues) {
        const issue = row(state, id, "Issue")
        if (issue.taken === fix.author) replace(rows, { ...issue, taken: null })
      }
      note(fix.id, `dropped on the user's word: ${command.reason}`)
      break
    }

    case "shelved-fix.add":
    case "shelved-fix.set": {
      const seat = seatOf(command)
      requireShared(state, command)
      if (state.howFar === "report-only") refuse("report only: verify issues and write proposed fixes, change no code beyond probes")
      if (state.checkout?.holder !== seat) refuse("take the checkout before shelving; every edit in the shared checkout goes through it")
      const existing = command.type === "shelved-fix.set" ? target(state, command, "Shelved fix") : null
      if (existing && existing.author !== seat) refuse(`${existing.id} is ${existing.author}'s shelve`)
      const fixes = command.type === "shelved-fix.add" ? command.fixes : existing!.fixes
      if (fixes.length === 0) refuse("a shelved fix names the proposed fixes it applies")
      const artifact = nonempty(command.artifact ?? existing?.artifact ?? "", "artifact: a saved candidate patch or shelve")
      const baseline = nonempty(command.baseline ?? existing?.baseline ?? "", "baseline: the exact revision and preserved local changes")
      const dependencies = command.dependencies ?? existing?.dependencies ?? []
      const validation = nonempty(command.validation, "validation: the retained evidence record")
      const validationDigest = nonempty(command.validationDigest, "validation digest")
      if (existing && validationDigest === existing.validationDigest) refuse("refresh the validation record for this candidate revision; unchanged evidence cannot be carried forward silently")
      const id = existing?.id ?? nextId(state, "S", seat)
      requireDependencies(state, dependencies, id)
      const issueIds = new Set<string>()
      for (const fixId of fixes) {
        const fix = row(state, fixId, "Proposed fix")
        if (fix.state === "dropped") refuse(`${fix.id} was dropped; its candidate is retained as history`)
        if (fix.author !== seat) refuse(`${fix.id} is ${fix.author}'s proposal; its author shelves it`)
        if (!isComplete(fix)) {
          refuse(`${fix.id} is a direction, not a proposal: it needs origin, shape, sites, rulings, test, and cost before it is shelved`)
        }
        const other = shelvesForFix(state, fix.id).find((shelf) => shelf.id !== existing?.id)
        if (other) refuse(`${fix.id} is already shelved as ${other.id}`)
        for (const id of fix.issues) issueIds.add(id)
      }
      requireNoOpenQuestion(state, [...issueIds], fixes)
      if (!existing) requireTakes(state, seat, [...issueIds])
      const shelf: ShelvedFix = {
        ...(existing ?? base(id, seat)), kind: "Shelved fix", fixes, artifact, baseline, dependencies, validation, validationDigest,
        state: "shelved", conditions: "", review: null, editor: seat, rev: (existing?.rev ?? 0) + 1, updated: at,
      }
      replace(rows, shelf)
      if (existing) clearDownstream(rows, shelf, at)
      // The shelve records the work; the take has done its job.
      for (const candidate of rows) {
        if (candidate.kind === "Issue" && issueIds.has(candidate.id) && candidate.taken === seat) replace(rows, { ...candidate, taken: null })
      }
      note(id, `${existing ? "shelved again" : `shelved ${fixes.join(", ")}`} as ${artifact}; baseline ${baseline}; dependencies ${dependencies.map((dependency) => `${dependency.id}@${dependency.rev}`).join(", ") || "none"}; validation ${validation} (${validationDigest})`)
      break
    }

    case "shelved-fix.review": {
      const seat = seatOf(command)
      requireShared(state, command)
      const shelf = target(state, command, "Shelved fix")
      if (shelf.author === seat) refuse(`nobody marks their own work: ${shelf.id} is yours`)
      if (shelf.state !== "shelved") refuse(`${shelf.id} is ${shelf.state}`)
      requireNoOpenQuestion(state, issuesOfShelf(state, shelf), shelf.fixes)
      requireDependencies(state, shelf.dependencies, shelf.id)
      const conditions = command.conditions.trim()
      if (!conditions) {
        for (const id of issuesOfShelf(state, shelf)) {
          const issue = row(state, id, "Issue")
          if (!["verified", "assumed"].includes(issue.state)) refuse(`${id} is ${issue.state}; support or resolve the claim before a clean review`)
          if (issue.editor === seat && !issue.mark) refuse(`${id} rev ${issue.rev} was written by you; it needs an independent issue review`)
          if (!issue.mark) replace(rows, { ...issue, mark: { by: seat, at }, updated: at })
        }
        for (const id of shelf.fixes) {
          const fix = row(state, id, "Proposed fix")
          if (!isComplete(fix)) refuse(`${fix.id} is a direction, not a proposal: it needs origin, shape, sites, rulings, test, and cost before a clean review`)
          replace(rows, { ...fix, state: "marked", mark: { by: seat, at }, rejection: "", updated: at })
        }
      }
      replace(rows, { ...shelf, ...(conditions ? { state: "conditions" as const, conditions } : { state: "reviewed" as const, review: { by: seat, at } }), updated: at })
      note(shelf.id, conditions ? `conditions from ${seat}: ${conditions}` : `reviewed clean by ${seat}`)
      break
    }

    case "checkout.take": {
      const seat = seatOf(command)
      requireSharedWriter(state, command)
      if (state.mode === "cold") refuse("a cold pass is read-only against the shared checkout; record the probe and run it after import")
      if (state.checkout) refuse(`the checkout is held by ${state.checkout.holder} for ${state.checkout.purpose}; do other work`)
      next = { ...state, checkout: { holder: seat, purpose: nonempty(command.purpose, "purpose"), since: at } }
      note("checkout", `taken by ${seat}: ${command.purpose}`)
      break
    }

    case "checkout.baseline": {
      const seat = seatOf(command)
      if (state.checkout?.holder !== seat) refuse("the baseline is recorded by the holder of the checkout")
      if (state.baseline) refuse(`the baseline was recorded by ${state.baseline.by} at ${state.baseline.at}`)
      next = { ...state, baseline: { by: seat, build: nonempty(command.build, "build log"), test: nonempty(command.test, "test log"), at } }
      note("checkout", "baseline recorded")
      break
    }

    case "checkout.release": {
      if (!state.checkout) refuse("the checkout is not held")
      if (command.actor !== state.checkout.holder) {
        masterOf(command)
        nonempty(command.reason, `reason: the master releases ${state.checkout.holder}'s checkout only on the user's word`)
      }
      next = { ...state, checkout: null }
      note("checkout", command.actor === "master" ? `released by master: ${command.reason}` : "released")
      break
    }

    case "check-in.approve": {
      masterOf(command)
      if (state.howFar === "report-only") refuse("report only: nothing is checked in")
      if (command.shelves.length === 0) refuse("a check-in names the shelved fixes the user approved")
      requireSelection(state, command.shelves)
      for (const shelfId of command.shelves) {
        const shelf = row(state, shelfId, "Shelved fix")
        if (shelf.state !== "reviewed") refuse(`${shelf.id} is ${shelf.state}; only a reviewed shelve is checked in`)
        const live = rowsOf(state, "Check-in").find((checkIn) => checkIn.state !== "dropped" && checkIn.shelves.includes(shelfId))
        if (live) refuse(`${shelf.id} already belongs to ${live.id}`)
      }
      const id = nextId(state, "K", "M")
      rows.push({ ...base(id, "master"), kind: "Check-in", shelves: command.shelves, revisions: command.shelves.map((id) => ({ id, rev: row(state, id, "Shelved fix").rev })), executor: command.executor, approval: nonempty(command.approval, "approval: the user's words"), state: "approved", changeset: "", departures: "", reason: "" })
      note(id, `approved ${command.shelves.join(", ")}; ${command.executor} checks in: ${command.approval}`)
      break
    }

    case "check-in.record": {
      if (state.howFar === "report-only") refuse("report only: the user's narrowed scope pauses check-in execution")
      const checkIn = target(state, command, "Check-in")
      if (checkIn.state !== "approved") refuse(`${checkIn.id} is ${checkIn.state}`)
      if (command.actor !== checkIn.executor) refuse(`${checkIn.executor} performs ${checkIn.id}`)
      requireSelection(state, checkIn.shelves)
      for (const selected of checkIn.revisions) {
        if (row(state, selected.id, "Shelved fix").rev !== selected.rev) refuse(`${selected.id} changed since the user's selection; obtain authorization for its new revision`)
      }
      revise(rows, checkIn, { state: "checked in", changeset: nonempty(command.changeset, "changeset"), departures: command.departures }, command.actor, at)
      note(checkIn.id, `checked in as ${command.changeset}`)
      break
    }

    case "check-in.drop": {
      masterOf(command)
      const checkIn = target(state, command, "Check-in")
      if (checkIn.state !== "approved") refuse(`${checkIn.id} is ${checkIn.state}`)
      revise(rows, checkIn, { state: "dropped", reason: nonempty(command.reason, "reason") }, "master", at)
      note(checkIn.id, `dropped: ${command.reason}`)
      break
    }

    case "handoff": {
      const seat = seatOf(command)
      if (state.mode !== "joint") refuse("handoff belongs to a two-reviewer run; a single run prints its report")
      if (!state.imported[seat]) refuse("import your cold pass first")
      if (state.checkout?.holder === seat) refuse("release the checkout before handing off")
      const pending = ready(state, seat)
      if (pending.length > 0) refuse(`ready work remains: ${pending.map((item) => item.row || item.command).join(", ")}`)
      next = { ...state, handedOff: { ...state.handedOff, [seat]: true } }
      note("run", `${seat} handed off`)
      break
    }
  }

  return { rows, events, state: { ...next, rows } }
}

export function transition(state: State, command: Command): Result {
  try {
    const draft = decide(state, command)
    let after = draft.state
    // A reviewer who handed off is back at work as soon as work is ready for them.
    if (after.mode === "joint") {
      for (const seat of ["A", "B"] as const) {
        if (after.handedOff[seat] && (ready(after, seat).length > 0 || command.actor === seat && command.type !== "handoff")) {
          after = { ...after, handedOff: { ...after.handedOff, [seat]: false } }
        }
      }
    }
    return { ok: true, state: after, events: draft.events, notifications: notify(state, after, command) }
  } catch (error) {
    if (error instanceof Refused) return { ok: false, error: error.message }
    throw error
  }
}

// ---------------------------------------------------------------------------
// Ready work: what each actor can do now. Waiting on one row never blocks another.

function add(list: Ready[], actor: Actor, command: CommandType, row: string, reason: string): void {
  list.push({ actor, command, row, reason })
}

function shelfBlocked(state: State, shelf: ShelvedFix, visited = new Set<string>()): boolean {
  if (visited.has(shelf.id)) return false
  visited.add(shelf.id)
  return rowsOf(state, "Question").some((question) => question.state === "open" && (shelf.fixes.includes(question.fix) || question.issues.some((id) => issuesOfShelf(state, shelf).includes(id))))
    || shelf.dependencies.some((dependency) => shelfBlocked(state, row(state, dependency.id, "Shelved fix"), visited))
}

export function ready(state: State, actor: Actor): readonly Ready[] {
  const list: Ready[] = []
  if (state.mode === "cold" && actor !== state.seat) return list
  if (state.mode === "joint" && isSeat(actor) && !state.imported[actor]) return list

  if (state.howFar !== "report-only") {
    for (const checkIn of rowsOf(state, "Check-in")) {
      if (checkIn.state === "approved" && checkIn.executor === actor) add(list, actor, "check-in.record", checkIn.id, "record the approved check-in")
    }
  }

  if (actor === "master") {
    for (const question of rowsOf(state, "Question")) {
      if (question.state === "open") add(list, actor, "question.answer", question.id, "the user answers this question")
    }
    return list
  }
  const seat = actor
  const single = state.mode === "single"

  // Single mode: B is the fresh subagent that reviews diffs and nothing else.
  if (single && seat === "B") {
    for (const shelf of rowsOf(state, "Shelved fix")) {
      if (shelf.state === "shelved" && shelf.author !== seat && isActiveShelf(state, shelf) && !shelfBlocked(state, shelf)) add(list, seat, "shelved-fix.review", shelf.id, "review the claim, candidate, and validation in a fresh context")
    }
    return list
  }

  if (state.mode !== "joint") {
    for (const declared of state.declared) {
      const covered = state.rows.some((candidate) => candidate.kind === "Coverage" && candidate.coverage === declared.coverage && candidate.target === declared.target)
        || (declared.coverage === "cluster" && rowsOf(state, "Issue").some((issue) => issue.clusters.includes(declared.target) && issue.state !== "disproved" && issue.state !== "duplicate"))
      if (!covered) add(list, seat, "coverage.add", "", `cover ${declared.coverage} ${declared.target}`)
    }
  }
  for (const coverage of rowsOf(state, "Coverage")) {
    if (coverage.author === seat && coverage.state === "open") add(list, seat, "coverage.set", coverage.id, "finish this sweep: covered or gap")
  }

  for (const issue of rowsOf(state, "Issue")) {
    if (!isSubstantive(issue) || issue.exit) continue
    if (openQuestionFor(state, issue.id)) continue
    if (issue.state === "new" && issue.editor === seat) add(list, seat, "issue.verify", issue.id, "verify, assume, or drop your issue")
    const needsClaimReview = state.howFar === "report-only" || fixesForIssue(state, issue.id).some((fix) => shelvesForFix(state, fix.id).some((shelf) => shelf.author === seat && issue.editor !== seat))
    if (state.mode !== "cold" && needsClaimReview && ["new", "verified", "assumed"].includes(issue.state) && issue.editor !== seat && !issue.mark) {
      add(list, seat, "issue.agree", issue.id, "check the other reviewer's issue: agree, disprove, duplicate, correct, or contest")
    }
    if (issue.state === "contested") {
      if (issue.editor === seat) add(list, seat, "issue.set", issue.id, `answer the contest with evidence: ${issue.probe}`)
      if (issue.contestedBy === seat) add(list, seat, "issue.probe", issue.id, `run or prove the discriminating check and record its verdict: ${issue.probe}`)
    }
    if (state.mode === "cold" || !["new", "verified", "assumed", "contested"].includes(issue.state)) continue
    const fixes = fixesForIssue(state, issue.id).filter((fix) => isActiveFix(state, fix))
    if (fixes.length === 0) {
      if (single || issue.taken === seat) add(list, seat, "proposed-fix.add", issue.id, "write the proposed fix")
      else if (!issue.taken && (issue.editor === seat || ["verified", "assumed"].includes(issue.state))) add(list, seat, "issue.take", issue.id, "take this investigation and develop its candidate")
    }
  }

  for (const fix of rowsOf(state, "Proposed fix")) {
    if (!isActiveFix(state, fix)) continue
    if (fix.issues.some((id) => openQuestionFor(state, id)) || rowsOf(state, "Question").some((question) => question.state === "open" && question.fix === fix.id)) continue
    const mine = fix.author === seat
    const shelves = shelvesForFix(state, fix.id)
    if (state.howFar === "report-only" && fix.state === "rejected") {
      if (mine) add(list, seat, "proposed-fix.set", fix.id, `revise: ${fix.rejection}`)
      continue
    }
    if (state.howFar === "report-only" && fix.state === "draft" && !mine && state.mode === "joint") add(list, seat, "proposed-fix.mark", fix.id, "assess the proposed change and its evidence")
    if (state.howFar === "report-only" || shelves.length > 0) continue
    const owner = mine && (single || fix.issues.every((id) => { const issue = rowById(state, id) as Issue; return !isSubstantive(issue) || issue.taken === seat }))
    if (!owner) continue
    if (!isComplete(fix)) {
      add(list, seat, "proposed-fix.set", fix.id, "complete the mechanism, sites, rulings, and validation plan before recording a candidate")
      continue
    }
    if (!state.checkout) add(list, seat, "checkout.take", fix.id, "take the checkout and develop the candidate with claim-appropriate evidence")
    else if (state.checkout.holder === seat) add(list, seat, "shelved-fix.add", fix.id, "save the candidate, baseline, dependencies, and validation record")
  }

  for (const shelf of rowsOf(state, "Shelved fix")) {
    if (!isActiveShelf(state, shelf) || shelfBlocked(state, shelf)) continue
    if (shelf.state === "shelved" && shelf.author !== seat) add(list, seat, "shelved-fix.review", shelf.id, "review the current claim, candidate, failure paths, and applicable evidence together")
    if (state.howFar !== "report-only" && ["conditions", "stale"].includes(shelf.state) && shelf.author === seat) {
      if (!state.checkout) add(list, seat, "checkout.take", shelf.id, `take the checkout and meet the conditions: ${shelf.conditions}`)
      else if (state.checkout.holder === seat) add(list, seat, "shelved-fix.set", shelf.id, `meet the conditions and shelve again: ${shelf.conditions}`)
    }
  }

  if (state.checkout?.holder === seat && list.length === 0) add(list, seat, "checkout.release", "", "nothing left to do under this hold: remove every probe and release")
  if (state.mode === "cold" && list.length === 0) add(list, seat, "cold.import", "", "import this cold pass into the shared database")
  return list
}

/** Both reviewers handed off with nothing ready, or a single run with nothing ready and the checkout free. */
export function isDone(state: State): boolean {
  if (state.mode === "cold") return false
  if (state.checkout) return false
  if (ready(state, "A").length > 0 || ready(state, "B").length > 0) return false
  return state.mode === "single" || (state.handedOff.A && state.handedOff.B)
}

// ---------------------------------------------------------------------------
// Situations: what each actor is doing or waiting on, read off the state. Recorded
// with every event so the timeline can say who worked, who waited, and on whom.

function rowList(items: readonly Ready[]): string {
  return [...new Set(items.map((item) => item.row || item.command))].join(", ")
}

export function situation(state: State, actor: Actor): Situation {
  const open = rowsOf(state, "Question").filter((question) => question.state === "open").map((question) => question.id)
  const mine = ready(state, actor)
  if (actor === "master") {
    if (mine.some((item) => item.command !== "question.answer")) return { kind: "working", detail: rowList(mine.filter((item) => item.command !== "question.answer")) }
    if (open.length > 0) return { kind: "waiting on user", detail: open.join(", ") }
    if (isDone(state)) return { kind: "done", detail: "report" }
    return { kind: "idle", detail: "waiting on the reviewers" }
  }
  if (state.mode === "joint" && !state.imported[actor]) return { kind: "cold pass", detail: "" }
  if (state.checkout?.holder === actor) return { kind: "checkout", detail: state.checkout.purpose }
  const taken = rowsOf(state, "Issue").filter((issue) => issue.taken === actor).map((issue) => issue.id)
  if (mine.length > 0) return { kind: "working", detail: `${rowList(mine)}${taken.length > 0 ? `; fixing ${taken.join(", ")}` : ""}` }
  if (state.checkout && ready({ ...state, checkout: null }, actor).some((item) => item.command === "checkout.take")) {
    return { kind: "waiting on checkout", detail: `held by ${state.checkout.holder}: ${state.checkout.purpose}` }
  }
  if (state.mode !== "joint") return isDone(state) ? { kind: "done", detail: "" } : { kind: "idle", detail: "nothing ready" }
  if (!state.handedOff[actor]) return { kind: "no handoff", detail: "nothing ready and not handed off" }
  // No count of the other's ready work here: it changes at their every command and would split one wait into many.
  const other = otherSeat(actor)
  if (!state.handedOff[other] || ready(state, other).length > 0) return { kind: "idle", detail: `handed off; waiting on ${other}` }
  if (open.length > 0) return { kind: "waiting on user", detail: open.join(", ") }
  return { kind: "done", detail: "" }
}

/** The actors a database speaks for: the cold seat alone, both seats, or both seats and the master. */
export function actorsOf(state: State): readonly Actor[] {
  if (state.mode === "cold") return state.seat ? [state.seat] : []
  return state.mode === "single" ? ["A", "B"] : ["A", "B", "master"]
}

export function situations(state: State): Partial<Record<Actor, Situation>> {
  const result: Partial<Record<Actor, Situation>> = {}
  for (const actor of actorsOf(state)) result[actor] = situation(state, actor)
  return result
}

// ---------------------------------------------------------------------------
// Messages: the script does the talking. Only a two-reviewer run has agents to tell.

const LEDGER = '"$LEDGER_DIR/bin/ledger.ts"'

function notify(before: State, after: State, command: Command): Notification[] {
  const messages: Notification[] = []
  if (after.mode !== "joint") return messages
  for (const seat of ["A", "B"] as const) {
    const was = ready(before, seat).length
    const now = ready(after, seat)
    if (was === 0 && now.length > 0 && command.actor !== seat) {
      messages.push({ to: seat, message: `ready for you: ${now.map((item) => item.row || item.reason).join(", ")}. Next: ${LEDGER} status` })
    }
  }
  if (command.type === "handoff" && isSeat(command.actor)) {
    const other = otherSeat(command.actor)
    const awaiting = ready(after, other)
    if (!isDone(after)) {
      messages.push({ to: other, message: `${command.actor} handed off. ${awaiting.length === 0 ? "Nothing awaits you; hand off when your ready work is empty." : `Awaiting you: ${awaiting.map((item) => item.row || item.reason).join(", ")}.`} Next: ${LEDGER} status` })
    }
  }
  if (command.type === "question.add") {
    const open = rowsOf(after, "Question").filter((question) => question.state === "open")
    for (const question of open) {
      messages.push({ to: "master", message: `question: ${question.id} ${question.question} | options: ${question.options.join(" | ")} | recommendation: ${question.recommendation} | effect: ${question.effect} | cost: ${question.cost} | issues: ${question.issues.join(", ")}. Next: ${LEDGER} question answer ${question.id} rev=${question.rev} answer=<the user's words>` })
    }
  }
  if (command.type === "question.answer") {
    const question = rowById(after, command.id) as Question
    messages.push({ to: question.author, message: `${question.id} answered: ${question.answer}. Next: ${LEDGER} status` })
  }
  if (isDone(after) && !isDone(before)) {
    messages.push({ to: "master", message: `both reviewers handed off with nothing ready. Next: ${LEDGER} report` })
  }
  return messages
}
