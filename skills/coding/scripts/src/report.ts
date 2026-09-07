// Status and report rendering. Reads state, prints Markdown, decides nothing.
import {
  fixesForIssue,
  freshReviews,
  isDone,
  isComplete,
  isHistoricalShelf,
  ready,
  reviewBasis,
  rowById,
  rowsOf,
  shelvesForFix,
  SITUATION_KINDS,
  type Actor,
  type Event,
  type Issue,
  type Moment,
  type Mark,
  type ProposedFix,
  type Ready,
  type Seat,
  type ShelvedFix,
  type Situation,
  type State,
} from "./protocol.ts"

export const LEDGER = '"$LEDGER_DIR/bin/ledger.ts"'

export type Notes = Partial<Record<Seat, string>>

function cell(value: unknown): string {
  const text = String(value ?? "").replaceAll("|", "\\|").replaceAll(/\r?\n/g, " ").trim()
  return text || "-"
}

function table(headers: readonly string[], rows: readonly (readonly unknown[])[]): string {
  if (rows.length === 0) return "None."
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(cell).join(" | ")} |`),
  ].join("\n")
}

function list(values: readonly string[]): string {
  return values.length === 0 ? "-" : values.join(", ")
}

function markText(mark: Mark | null): string {
  return mark ? `${mark.by}${mark.reader ? ` (${mark.reader}; ${mark.assessment})` : ""}` : ""
}

function shelfState(state: State, shelf: ShelvedFix): string {
  return isHistoricalShelf(state, shelf) ? `${shelf.state} (historical bundle)` : shelf.state
}

// ---------------------------------------------------------------------------
// The exact next command for each piece of ready work.

export function commandFor(state: State, item: Ready): string {
  const row = item.row ? rowById(state, item.row) : undefined
  const at = row ? ` ${row.id} rev=${row.rev}` : ""
  const assessment = ["issue.agree", "proposed-fix.mark", "shelved-fix.review"].includes(item.command)
    ? ` basis=${reviewBasis(state, item.row)}${item.actor === "reader" ? " reader=<fresh context name> assessment=<retained file>" : ""}` : ""
  switch (item.command) {
    case "coverage.add": return `coverage add kind=<kind> target=<target> state=<covered|gap> note=<what you checked>`
    case "coverage.set": return `coverage set${at} state=<covered|gap> note=<what you checked>`
    case "issue.verify": return `issue verify${at} certainty=<3|4|5> evidence=<record> | issue assume${at} certainty=<1-5> assumption=<fact> reason=<what remains uncertain> | issue disprove${at} certainty=<3-5> evidence=<record>`
    case "issue.agree": return `issue agree${at}${assessment} | issue contest${at} probe=<probe> | issue disprove${at} certainty=<3-5> evidence=<record> | issue duplicate${at} of=<I-id> | issue set${at} <field>=<correction>`
    case "issue.set": return `issue set${at} <field>=<correction> | issue verify${at} certainty=<3|4|5> evidence=<record>`
    case "issue.probe": return `issue probe${at} verdict=<verified|disproved> certainty=<3|4|5> evidence=<record>`
    case "issue.take": return `issue take${at}`
    case "proposed-fix.add": return `proposed-fix add issues=${item.row} origin=<mechanism or requirement> shape=<shape> sites=<sites walked> rulings=<rulings checked> test=<validation plan> cost=<cost>`
    case "proposed-fix.set": return `proposed-fix set${at} <field>=<value>`
    case "proposed-fix.take": return `proposed-fix take${at}`
    case "proposed-fix.mark": return `proposed-fix mark${at}${assessment} | proposed-fix reject${at} reason=<reason>${assessment}`
    case "question.add": {
      const fix = row as ProposedFix | undefined
      return `question add issues=${fix ? fix.issues.join(",") : "<I-ids>"}${fix ? ` fix=${fix.id}` : ""} question=<text> options="(a) ..., (b) ..." recommendation=<one option> effect=<user effect per option> cost=<code cost per option>`
    }
    case "question.answer": return `question answer${at} answer=<the user's words>`
    case "checkout.take": return `checkout take purpose=<what you will do>`
    case "checkout.baseline": return `checkout baseline build=<log path> test=<log path>`
    case "checkout.release": return `checkout release`
    case "shelved-fix.add": return `shelved-fix add fixes=${item.row} artifact=<saved candidate> baseline=<exact base> validation=<record> dependencies=<S-id@rev,...>`
    case "shelved-fix.set": return `shelved-fix set${at} validation=<refreshed record> artifact=<saved candidate> baseline=<exact base> dependencies=<S-id@rev,...>`
    case "shelved-fix.request-review": return `shelved-fix request-review${at} reason=<observation or ruling resolving the conditions>`
    case "shelved-fix.review": return `shelved-fix review${at}${assessment} | shelved-fix review${at} conditions=<what must change>${assessment}`
    case "check-in.record": return `check-in record${at} changeset=<id> departures=<none or text>`
    case "cold.import": return `import`
    default: return item.command.replace(".", " ")
  }
}

function pinned(command: string): string {
  return command.split(" | ").map((option) => `\`${LEDGER} ${option}\``).join(" or ")
}

// ---------------------------------------------------------------------------
// Status

function nextStep(state: State, actor: Actor): string {
  const mine = ready(state, actor)
  if (mine.length > 0) return "take any item above; waiting on one never blocks another"
  if (actor === "reader") return "no fresh assessment pending"
  const arranging = freshReviews(state).filter((review) => review.arranger === actor)
  if (arranging.length > 0) return `check your working note for ${arranging.map((review) => `${review.row}@${review.rev} basis=${reviewBasis(state, review.row)}`).join(", ")}; give changed inputs to an existing child for reassessment, without starting a duplicate; only you arrange these fresh contexts with LEDGER_ME=reader. Continue other work or hand off while they run`
  if (state.mode === "cold") return `${LEDGER} import`
  if (actor === "master") {
    if (isDone(state)) return `${LEDGER} report`
    return state.mode === "joint" ? "wait: questions arrive here; the script says when both reviewers are done" : "wait for the reviewer"
  }
  if (state.mode === "single") {
    if (actor === "A" && ready(state, "B").length > 0) return `check your working note for ${ready(state, "B").map((item) => `${item.row} basis=${reviewBasis(state, item.row)}`).join(", ")}; update an existing B reader's inputs for reassessment, or dispatch a fresh subagent as B if none exists`
    return actor === "A" ? `${LEDGER} report` : "nothing to review"
  }
  if (state.checkout?.holder === actor) return `${LEDGER} checkout release`
  if (state.handedOff[actor]) return "handed off; the script tells you when work is ready"
  return `${LEDGER} handoff`
}

export function summary(state: State, actor: Actor): string {
  return [
    `ready work: A ${ready(state, "A").length}, B ${ready(state, "B").length}${state.mode === "joint" ? `, master ${ready(state, "master").length}` : ""}${ready(state, "reader").length > 0 ? `, fresh reader ${ready(state, "reader").length}` : ""}`,
    `next for ${actor}: ${nextStep(state, actor)}`,
  ].join("\n")
}

export function renderStatus(state: State, actor: Actor): string {
  const counts = new Map<string, number>()
  for (const row of state.rows) {
    const key = `${row.kind}: ${row.kind === "Shelved fix" ? shelfState(state, row) : row.state}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const issues = rowsOf(state, "Issue")
  const taken = issues.filter((issue) => issue.taken)
  const open = rowsOf(state, "Question").filter((question) => question.state === "open")
  const mine = ready(state, actor)
  const assessments = state.mode === "single"
    ? ready(state, "B").filter((item) => item.command === "shelved-fix.review").map((item) => ({ row: item.row, rev: rowById(state, item.row)!.rev, arranger: "A" }))
    : freshReviews(state)
  return [
    `# Status (${state.mode}${state.seat ? ` ${state.seat}` : ""}, ${state.route}, ${state.deep ? "deep" : state.route === "review" ? "quick" : "plain"}, ${state.howFar})`,
    "",
    `Checkout: ${state.checkout ? `${state.checkout.holder} since ${state.checkout.since} (${state.checkout.purpose})` : "free"}. Baseline: ${state.baseline ? `recorded by ${state.baseline.by}` : "none"}.`,
    state.mode === "joint" ? `Imported: A ${state.imported.A ? "yes" : "no"}, B ${state.imported.B ? "yes" : "no"}. Handed off: A ${state.handedOff.A ? "yes" : "no"}, B ${state.handedOff.B ? "yes" : "no"}.` : "",
    "",
    "## Rows",
    "",
    table(["Row", "Count"], [...counts.entries()].sort()),
    "",
    "## Issues",
    "",
    table(["Id", "Rev", "Label", "State", "Step", "Mark", "Taken", "Claim"], issues.map((issue) => [issue.id, issue.rev, issue.label, issue.state, issue.certainty, issue.mark?.by ?? "", issue.taken ?? "", issue.facts.claim])),
    taken.length > 0 ? `\nTaken: ${taken.map((issue) => `${issue.id} by ${issue.taken}`).join(", ")}` : "",
    "",
    "## Proposal ownership",
    "",
    table(["Id", "Rev", "Owner", "Contributors", "Candidate"], rowsOf(state, "Proposed fix").map((fix) => [fix.id, fix.rev, fix.owner ?? "released", fix.contributors.join(", "), shelvesForFix(state, fix.id).map((shelf) => `${shelf.id}@${shelf.rev}${isHistoricalShelf(state, shelf) ? " (historical bundle)" : ""}`).join(", ")])),
    "",
    "## Open questions",
    "",
    table(["Id", "Rev", "Issues", "Question", "Options", "Recommendation"], open.map((question) => [question.id, question.rev, question.issues.join(", "), question.question, question.options.join(" / "), question.recommendation])),
    "",
    `## Ready for ${actor}`,
    "",
    mine.length === 0 ? "Nothing." : mine.map((item) => `- ${item.row ? `${item.row}: ` : ""}${item.reason}. ${pinned(commandFor(state, item))}`).join("\n"),
    "",
    ...(assessments.length > 0 ? [
      "## Pending fresh assessments",
      "",
      table(["Target", "Rev", "Basis", "Arranger"], assessments.map((review) => [review.row, review.rev, reviewBasis(state, review.row), review.arranger])),
      "",
      "Only the named arranger starts each reader. Retain the basis with the child's target. If it changes, give the existing child the changed inputs for reassessment; do not start a duplicate reader. The working note records child activity; this table lists assessments still needed.",
      "",
    ] : []),
    summary(state, actor),
  ].filter((line) => line !== null).join("\n")
}

// ---------------------------------------------------------------------------
// Report

function rank(issue: Issue): number {
  return issue.facts.rank ?? 9
}

function fixState(state: State, issue: Issue): string {
  const fixes = fixesForIssue(state, issue.id)
  if (fixes.length === 0) return issue.exit ? `exit: ${issue.exit.kind} ${issue.exit.reference}` : "no fix"
  return fixes.map((fix) => {
    const shelves = shelvesForFix(state, fix.id)
    const shelf = shelves.map((candidate) => `${candidate.id} ${shelfState(state, candidate)}${checkedIn(state, candidate)}`).join(", ")
    return `${fix.id} ${isComplete(fix) ? fix.state : "direction"}${fix.mark ? ` (mark ${fix.mark.by})` : ""}${shelf ? `; ${shelf}` : ""}`
  }).join("; ")
}

function checkedIn(state: State, shelf: ShelvedFix): string {
  const checkIn = rowsOf(state, "Check-in").find((candidate) => candidate.shelves.includes(shelf.id) && candidate.state !== "dropped")
  return checkIn ? ` (${checkIn.state}${checkIn.changeset ? ` ${checkIn.changeset}` : ""})` : ""
}

function issueTable(state: State, issues: readonly Issue[]): string {
  return table(
    ["Rank", "Id", "Label", "State", "Step", "Marks", "Site", "Claim", "Trigger", "Impact", "Evidence", "Fix"],
    issues.map((issue) => [
      issue.facts.rank ?? "", issue.id, issue.label, issue.state === "duplicate" ? `duplicate of ${issue.duplicateOf}` : issue.state, issue.certainty,
      issue.mark ? issue.mark.by : "none", issue.facts.site, issue.facts.claim, issue.facts.trigger, issue.facts.impact,
      issue.evidence || issue.assumption || issue.reason, fixState(state, issue),
    ]),
  )
}

function renderCoverage(state: State): string {
  const rows = rowsOf(state, "Coverage")
  const gaps = state.declared.filter((declared) =>
    !rows.some((row) => row.coverage === declared.coverage && row.target === declared.target) &&
    !(declared.coverage === "cluster" && rowsOf(state, "Issue").some((issue) => issue.clusters.includes(declared.target) && issue.state !== "disproved" && issue.state !== "duplicate")))
  return [
    gaps.length === 0 ? "Every declared hunk, symptom, cluster, and scenario has a sweep result." : `Coverage gaps, never a silent clean: ${gaps.map((gap) => `${gap.coverage} ${gap.target}`).join("; ")}.`,
    "",
    table(["Id", "Kind", "Target", "State", "By", "Note"], rows.map((row) => [row.id, row.coverage, row.target, row.state, row.author, row.note])),
  ].join("\n")
}

function renderNotes(state: State, notes: Notes): string {
  const seats: readonly Seat[] = state.mode === "single" ? ["A"] : ["A", "B"]
  return seats.map((seat) => `### Notes from ${state.names[seat]} (${seat})\n\n${notes[seat]?.trim() || "Notes not supplied."}`).join("\n\n")
}

function renderValidation(state: State): string {
  const shelves = rowsOf(state, "Shelved fix")
  return [
    state.baseline ? `Baseline: build ${state.baseline.build}, tests ${state.baseline.test}.` : "Baseline: not recorded.",
    ...shelves.map((shelf) => `${shelf.id}@${shelf.rev}: baseline ${shelf.baseline}; dependencies ${shelf.dependencies.map((dependency) => `${dependency.id}@${dependency.rev}`).join(", ") || "none"}; validation ${shelf.validation} (${shelf.validationDigest}); ${shelfState(state, shelf)}${shelf.review ? ` by ${shelf.review.by}` : ""}.`),
    state.checkout ? `Checkout: held by ${state.checkout.holder}; the tree may hold probes.` : "Checkout: free. Probe cleanup must be verified in the validation record; releasing the hold does not prove it.",
  ].map((line) => `- ${line}`).join("\n")
}

export function renderReport(state: State, events: readonly Moment[], notes: Notes): string {
  const issues = rowsOf(state, "Issue")
  const substantive = issues.filter((issue) => (issue.label === "Bug" || issue.label === "Restructure")).sort((left, right) => rank(left) - rank(right))
  const others = (label: Issue["label"]) => issues.filter((issue) => issue.label === label)
  const questions = rowsOf(state, "Question")
  const fixes = rowsOf(state, "Proposed fix")
  const shelves = rowsOf(state, "Shelved fix")
  const checkIns = rowsOf(state, "Check-in")
  const openCount = substantive.filter((issue) => !["disproved", "duplicate"].includes(issue.state) && !issue.exit && !fixesForIssue(state, issue.id).some((fix) => shelvesForFix(state, fix.id).some((shelf) => !isHistoricalShelf(state, shelf) && shelf.state === "reviewed"))).length
  const unresolvedCount = issues.filter((issue) => !["disproved", "duplicate", "accepted"].includes(issue.state) && !issue.exit && !fixesForIssue(state, issue.id).some((fix) => shelvesForFix(state, fix.id).some((shelf) => !isHistoricalShelf(state, shelf) && shelf.state === "reviewed"))).length
  return [
    `# ${state.route === "review" ? "Review" : state.route === "write" ? "Implementation" : "Diagnosis"} report`,
    "",
    `${state.mode === "joint" ? `Two reviewers, ${state.names.A} (A) and ${state.names.B} (B)` : `One reviewer, ${state.names.A}`}; ${state.deep ? "deep" : state.route === "review" ? "quick" : "plain"}; how far: ${state.howFar}. ${isDone(state) ? "Ready to report; unresolved work is listed below." : "The run is still open."} Open substantive issues: ${openCount}.`,
    `Recorded findings: ${issues.length}; unresolved across all labels: ${unresolvedCount}. Explicit exits and clean reviewed candidates are not counted as unresolved; neither implies checked in.`,
    "",
    "## Coverage",
    "",
    renderCoverage(state),
    "",
    "## Issues, ranked by user impact",
    "",
    issueTable(state, substantive),
    "",
    "### Hardening",
    "",
    issueTable(state, others("Hardening")),
    "",
    "### telemetry-quality",
    "",
    issueTable(state, others("telemetry-quality")),
    "",
    "### Nits",
    "",
    table(["Id", "State", "Site", "Claim", "Reason"], others("Nit").map((issue) => [issue.id, issue.state, issue.facts.site, issue.facts.claim, issue.reason])),
    "",
    "## Questions",
    "",
    table(["Id", "State", "Issues", "Question", "Options", "Recommendation", "Effect", "Cost", "Answer"], questions.map((question) => [question.id, question.state, question.issues.join(", "), question.question, question.options.join(" / "), question.recommendation, question.effect, question.cost, question.answer])),
    "",
    "## Fix table",
    "",
    table(
      ["Fix", "Issues or goal", "State", "Mark", "Owner", "Contributors", "Origin", "Shape", "Sites", "Rulings", "Validation plan", "Cost", "Guardrail", "Coordination", "Shelved", "Drop reason"],
      fixes.map((fix) => [fix.id, fix.issues.join(", ") || fix.goal, isComplete(fix) ? fix.state : `direction (${fix.state})`, markText(fix.mark) || "optional", fix.owner ?? "released", fix.contributors.join(", "), fix.origin, fix.shape, fix.sites, fix.rulings, fix.test, fix.cost, fix.guardrail, fix.coordination, list(shelvesForFix(state, fix.id).map((shelf) => `${shelf.id} ${shelfState(state, shelf)}`)), fix.dropReason]),
    ),
    "",
    "## Shelved fixes",
    "",
    table(["Id", "Rev", "Fixes", "Artifact", "Baseline", "Dependencies", "Validation", "State", "Review", "Contributors", "Conditions"], shelves.map((shelf) => [shelf.id, shelf.rev, shelf.fixes.join(", "), shelf.artifact, shelf.baseline, shelf.dependencies.map((dependency) => `${dependency.id}@${dependency.rev}`).join(", "), shelf.validation, shelfState(state, shelf), markText(shelf.review), shelf.contributors.join(", "), shelf.conditions])),
    "",
    "## Check-ins",
    "",
    table(["Id", "Shelves", "Executor", "State", "Changeset", "Departures", "Approval"], checkIns.map((checkIn) => [checkIn.id, checkIn.shelves.join(", "), checkIn.executor, checkIn.state, checkIn.changeset, checkIn.departures, checkIn.approval])),
    "",
    "## Notes",
    "",
    renderNotes(state, notes),
    "",
    "## Validation",
    "",
    renderValidation(state),
    "",
    "## Timeline",
    "",
    renderTimeline(events),
    "",
  ].join("\n")
}

// ---------------------------------------------------------------------------
// Timeline: derived from the recorded moments. Who did what, who waited on whom, what was argued.

const ACTORS: readonly Actor[] = ["A", "B", "master", "reader"]

export function isActor(value: string): value is Actor {
  return (ACTORS as readonly string[]).includes(value)
}

function duration(ms: number): string {
  if (ms < 1000) return `${(ms / 1000).toFixed(1)}s`
  const seconds = Math.round(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${String(seconds % 60).padStart(2, "0")}s`
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m ${String(seconds % 60).padStart(2, "0")}s`
}

function clock(at: string): string {
  return at.slice(11, 23)
}

interface Segment {
  readonly actor: Actor
  readonly from: string
  /** Until the next change, or null when the record ends in this situation. */
  readonly ms: number | null
  readonly situation: Situation
}

/** One actor's situations in order, consecutive equal ones merged, each lasting until the next change or the record's end. */
function segments(moments: readonly Moment[], actor: Actor): Segment[] {
  const result: Segment[] = []
  const end = moments.at(-1)?.at ?? ""
  for (const moment of moments) {
    const now = moment.situations[actor]
    if (!now) continue
    const last = result.at(-1)
    if (last && last.situation.kind === now.kind && last.situation.detail === now.detail) continue
    if (last) result[result.length - 1] = { ...last, ms: Date.parse(moment.at) - Date.parse(last.from) }
    result.push({ actor, from: moment.at, ms: null, situation: now })
  }
  const last = result.at(-1)
  if (last && last.from !== end) result[result.length - 1] = { ...last, ms: Date.parse(end) - Date.parse(last.from) }
  return result
}

function eventTable(events: readonly Event[], withRow = true): string {
  const headers = withRow ? ["At", "Actor", "Command", "Row", "Note"] : ["At", "Actor", "Command", "Note"]
  return table(headers, events.map((event) => withRow ? [clock(event.at), event.actor, event.command, event.row, event.note] : [clock(event.at), event.actor, event.command, event.note]))
}

function renderSegments(all: readonly Segment[]): string {
  return table(["Actor", "From", "For", "Situation"], all.map((segment) => [segment.actor, clock(segment.from), segment.ms === null ? "open" : duration(segment.ms), `${segment.situation.kind}${segment.situation.detail ? `: ${segment.situation.detail}` : ""}`]))
}

function renderTotals(moments: readonly Moment[], actors: readonly Actor[]): string {
  const kinds = SITUATION_KINDS.filter((kind) => kind !== "done")
  return table(["Actor", ...kinds], actors.map((actor) => {
    const totals = new Map<string, number>()
    for (const segment of segments(moments, actor)) if (segment.ms !== null) totals.set(segment.situation.kind, (totals.get(segment.situation.kind) ?? 0) + segment.ms)
    return [actor, ...kinds.map((kind) => totals.has(kind) ? duration(totals.get(kind)!) : "")]
  }))
}

/**
 * The whole run: where the time went, what each agent was doing or waiting on,
 * then every event. `chosen` narrows it to one actor, or to one row: the
 * argument on that row, in order.
 */
export function renderTimeline(moments: readonly Moment[], chosen?: string): string {
  if (chosen && !isActor(chosen)) return eventTable(moments.filter((moment) => moment.row === chosen), false)
  const first = moments[0]
  const last = moments.at(-1)
  const actors = chosen && isActor(chosen) ? [chosen] : ACTORS.filter((actor) => moments.some((moment) => moment.situations[actor]))
  const events = chosen ? moments.filter((moment) => moment.actor === chosen) : moments
  const span = first && last ? `Recorded from ${first.at} to ${last.at} (${duration(Date.parse(last.at) - Date.parse(first.at))}). Situations are inferred from recorded state until the next event changes it. Working means ready work, not observed execution; these intervals do not measure unrecorded reasoning or actual task duration.` : "Nothing recorded."
  return [
    span,
    "",
    "### Where the time went",
    "",
    renderTotals(moments, actors),
    "",
    "### What each agent was doing or waiting on",
    "",
    renderSegments(actors.flatMap((actor) => segments(moments, actor)).sort((left, right) => left.from.localeCompare(right.from))),
    "",
    "### Events",
    "",
    eventTable(events),
  ].join("\n")
}
