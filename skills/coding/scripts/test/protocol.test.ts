import assert from "node:assert/strict"
import { test } from "node:test"
import fc from "fast-check"
import { currentAssessment } from "./assessment-input.ts"

import {
  initialState,
  isDone,
  freshReviews,
  isSeat,
  isSubstantive,
  ready,
  reviewBasis,
  rowById,
  rowsOf,
  situation,
  situations,
  transition,
  type Actor,
  type Command,
  type Facts,
  type HowFar,
  type Issue,
  type Mode,
  type Notification,
  type ProposedFix,
  type Seat,
  type State,
} from "../src/protocol.ts"

// ---------------------------------------------------------------------------
// Helpers

let clock = 0
function at(): string {
  clock += 1
  return new Date(Date.UTC(2026, 0, 1, 0, 0, clock)).toISOString()
}

const NAMES = { A: "opus", B: "codex", master: "master" } as const

function start(mode: Mode, howFar: HowFar = "fix", seat?: Seat): State {
  return initialState({ mode, ...(seat ? { seat } : {}), route: "review", howFar, names: NAMES, declared: [] })
}

type Step = Command extends infer C ? (C extends Command ? Omit<C, "at"> : never) : never

/** Apply a command that must succeed; return the new state. */
function ok(state: State, command: Step, expect?: (notifications: readonly Notification[]) => void): State {
  const result = transition(state, { ...currentAssessment(state, command), at: at() } as Command)
  if (!result.ok) assert.fail(`${command.type} refused: ${result.error}`)
  expect?.(result.notifications)
  return result.state
}

/** Apply a command that must be refused with a message containing `text`. */
function refused(state: State, command: Step, text: string): void {
  const result = transition(state, { ...currentAssessment(state, command), at: at() } as Command)
  assert.equal(result.ok, false, `${command.type} should be refused`)
  if (!result.ok) assert.match(result.error, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"))
}

const FULL: Facts = { claim: "off by one", site: "a.ts:12", trigger: "list of 1", cause: "<= vs <", scope: "all users", frequency: "every save", impact: "crash", rank: 1, detector: "" }

function addIssue(actor: Seat, label: Issue["label"] = "Bug", facts: Partial<Facts> = {}): Step {
  return { type: "issue.add", actor, label, certainty: 2, facts: { ...FULL, ...facts }, parents: [], clusters: [], state: "new", evidence: "", assumption: "", reason: "" }
}

function shape(overrides: Partial<ProposedFix> = {}) {
  return { goal: "", origin: "boundary ownership", shape: "assert at boundary", sites: "a.ts:12, b.ts:3", rulings: "none recorded", test: "a.test.ts", cost: "two files", guardrail: "unit test", coordination: "", ...overrides }
}

let evidenceNumber = 0
function evidence() {
  evidenceNumber += 1
  return { baseline: "base-sha + user.patch", dependencies: [], validation: `validation-${evidenceNumber}.md`, validationDigest: `digest-${evidenceNumber}` }
}

function candidateReader(state: State): { actor: "B" | "reader"; reader?: string; assessment?: string } {
  return state.mode === "joint" ? { actor: "reader", reader: "fresh-candidate-check", assessment: "assessment.md" } : { actor: "B" }
}

/** Two reviewers who have both imported an empty cold pass. */
function joint(howFar: HowFar = "fix"): State {
  let state = start("joint", howFar)
  state = ok(state, { type: "cold.import", actor: "A", rows: [] })
  state = ok(state, { type: "cold.import", actor: "B", rows: [] })
  return state
}

/** A's verified issue agreed by B and taken by A. */
function agreedIssue(state: State): State {
  state = ok(state, addIssue("A"))
  state = ok(state, { type: "issue.verify", actor: "A", id: "I-A-1", rev: 1, certainty: 4, evidence: "probe.log" })
  state = ok(state, { type: "issue.agree", actor: "B", id: "I-A-1", rev: 2 })
  return ok(state, { type: "issue.take", actor: "A", id: "I-A-1", rev: 2 })
}

// ---------------------------------------------------------------------------
// Scenarios

test("two reviewers carry an issue from cold import to a reviewed shelve and a check-in, with the script doing the talking", () => {
  let state = start("joint")
  refused(state, addIssue("A"), "import your cold pass")
  const coldA = ok(start("cold", "fix", "A"), addIssue("A"))
  state = ok(state, { type: "cold.import", actor: "A", rows: coldA.rows })
  assert.deepEqual(ready(state, "B"), [], "B sees nothing before its own import")
  state = ok(state, { type: "cold.import", actor: "B", rows: [] }, (messages) => {
    assert.deepEqual(messages, [], "B's own command shows B its ready work; no message is sent")
  })
  assert.deepEqual(ready(state, "B"), [], "the investigator carries the claim through a candidate")
  assert.equal(ready(state, "A")[0]?.command, "issue.verify")

  state = ok(state, { type: "issue.verify", actor: "A", id: "I-A-1", rev: 1, certainty: 4, evidence: "probe.log" })
  assert.deepEqual(ready(state, "A").map((item) => item.command), ["issue.take"])
  assert.deepEqual(ready(state, "B").map((item) => item.command), ["issue.take"], "a verified issue nobody is fixing is either reviewer's to take")

  state = ok(state, { type: "issue.take", actor: "A", id: "I-A-1", rev: 2 })
  assert.deepEqual(ready(state, "B"), [], "B has nothing while A writes the fix")
  refused(state, { type: "proposed-fix.add", actor: "B", issues: ["I-A-1"], ...shape() }, "take I-A-1")
  state = ok(state, { type: "proposed-fix.add", actor: "A", issues: ["I-A-1"], ...shape() })
  assert.equal(ready(state, "A")[0]?.command, "checkout.take")

  state = ok(state, { type: "checkout.take", actor: "A", purpose: "fix I-A-1" })
  refused(state, { type: "checkout.take", actor: "B", purpose: "probe" }, "held by A")
  refused(state, { type: "handoff", actor: "A" }, "release the checkout")
  refused(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-1"], artifact: "stash", ...evidence(), validation: "" }, "validation")
  state = ok(state, { type: "checkout.baseline", actor: "A", build: "build.log", test: "test.log" })
  state = ok(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-1"], artifact: "stash@0", ...evidence() }, (messages) => {
    assert.equal(messages[0]?.to, "B", "B is told a diff awaits review")
  })
  assert.equal((rowById(state, "I-A-1") as Issue).taken, null, "the shelve releases the take")
  state = ok(state, { type: "checkout.release", actor: "A", reason: "" })
  refused(state, { type: "shelved-fix.review", actor: "A", id: "S-A-1", rev: 1, conditions: "" }, "nobody marks their own work")
  state = ok(state, { type: "shelved-fix.review", ...candidateReader(state), id: "S-A-1", rev: 1, conditions: "error path swallows the failure" })
  assert.ok(ready(state, "A").some((item) => item.command === "checkout.take"), "conditions requiring code changes send the author back to the checkout")
  state = ok(state, { type: "checkout.take", actor: "A", purpose: "meet conditions" })
  state = ok(state, { type: "shelved-fix.set", actor: "A", id: "S-A-1", rev: 1, ...evidence(), artifact: "stash@1" })
  state = ok(state, { type: "checkout.release", actor: "A", reason: "" })
  state = ok(state, { type: "shelved-fix.review", ...candidateReader(state), id: "S-A-1", rev: 2, conditions: "" })
  assert.equal((rowById(state, "I-A-1") as Issue).mark?.by, "reader", "one clean review accepts the current claim and candidate together")

  assert.deepEqual(ready(state, "A"), [])
  assert.deepEqual(ready(state, "B"), [])
  state = ok(state, { type: "handoff", actor: "A" }, (messages) => {
    assert.equal(messages.length, 1)
    assert.equal(messages[0]!.to, "B")
    assert.match(messages[0]!.message, /Nothing awaits you/)
  })
  assert.equal(isDone(state), false)
  state = ok(state, { type: "handoff", actor: "B" }, (messages) => {
    assert.deepEqual(messages.map((message) => message.to), ["master"])
    assert.match(messages[0]!.message, /report/)
  })
  assert.equal(isDone(state), true)

  refused(state, { type: "check-in.approve", actor: "A", shelves: ["S-A-1"], executor: "A", approval: "go" }, "master")
  state = ok(state, { type: "check-in.approve", actor: "master", shelves: ["S-A-1"], executor: "A", approval: "user: check in S-A-1" })
  assert.equal(state.handedOff.A, false, "A is back at work: the check-in is ready for it")
  refused(state, { type: "check-in.record", actor: "B", id: "K-M-1", rev: 1, changeset: "cs 100", departures: "" }, "A performs")
  state = ok(state, { type: "check-in.record", actor: "A", id: "K-M-1", rev: 1, changeset: "cs 100", departures: "none" })
  assert.equal(rowsOf(state, "Check-in")[0]?.state, "checked in")
})

test("nobody marks their own work, and the mark belongs to a revision", () => {
  let state = joint()
  state = ok(state, addIssue("A"))
  state = ok(state, { type: "issue.verify", actor: "A", id: "I-A-1", rev: 1, certainty: 4, evidence: "probe.log" })
  refused(state, { type: "issue.agree", actor: "A", id: "I-A-1", rev: 2 }, "nobody marks their own work")
  refused(state, { type: "issue.agree", actor: "B", id: "I-A-1", rev: 1 }, "read it again")
  // B corrects the issue; now B wrote the current revision and A marks it.
  state = ok(state, { type: "issue.set", actor: "B", id: "I-A-1", rev: 2, facts: { scope: "one machine" }, labelReason: "" })
  refused(state, { type: "issue.agree", actor: "B", id: "I-A-1", rev: 3 }, "nobody marks their own work")
  state = ok(state, { type: "issue.agree", actor: "A", id: "I-A-1", rev: 3 })
  assert.equal((rowById(state, "I-A-1") as Issue).mark?.by, "A")
})

test("an edit clears the marks on that row and on the rows built on it, and nothing else", () => {
  let state = agreedIssue(joint())
  state = ok(state, addIssue("B", "Bug", { claim: "second" }))
  state = ok(state, { type: "issue.verify", actor: "B", id: "I-B-1", rev: 1, certainty: 4, evidence: "p.log" })
  state = ok(state, { type: "issue.agree", actor: "A", id: "I-B-1", rev: 2 })
  state = ok(state, { type: "proposed-fix.add", actor: "A", issues: ["I-A-1"], ...shape() })
  state = ok(state, { type: "proposed-fix.mark", actor: "B", id: "P-A-1", rev: 1 })
  state = ok(state, { type: "checkout.take", actor: "A", purpose: "fix" })
  state = ok(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-1"], artifact: "s", ...evidence() })
  state = ok(state, { type: "checkout.release", actor: "A", reason: "" })
  state = ok(state, { type: "shelved-fix.review", ...candidateReader(state), id: "S-A-1", rev: 1, conditions: "" })

  state = ok(state, { type: "issue.set", actor: "A", id: "I-A-1", rev: 2, facts: { frequency: "rare" }, labelReason: "" })
  const issue = rowById(state, "I-A-1") as Issue
  assert.equal(issue.state, "verified", "an agreed issue is never reopened by an edit")
  assert.equal(issue.mark, null)
  assert.equal((rowById(state, "P-A-1") as ProposedFix).state, "draft")
  assert.equal(rowsOf(state, "Shelved fix")[0]?.state, "shelved")
  assert.equal((rowById(state, "I-B-1") as Issue).mark?.by, "A", "the unrelated issue keeps its mark")

  refused(state, { type: "issue.set", actor: "A", id: "I-A-1", rev: 3, facts: {}, label: "Hardening", labelReason: "" }, "label_reason")
  state = ok(state, { type: "issue.set", actor: "A", id: "I-A-1", rev: 3, facts: {}, label: "Hardening", labelReason: "impact bound is per machine" })
  assert.equal((rowById(state, "I-A-1") as Issue).labelReason, "impact bound is per machine")
})

test("a contest can be settled immediately by a supported code proof", () => {
  let state = joint()
  state = ok(state, addIssue("A"))
  state = ok(state, { type: "issue.verify", actor: "A", id: "I-A-1", rev: 1, certainty: 3, evidence: "contract-proof.md" })
  refused(state, { type: "issue.contest", actor: "A", id: "I-A-1", rev: 2, probe: "walk the callers" }, "the other reviewer contests")
  state = ok(state, { type: "issue.contest", actor: "B", id: "I-A-1", rev: 2, probe: "walk every caller against the precondition" })
  assert.ok(ready(state, "A").some((item) => item.command === "issue.set"))
  assert.equal(ready(state, "B")[0]?.command, "issue.probe")
  state = ok(state, { type: "issue.probe", actor: "B", id: "I-A-1", rev: 3, verdict: "disproved", certainty: 3, evidence: "caller-proof.md" })
  assert.equal((rowById(state, "I-A-1") as Issue).state, "disproved")
  assert.deepEqual(ready(state, "A"), [])
  assert.deepEqual(ready(state, "B"), [])
})

test("repeated proposal disagreement does not manufacture a user decision; real questions block only dependent work", () => {
  let state = agreedIssue(joint())
  state = ok(state, { type: "proposed-fix.add", actor: "A", issues: ["I-A-1"], ...shape() })
  refused(state, { type: "proposed-fix.set", actor: "B", id: "P-A-1", rev: 1, shape: "other" }, "reject it with a reason")
  state = ok(state, { type: "proposed-fix.reject", actor: "B", id: "P-A-1", rev: 1, reason: "patches the symptom" })
  state = ok(state, { type: "proposed-fix.set", actor: "A", id: "P-A-1", rev: 2, shape: "move the check to the producer" })
  state = ok(state, { type: "proposed-fix.reject", actor: "B", id: "P-A-1", rev: 3, reason: "still two owners" })
  state = ok(state, { type: "proposed-fix.set", actor: "A", id: "P-A-1", rev: 4, shape: "third try" })
  assert.equal(ready(state, "A")[0]?.command, "checkout.take")
  refused(state, { type: "question.add", actor: "A", issues: ["I-A-1"], fix: "P-A-1", question: "which?", options: ["a", "a"], recommendation: "a", effect: "e", cost: "c" }, "differ")
  refused(state, { type: "question.add", actor: "A", issues: ["I-A-1"], fix: "P-A-1", question: "which?", options: ["narrow", "restructure"], recommendation: "restructure it", effect: "e", cost: "c" }, "one of the options")
  state = ok(state, { type: "question.add", actor: "A", issues: ["I-A-1"], fix: "P-A-1", question: "which shape?", options: ["narrow", "restructure"], recommendation: "restructure", effect: "e", cost: "c" }, (messages) => {
    assert.equal(messages[0]?.to, "master")
    assert.match(messages[0]!.message, /question answer Q-A-1 rev=1/)
  })
  assert.deepEqual(ready(state, "A"), [], "the issue behind a question waits")
  assert.deepEqual(ready(state, "B"), [])
  assert.equal(ready(state, "master")[0]?.command, "question.answer")
  refused(state, { type: "question.answer", actor: "A", id: "Q-A-1", rev: 1, answer: "narrow" }, "master")
  state = ok(state, { type: "question.answer", actor: "master", id: "Q-A-1", rev: 1, answer: "narrow, and file the restructure" }, (messages) => {
    assert.ok(messages.some((message) => message.to === "A" && /Q-A-1 answered: narrow/.test(message.message)), "the answer goes to the reviewer who asked")
  })
  const fix = rowById(state, "P-A-1") as ProposedFix
  assert.equal(fix.disputes, 0)
  assert.equal(fix.state, "draft")
  assert.deepEqual(ready(state, "B"), [], "the answer reopens development without requiring another proposal stamp")
})

test("preservation evidence and code proof need no invented red run or user waiver", () => {
  let state = joint()
  state = ok(state, addIssue("A", "Restructure"))
  state = ok(state, { type: "issue.take", actor: "A", id: "I-A-1", rev: 1 })
  state = ok(state, { type: "proposed-fix.add", actor: "A", issues: ["I-A-1"], ...shape({ test: "behavior passes on both versions; proof of one owner" }) })
  state = ok(state, { type: "issue.verify", actor: "A", id: "I-A-1", rev: 1, certainty: 3, evidence: "ownership-proof.md" })
  state = ok(state, { type: "checkout.take", actor: "A", purpose: "remove redundant wrapper" })
  refused(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-1"], artifact: "wrapper.patch", ...evidence(), baseline: "" }, "baseline")
  state = ok(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-1"], artifact: "wrapper.patch", ...evidence() })
  state = ok(state, { type: "checkout.release", actor: "A", reason: "" })
  state = ok(state, { type: "shelved-fix.review", ...candidateReader(state), id: "S-A-1", rev: 1, conditions: "" })
  assert.equal(rowsOf(state, "Question").length, 0)
  assert.equal(rowsOf(state, "Shelved fix")[0]?.state, "reviewed")
})

test("report only: issues and proposed fixes, no shelve, no check-in", () => {
  let state = agreedIssue(joint("report-only"))
  state = ok(state, { type: "proposed-fix.add", actor: "A", issues: ["I-A-1"], ...shape() })
  state = ok(state, { type: "proposed-fix.mark", actor: "B", id: "P-A-1", rev: 1 })
  assert.deepEqual(ready(state, "A"), [])
  assert.deepEqual(ready(state, "B"), [])
  state = ok(state, { type: "checkout.take", actor: "A", purpose: "probe" })
  refused(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-1"], artifact: "s", ...evidence() }, "report only")
  refused(state, { type: "check-in.approve", actor: "master", shelves: ["S-A-1"], executor: "A", approval: "go" }, "report only")
})

test("Hardening and telemetry findings need disposition, not implementation; Nits remain optional", () => {
  let state = joint()
  state = ok(state, addIssue("A", "Hardening"))
  state = ok(state, addIssue("A", "Nit", { claim: "name" }))
  state = ok(state, addIssue("B", "telemetry-quality", { claim: "field" }))
  assert.deepEqual(ready(state, "A").map((item) => item.row), ["I-A-1"])
  assert.deepEqual(ready(state, "B").map((item) => item.row), ["I-B-1"])
  refused(state, { type: "issue.accept", actor: "A", id: "I-A-1", rev: 1, reason: "fine" }, "only a Nit")
  state = ok(state, { type: "issue.accept", actor: "B", id: "I-A-2", rev: 1, reason: "one run of life" })
  state = ok(state, { type: "issue.exit", actor: "A", id: "I-A-1", rev: 1, exit: "todo", reference: "defer until owning boundary changes; retain impact evidence" })
  state = ok(state, { type: "issue.exit", actor: "B", id: "I-B-1", rev: 1, exit: "comment", reference: "local provider log identifies cause; no API expansion warranted" })
  state = ok(state, { type: "handoff", actor: "A" })
  state = ok(state, { type: "handoff", actor: "B" })
  assert.equal(isDone(state), true)
  // A Hardening fix, when written, is shelved and reviewed like any other.
  state = joint()
  state = ok(state, addIssue("A", "Hardening"))
  state = ok(state, { type: "issue.verify", actor: "A", id: "I-A-1", rev: 1, certainty: 4, evidence: "p.log" })
  state = ok(state, { type: "proposed-fix.add", actor: "A", issues: ["I-A-1"], ...shape({ origin: "attention-miss" }) })
  state = ok(state, { type: "checkout.take", actor: "A", purpose: "fix" })
  state = ok(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-1"], artifact: "s", ...evidence() })
  assert.equal(ready(state, "reader")[0]?.command, "shelved-fix.review")
})

test("non-gating disposition follows investigation ownership and does not block cold import", () => {
  let cold = start("cold", "fix", "A")
  cold = ok(cold, addIssue("A", "telemetry-quality"))
  assert.equal(ready(cold, "A").some((item) => item.command === "cold.import"), true)
  assert.equal(ready(cold, "A").some((item) => item.command === "issue.exit"), false)

  let state = joint("report-only")
  state = ok(state, addIssue("A", "telemetry-quality"))
  state = ok(state, { type: "issue.take", actor: "B", id: "I-A-1", rev: 1 })
  assert.deepEqual(ready(state, "A"), [])
  assert.deepEqual(ready(state, "B").map((item) => [item.command, item.row]), [["issue.exit", "I-A-1"]])
  state = ok(state, { type: "issue.release", actor: "B", id: "I-A-1", rev: 1 })
  assert.equal(ready(state, "A")[0]?.row, "I-A-1")
  state = ok(state, { type: "issue.disprove", actor: "A", id: "I-A-1", rev: 1, certainty: 4, evidence: "provider-contract.md" })
  assert.deepEqual(ready(state, "A"), [])
  assert.deepEqual(ready(state, "B"), [])
})

test("a proposed fix is complete before it is shelved; an incomplete one is reported as a direction", () => {
  let state = agreedIssue(joint())
  state = ok(state, { type: "proposed-fix.add", actor: "A", issues: ["I-A-1"], ...shape({ sites: "", rulings: "" }) })
  state = ok(state, { type: "proposed-fix.mark", actor: "B", id: "P-A-1", rev: 1 })
  state = ok(state, { type: "checkout.take", actor: "A", purpose: "fix" })
  refused(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-1"], artifact: "s", ...evidence() }, "direction, not a proposal")
  state = ok(state, { type: "proposed-fix.set", actor: "A", id: "P-A-1", rev: 2, origin: "shared ownership" })
})

test("the checkout has one holder; the master releases it only with a reason", () => {
  let state = joint()
  state = ok(state, { type: "checkout.take", actor: "B", purpose: "probe" })
  refused(state, { type: "checkout.release", actor: "A", reason: "" }, "master")
  refused(state, { type: "checkout.release", actor: "master", reason: "" }, "reason")
  refused(state, { type: "checkout.baseline", actor: "A", build: "b", test: "t" }, "holder")
  state = ok(state, { type: "checkout.release", actor: "master", reason: "user: codex pane died" })
  assert.equal(state.checkout, null)
  refused(start("cold", "fix", "A"), { type: "checkout.take", actor: "A", purpose: "probe" }, "read-only")
})

test("a stale rev is refused; a cold database belongs to its seat; the single run's seat B only reviews diffs", () => {
  let cold = start("cold", "fix", "A")
  refused(cold, addIssue("B"), "belongs to A")
  cold = ok(cold, addIssue("A"))
  refused(cold, { type: "issue.set", actor: "A", id: "I-A-1", rev: 7, facts: {}, labelReason: "" }, "read it again")
  assert.equal(ready(cold, "A")[0]?.command, "issue.verify")
  cold = ok(cold, { type: "issue.verify", actor: "A", id: "I-A-1", rev: 1, certainty: 4, evidence: "p.log" })
  assert.equal(ready(cold, "A")[0]?.command, "cold.import", "a finished cold pass imports")

  let single = start("single")
  single = ok(single, addIssue("A"))
  single = ok(single, { type: "issue.verify", actor: "A", id: "I-A-1", rev: 1, certainty: 4, evidence: "p.log" })
  assert.equal(ready(single, "A")[0]?.command, "proposed-fix.add", "no take, no mark: one reviewer")
  single = ok(single, { type: "proposed-fix.add", actor: "A", issues: ["I-A-1"], ...shape() })
  assert.equal(ready(single, "A")[0]?.command, "checkout.take", "no prior mark in a single run; the diff review covers it")
  single = ok(single, { type: "checkout.take", actor: "A", purpose: "fix" })
  single = ok(single, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-1"], artifact: "s", ...evidence() })
  single = ok(single, { type: "checkout.release", actor: "A", reason: "" })
  assert.deepEqual(ready(single, "B").map((item) => item.command), ["shelved-fix.review"])
  refused(single, { type: "handoff", actor: "A" }, "single run prints its report")
  single = ok(single, { type: "shelved-fix.review", ...candidateReader(single), id: "S-A-1", rev: 1, conditions: "" })
  assert.equal(isDone(single), true)
})

test("feature candidates carry dependency revisions, invalidate downstream only, and require an authorized dependency selection", () => {
  let state = start("single")
  for (const goal of ["save a draft", "resume a draft", "show the title"]) {
    state = ok(state, { type: "proposed-fix.add", actor: "A", issues: [], ...shape({ goal, origin: "requested user experience" }) })
  }
  state = ok(state, { type: "checkout.take", actor: "A", purpose: "feature candidates" })
  state = ok(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-1"], artifact: "save.patch", ...evidence() })
  state = ok(state, { type: "shelved-fix.review", ...candidateReader(state), id: "S-A-1", rev: 1, conditions: "" })
  assert.equal(rowsOf(state, "Shelved fix")[0]?.rev, 1, "review does not change the candidate revision")
  state = ok(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-2"], artifact: "resume.patch", ...evidence(), dependencies: [{ id: "S-A-1", rev: 1 }] })
  state = ok(state, { type: "shelved-fix.review", ...candidateReader(state), id: "S-A-2", rev: 1, conditions: "" })
  state = ok(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-3"], artifact: "title.patch", ...evidence() })
  state = ok(state, { type: "shelved-fix.review", ...candidateReader(state), id: "S-A-3", rev: 1, conditions: "" })
  refused(state, { type: "check-in.approve", actor: "master", shelves: ["S-A-2"], executor: "A", approval: "ship resume" }, "include it in the user's selection")
  state = ok(state, { type: "check-in.approve", actor: "master", shelves: ["S-A-1", "S-A-2"], executor: "A", approval: "ship save and resume" })
  const original = rowsOf(state, "Shelved fix")[0]!
  refused(state, { type: "shelved-fix.set", actor: "A", id: original.id, rev: original.rev, artifact: "save-v2.patch", validation: original.validation, validationDigest: original.validationDigest }, "refresh the validation record")
  refused(state, { type: "shelved-fix.set", actor: "A", id: original.id, rev: original.rev, ...evidence(), dependencies: [{ id: "S-A-2", rev: 1 }] }, "cycle")
  state = ok(state, { type: "shelved-fix.set", actor: "A", id: "S-A-1", rev: 1, artifact: "save-v2.patch", ...evidence() })
  assert.equal(rowsOf(state, "Shelved fix")[1]?.state, "stale")
  assert.equal(rowsOf(state, "Shelved fix")[2]?.state, "reviewed", "an unrelated candidate keeps its review")
  refused(state, { type: "shelved-fix.review", ...candidateReader(state), id: "S-A-2", rev: 1, conditions: "" }, "stale")
  refused(state, { type: "shelved-fix.request-review", actor: "A", id: "S-A-2", rev: 1, reason: "the concern was resolved" }, "stale")
  refused(state, { type: "shelved-fix.set", actor: "A", id: "S-A-2", rev: 1, ...evidence(), dependencies: [{ id: "S-A-1", rev: 1 }] }, "refresh its dependency revision")
  state = ok(state, { type: "shelved-fix.review", ...candidateReader(state), id: "S-A-1", rev: 2, conditions: "" })
  state = ok(state, { type: "shelved-fix.set", actor: "A", id: "S-A-2", rev: 1, ...evidence(), dependencies: [{ id: "S-A-1", rev: 2 }] })
  state = ok(state, { type: "shelved-fix.review", ...candidateReader(state), id: "S-A-2", rev: 2, conditions: "" })
  refused(state, { type: "check-in.record", actor: "A", id: "K-M-1", rev: 1, changeset: "cs1", departures: "none" }, "changed since the user's selection")
  state = ok(state, { type: "check-in.drop", actor: "master", id: "K-M-1", rev: 1, reason: "user selects the new candidates" })
  state = ok(state, { type: "check-in.approve", actor: "master", shelves: ["S-A-1"], executor: "A", approval: "ship save v2" })
  state = ok(state, { type: "check-in.record", actor: "A", id: "K-M-2", rev: 1, changeset: "cs2", departures: "none" })
  state = ok(state, { type: "check-in.approve", actor: "master", shelves: ["S-A-2"], executor: "A", approval: "ship resume v2" })
  assert.equal(rowsOf(state, "Check-in").at(-1)?.state, "approved", "a dependency already checked in need not be selected again")
})

test("a single-run reader returns a claim condition for the author to correct", () => {
  let state = agreedIssue(start("single"))
  state = ok(state, { type: "proposed-fix.add", actor: "A", issues: ["I-A-1"], ...shape() })
  refused(state, { type: "issue.set", actor: "B", id: "I-A-1", rev: 2, facts: { scope: "one machine" }, labelReason: "" }, "assessments only")
  state = ok(state, { type: "checkout.take", actor: "A", purpose: "candidate" })
  state = ok(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-1"], artifact: "candidate.patch", ...evidence() })
  state = ok(state, { type: "shelved-fix.review", ...candidateReader(state), id: "S-A-1", rev: 1, conditions: "evidence supports one machine only" })
  state = ok(state, { type: "issue.set", actor: "A", id: "I-A-1", rev: 2, facts: { scope: "one machine" }, labelReason: "" })
  assert.equal(rowsOf(state, "Shelved fix")[0]?.conditions, "evidence supports one machine only")
  state = ok(state, { type: "shelved-fix.review", ...candidateReader(state), id: "S-A-1", rev: 1, conditions: "" })
  assert.equal((rowById(state, "I-A-1") as Issue).mark?.by, "B")
})

test("a user can drop a feature candidate before any check-in approval, retaining evidence and reopening only dependents", () => {
  let state = start("single")
  for (const goal of ["save a draft", "resume a draft"]) state = ok(state, { type: "proposed-fix.add", actor: "A", issues: [], ...shape({ goal }) })
  state = ok(state, { type: "checkout.take", actor: "A", purpose: "feature candidates" })
  state = ok(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-1"], artifact: "save.patch", ...evidence() })
  state = ok(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-2"], artifact: "resume.patch", ...evidence(), dependencies: [{ id: "S-A-1", rev: 1 }] })
  state = ok(state, { type: "checkout.release", actor: "A", reason: "" })
  for (const id of ["S-A-1", "S-A-2"]) state = ok(state, { type: "shelved-fix.review", ...candidateReader(state), id, rev: 1, conditions: "" })
  state = ok(state, { type: "question.add", actor: "A", issues: [], fix: "P-A-1", question: "persist across sign-out?", options: ["keep", "delete"], recommendation: "delete", effect: "privacy versus resumption", cost: "storage lifecycle" })
  const validation = rowsOf(state, "Shelved fix")[0]?.validation
  refused(state, { type: "proposed-fix.drop", actor: "A", id: "P-A-1", rev: 1, reason: "I prefer another approach" }, "master")
  state = ok(state, { type: "proposed-fix.drop", actor: "master", id: "P-A-1", rev: 1, reason: "user: abandon draft persistence" })
  assert.equal(rowsOf(state, "Shelved fix")[0]?.validation, validation)
  assert.equal(rowsOf(state, "Shelved fix")[1]?.state, "stale")
  assert.equal(rowsOf(state, "Question")[0]?.state, "withdrawn")
  assert.equal(rowsOf(state, "Check-in").length, 0)
  assert.ok(ready(state, "A").some((item) => item.row === "S-A-2"), "the dependent needs a new boundary or the user's drop")
  refused(state, { type: "proposed-fix.set", actor: "A", id: "P-A-1", rev: 2, shape: "resurrect it" }, "was dropped")
  state = ok(state, { type: "proposed-fix.drop", actor: "master", id: "P-A-2", rev: 1, reason: "user: abandon resumption too" })
  assert.equal(isDone(state), true)
})

test("narrowing to report-only stops candidate revision work and later implementation resumes it", () => {
  let state = start("single")
  state = ok(state, { type: "proposed-fix.add", actor: "A", issues: [], ...shape({ goal: "restore a draft" }) })
  state = ok(state, { type: "checkout.take", actor: "A", purpose: "candidate" })
  state = ok(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-1"], artifact: "draft.patch", ...evidence() })
  state = ok(state, { type: "checkout.release", actor: "A", reason: "" })
  state = ok(state, { type: "shelved-fix.review", ...candidateReader(state), id: "S-A-1", rev: 1, conditions: "retry loses focus" })
  state = ok(state, { type: "run.set", actor: "A", howFar: "report-only", reason: "user: stop editing and report" })
  assert.deepEqual(ready(state, "A"), [])
  assert.equal(rowsOf(state, "Shelved fix")[0]?.state, "conditions")
  state = ok(state, { type: "run.set", actor: "A", howFar: "fix", reason: "user: implement the remaining correction" })
  assert.ok(ready(state, "A").some((item) => item.command === "checkout.take"))
  assert.equal(rowsOf(state, "Shelved fix")[0]?.artifact, "draft.patch")
  state = ok(state, { type: "checkout.take", actor: "A", purpose: "retry correction" })
  state = ok(state, { type: "shelved-fix.set", actor: "A", id: "S-A-1", rev: 1, ...evidence() })
  state = ok(state, { type: "checkout.release", actor: "A", reason: "" })
  state = ok(state, { type: "shelved-fix.review", ...candidateReader(state), id: "S-A-1", rev: 2, conditions: "" })
  state = ok(state, { type: "check-in.approve", actor: "master", shelves: ["S-A-1"], executor: "A", approval: "user: check in the correction" })
  state = ok(state, { type: "run.set", actor: "A", howFar: "report-only", reason: "user: pause the check-in and report" })
  assert.deepEqual(ready(state, "A"), [])
  refused(state, { type: "check-in.record", actor: "A", id: "K-M-1", rev: 1, changeset: "cs1", departures: "none" }, "narrowed scope")
  assert.equal(rowsOf(state, "Check-in")[0]?.state, "approved", "the paused selection stays in the record")
  state = ok(state, { type: "run.set", actor: "A", howFar: "check-in", reason: "user: resume that check-in" })
  assert.equal(ready(state, "A")[0]?.command, "check-in.record")
})

test("a feature question blocks its dependent candidates while unrelated work stays ready", () => {
  let state = start("single")
  for (const goal of ["save a draft", "resume a draft", "show a title"]) {
    state = ok(state, { type: "proposed-fix.add", actor: "A", issues: [], ...shape({ goal }) })
  }
  state = ok(state, { type: "checkout.take", actor: "A", purpose: "feature candidates" })
  state = ok(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-1"], artifact: "save.patch", ...evidence() })
  state = ok(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-2"], artifact: "resume.patch", ...evidence(), dependencies: [{ id: "S-A-1", rev: 1 }] })
  state = ok(state, { type: "question.add", actor: "A", issues: [], fix: "P-A-1", question: "should drafts persist after sign-out?", options: ["keep", "delete"], recommendation: "delete", effect: "privacy versus convenient resumption", cost: "storage lifecycle" })
  assert.deepEqual(ready(state, "B"), [], "both the questioned candidate and its dependent wait")
  assert.ok(ready(state, "A").some((item) => item.row === "P-A-3"), "unrelated title work remains ready")
  refused(state, { type: "shelved-fix.review", ...candidateReader(state), id: "S-A-2", rev: 1, conditions: "" }, "waits for the user's answer")
  refused(state, { type: "shelved-fix.set", actor: "A", id: "S-A-2", rev: 1, ...evidence(), dependencies: [{ id: "S-A-1", rev: 1 }] }, "waits for the user's answer")
  state = ok(state, { type: "question.answer", actor: "master", id: "Q-A-1", rev: 1, answer: "delete at sign-out" })
  assert.equal(rowsOf(state, "Shelved fix")[0]?.state, "shelved")
  assert.equal(rowsOf(state, "Shelved fix")[1]?.state, "shelved")
})

/** An issue candidate, two transitive dependents, and an unrelated feature. */
function reviewedChain(): State {
  let state = agreedIssue(start("single"))
  for (const [index, goal] of ["fix the boundary", "resume a draft", "preview a draft", "show a title"].entries()) {
    state = ok(state, { type: "proposed-fix.add", actor: "A", issues: index === 0 ? ["I-A-1"] : [], ...shape({ goal }) })
  }
  state = ok(state, { type: "checkout.take", actor: "A", purpose: "candidate chain" })
  for (let index = 1; index <= 4; index += 1) {
    state = ok(state, { type: "shelved-fix.add", actor: "A", fixes: [`P-A-${index}`], artifact: `candidate-${index}.patch`, ...evidence(), dependencies: index === 2 || index === 3 ? [{ id: `S-A-${index - 1}`, rev: 1 }] : [] })
    state = ok(state, { type: "shelved-fix.review", ...candidateReader(state), id: `S-A-${index}`, rev: 1, conditions: "" })
  }
  return ok(state, { type: "checkout.release", actor: "A", reason: "" })
}

test("claim, proposal, and ruling changes reopen reviews without changing candidate evidence", () => {
  for (const change of ["claim", "proposal", "issue ruling", "proposal ruling"] as const) {
    let state = reviewedChain()
    const before = rowsOf(state, "Shelved fix")
    if (change === "claim") {
      state = ok(state, { type: "issue.set", actor: "A", id: "I-A-1", rev: 2, facts: { claim: "the final item exceeds the bound" }, labelReason: "" })
    } else if (change === "proposal") {
      state = ok(state, { type: "proposed-fix.set", actor: "A", id: "P-A-1", rev: 1, cost: "one comparison, existing test seam" })
    } else {
      state = ok(state, { type: "question.add", actor: "A", issues: change === "issue ruling" ? ["I-A-1"] : [], fix: change === "proposal ruling" ? "P-A-1" : "", question: "is the final item included?", options: ["include", "exclude"], recommendation: "include", effect: "visible item count", cost: "boundary contract" })
      state = ok(state, { type: "question.answer", actor: "master", id: "Q-A-1", rev: 1, answer: "include" })
    }
    const after = rowsOf(state, "Shelved fix")
    for (let index = 0; index < 3; index += 1) {
      assert.equal(after[index]?.state, "shelved", change)
      assert.equal(after[index]?.review, null, change)
      assert.deepEqual(after[index], { ...before[index], state: "shelved", review: null, updated: after[index]!.updated }, "only the dependent review changes")
    }
    assert.deepEqual(after[3], before[3], "unrelated candidate stays reviewed")
    assert.deepEqual(ready(state, "A"), [], "no author reshelving or validation rewrite is required")
    assert.deepEqual(ready(state, "B").map((item) => item.row), ["S-A-1", "S-A-2", "S-A-3"])
    refused(state, { type: "check-in.approve", actor: "master", shelves: ["S-A-1", "S-A-2", "S-A-3"], executor: "A", approval: "ship these" }, "only a reviewed shelve")
    for (let index = 1; index <= 3; index += 1) state = ok(state, { type: "shelved-fix.review", ...candidateReader(state), id: `S-A-${index}`, rev: 1, conditions: "" })
    assert.deepEqual(rowsOf(state, "Shelved fix").map((shelf) => shelf.validationDigest), before.map((shelf) => shelf.validationDigest))
    state = ok(state, { type: "check-in.approve", actor: "master", shelves: ["S-A-1", "S-A-2", "S-A-3"], executor: "A", approval: "ship these" })
    state = ok(state, { type: "check-in.record", actor: "A", id: "K-M-1", rev: 1, changeset: "cs1", departures: "none" })
  }
})

test("review-only invalidation cannot erase outstanding conditions or stale dependencies", () => {
  let state = reviewedChain()
  state = ok(state, { type: "proposed-fix.set", actor: "A", id: "P-A-1", rev: 1, cost: "one comparison" })
  state = ok(state, { type: "shelved-fix.review", ...candidateReader(state), id: "S-A-1", rev: 1, conditions: "the empty input still fails" })
  state = ok(state, { type: "issue.set", actor: "A", id: "I-A-1", rev: 2, facts: { frequency: "on each empty input" }, labelReason: "" })
  assert.equal(rowsOf(state, "Shelved fix")[0]?.state, "conditions")
  assert.equal(rowsOf(state, "Shelved fix")[0]?.conditions, "the empty input still fails")
  state = ok(state, { type: "checkout.take", actor: "A", purpose: "fix the empty input" })
  state = ok(state, { type: "shelved-fix.set", actor: "A", id: "S-A-1", rev: 1, artifact: "empty-fixed.patch", ...evidence() })
  const stale = rowsOf(state, "Shelved fix").slice(1, 3)
  assert.ok(stale.every((shelf) => shelf.state === "stale"))
  state = ok(state, { type: "proposed-fix.set", actor: "A", id: "P-A-1", rev: 2, cost: "one comparison plus empty-input check" })
  assert.deepEqual(rowsOf(state, "Shelved fix").slice(1, 3).map((shelf) => ({ ...shelf, updated: "" })), stale.map((shelf) => ({ ...shelf, updated: "" })))
  refused(state, { type: "shelved-fix.review", ...candidateReader(state), id: "S-A-2", rev: 1, conditions: "" }, "stale")
})

test("resolved conditions can be independently re-reviewed without revising candidates or their dependents", () => {
  let state = reviewedChain()
  state = ok(state, { type: "proposed-fix.set", actor: "A", id: "P-A-1", rev: 1, cost: "one comparison" })
  state = ok(state, { type: "shelved-fix.review", ...candidateReader(state), id: "S-A-1", rev: 1, conditions: "the user must decide whether to include the final item" })
  const before = rowsOf(state, "Shelved fix")
  state = ok(state, { type: "question.add", actor: "A", issues: [], fix: "P-A-1", question: "include the final item?", options: ["include", "exclude"], recommendation: "include", effect: "visible item count", cost: "boundary contract" })
  refused(state, { type: "shelved-fix.review", ...candidateReader(state), id: "S-A-1", rev: 1, conditions: "" }, "waits for the user's answer")
  state = ok(state, { type: "question.answer", actor: "master", id: "Q-A-1", rev: 1, answer: "include; the saved candidate already does this" })
  assert.equal(rowsOf(state, "Shelved fix")[0]?.state, "conditions", "a ruling does not automatically clear review conditions")
  state = ok(state, { type: "shelved-fix.review", ...candidateReader(state), id: "S-A-1", rev: 1, conditions: "" })
  const after = rowsOf(state, "Shelved fix")
  assert.deepEqual(after[0], { ...before[0], state: "reviewed", conditions: "", review: after[0]!.review, updated: after[0]!.updated })
  for (let index = 1; index < 4; index += 1) assert.deepEqual(after[index], { ...before[index], updated: after[index]!.updated }, "review resolution does not stale dependent validation")
  for (const id of ["S-A-2", "S-A-3"]) state = ok(state, { type: "shelved-fix.review", ...candidateReader(state), id, rev: 1, conditions: "" })
  assert.deepEqual(ready(state, "A"), [], "no checkout or reshelving is needed")
})

test("a reviewer can replace or retract conditions without scheduling repeated reviews", () => {
  for (const mode of ["single", "joint"] as const) {
    let state = mode === "single" ? start("single") : joint()
    state = ok(state, { type: "proposed-fix.add", actor: "A", issues: [], ...shape({ goal: "save the draft" }) })
    state = ok(state, { type: "checkout.take", actor: "A", purpose: "candidate" })
    state = ok(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-1"], artifact: "draft.patch", ...evidence() })
    state = ok(state, { type: "checkout.release", actor: "A", reason: "" })
    const before = rowsOf(state, "Shelved fix")[0]!
    state = ok(state, { type: "shelved-fix.review", ...candidateReader(state), id: before.id, rev: 1, conditions: "check persistence and focus" })
    assert.deepEqual(ready(state, "B"), [], "an unresolved condition must not keep its reviewer busy")
    if (mode === "joint") state = ok(state, { type: "handoff", actor: "B" })
    refused(state, { type: "shelved-fix.review", actor: "A", id: before.id, rev: 1, conditions: "" }, "nobody marks their own work")
    refused(state, { type: "shelved-fix.review", ...candidateReader(state), id: before.id, rev: 2, conditions: "" }, "read it again")
    state = ok(state, { type: "shelved-fix.review", ...candidateReader(state), id: before.id, rev: 1, conditions: "the code walk settles persistence; focus remains to check" })
    assert.match(rowsOf(state, "Shelved fix")[0]!.conditions, /focus remains/)
    assert.deepEqual(ready(state, "B"), [])
    state = ok(state, { type: "run.set", actor: mode === "single" ? "A" : "master", howFar: "report-only", reason: "user: report without further code changes" })
    state = ok(state, { type: "shelved-fix.review", ...candidateReader(state), id: before.id, rev: 1, conditions: "" })
    const after = rowsOf(state, "Shelved fix")[0]!
    assert.deepEqual(after, { ...before, state: "reviewed", review: after.review, updated: after.updated })
  }
})

test("an author requests an independent re-review while retaining conditions and candidate inputs", () => {
  let state = joint()
  state = ok(state, { type: "proposed-fix.add", actor: "A", issues: [], ...shape({ goal: "save the draft" }) })
  state = ok(state, { type: "checkout.take", actor: "A", purpose: "candidate" })
  state = ok(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-1"], artifact: "draft.patch", ...evidence() })
  state = ok(state, { type: "checkout.release", actor: "A", reason: "" })
  state = ok(state, { type: "shelved-fix.review", ...candidateReader(state), id: "S-A-1", rev: 1, conditions: "confirm the persistence contract" })
  state = ok(state, { type: "handoff", actor: "B" })
  const before = rowsOf(state, "Shelved fix")[0]!
  assert.ok(ready(state, "A").some((item) => item.command === "shelved-fix.request-review"))
  refused(state, { type: "shelved-fix.request-review", actor: "B", id: before.id, rev: 1, reason: "checked" }, "owner")
  refused(state, { type: "shelved-fix.request-review", actor: "A", id: before.id, rev: 2, reason: "checked" }, "read it again")
  refused(state, { type: "shelved-fix.request-review", actor: "A", id: before.id, rev: 1, reason: "" }, "reason")
  state = ok(state, { type: "shelved-fix.request-review", actor: "A", id: before.id, rev: 1, reason: "provider contract and retained code walk settle persistence; candidate inputs unchanged" }, (messages) => {
    assert.ok(messages.some((message) => message.to === "B" && /fresh assessments for you to arrange/.test(message.message)), "the arranger is notified")
  })
  assert.deepEqual(rowsOf(state, "Shelved fix")[0], { ...before, state: "shelved", updated: rowsOf(state, "Shelved fix")[0]!.updated })
  assert.deepEqual(ready(state, "A"), [], "the author can wait without a checkout hold")
  assert.ok(ready(state, "reader").some((item) => item.command === "shelved-fix.review"))
  refused(state, { type: "shelved-fix.request-review", actor: "A", id: before.id, rev: 1, reason: "checked again" }, "is shelved")
  state = ok(state, { type: "handoff", actor: "A" })
  refused(state, { type: "check-in.approve", actor: "master", shelves: [before.id], executor: "A", approval: "ship" }, "only a reviewed shelve")
  state = ok(state, { type: "shelved-fix.review", ...candidateReader(state), id: before.id, rev: 1, conditions: "" })
  assert.equal(rowsOf(state, "Shelved fix")[0]?.conditions, "")
})

test("re-review requires a complete current proposal without forcing a new candidate", () => {
  let state = reviewedChain()
  const before = rowsOf(state, "Shelved fix")[0]!
  state = ok(state, { type: "proposed-fix.set", actor: "A", id: "P-A-1", rev: 1, rulings: "" })
  refused(state, { type: "shelved-fix.review", ...candidateReader(state), id: "S-A-1", rev: 1, conditions: "" }, "needs origin, shape, sites, rulings, test, and cost")
  assert.equal(rowsOf(state, "Shelved fix")[0]?.state, "shelved")
  state = ok(state, { type: "proposed-fix.set", actor: "A", id: "P-A-1", rev: 2, rulings: "user: include the final item" })
  state = ok(state, { type: "shelved-fix.review", ...candidateReader(state), id: "S-A-1", rev: 1, conditions: "" })
  assert.equal(rowsOf(state, "Shelved fix")[0]?.rev, before.rev)
  assert.equal(rowsOf(state, "Shelved fix")[0]?.validationDigest, before.validationDigest)
})

test("an answered ruling cannot reuse a previously approved candidate review", () => {
  let state = reviewedChain()
  state = ok(state, { type: "check-in.approve", actor: "master", shelves: ["S-A-1", "S-A-2", "S-A-3"], executor: "A", approval: "ship these" })
  state = ok(state, { type: "question.add", actor: "A", issues: [], fix: "P-A-1", question: "is the final item included?", options: ["include", "exclude"], recommendation: "include", effect: "visible item count", cost: "boundary contract" })
  state = ok(state, { type: "question.answer", actor: "master", id: "Q-A-1", rev: 1, answer: "exclude" })
  refused(state, { type: "check-in.record", actor: "A", id: "K-M-1", rev: 1, changeset: "cs1", departures: "none" }, "only a reviewed shelve")
  assert.equal(rowsOf(state, "Shelved fix")[0]?.state, "shelved", "review the ruling without manufacturing validation content")
})

test("a dismissed hypothesis preserves its candidate record without scheduling a meaningless fix", () => {
  let state = agreedIssue(joint())
  state = ok(state, { type: "proposed-fix.add", actor: "A", issues: ["I-A-1"], ...shape() })
  state = ok(state, { type: "checkout.take", actor: "A", purpose: "experiment" })
  state = ok(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-1"], artifact: "hypothesis.patch", ...evidence() })
  state = ok(state, { type: "issue.disprove", actor: "A", id: "I-A-1", rev: 2, certainty: 3, evidence: "caller-proof.md" })
  state = ok(state, { type: "checkout.release", actor: "A", reason: "" })
  assert.deepEqual(ready(state, "A"), [])
  assert.deepEqual(ready(state, "B"), [])
  assert.equal(rowsOf(state, "Shelved fix")[0]?.artifact, "hypothesis.patch")
  refused(state, { type: "check-in.approve", actor: "master", shelves: ["S-A-1"], executor: "A", approval: "ship it" }, "no longer answers an active issue")
})

// ---------------------------------------------------------------------------
// Property: random traces that mostly follow ready work never break the rules
// and never stall with work the workflow should have advanced.

function concrete(state: State, actor: Actor, item: { command: string; row: string }, pick: number): Step | null {
  const id = item.row
  const row = id ? rowById(state, id) : undefined
  const revOf = row?.rev ?? 0
  switch (item.command) {
    case "issue.verify":
      return pick % 3 === 0
        ? { type: "issue.assume", actor, id, rev: revOf, certainty: 3, assumption: "a", reason: "no probe in fifteen minutes" }
        : { type: "issue.verify", actor, id, rev: revOf, certainty: 4, evidence: "p.log" }
    case "issue.agree":
      switch (pick % 5) {
        case 0: return { type: "issue.contest", actor, id, rev: revOf, probe: "run it" }
        case 1: return { type: "issue.disprove", actor, id, rev: revOf, certainty: 3, evidence: "line 4 guards it" }
        case 2: return { type: "issue.set", actor, id, rev: revOf, facts: { scope: "corrected" }, labelReason: "" }
        default: return (row as Issue).state === "new" ? { type: "issue.verify", actor, id, rev: revOf, certainty: 4, evidence: "p.log" } : { type: "issue.agree", actor, id, rev: revOf }
      }
    case "issue.set":
      return pick % 2 === 0
        ? { type: "issue.set", actor, id, rev: revOf, facts: { cause: "answered" }, labelReason: "" }
        : { type: "issue.verify", actor, id, rev: revOf, certainty: 5, evidence: "p.log" }
    case "issue.probe":
      return { type: "issue.probe", actor, id, rev: revOf, verdict: pick % 2 === 0 ? "verified" : "disproved", certainty: 4, evidence: "probe.log" }
    case "issue.take": return { type: "issue.take", actor, id, rev: revOf }
    case "proposed-fix.add":
      return { type: "proposed-fix.add", actor, issues: [id], ...shape(pick % 4 === 0 ? { origin: "attention-miss" } : {}) }
    case "proposed-fix.set": return { type: "proposed-fix.set", actor, id, rev: revOf, shape: `shape ${pick}` }
    case "proposed-fix.mark":
      return pick % 3 === 0 ? { type: "proposed-fix.reject", actor, id, rev: revOf, reason: "no" } : { type: "proposed-fix.mark", actor, id, rev: revOf }
    case "question.add":
      return { type: "question.add", actor, issues: (row as ProposedFix).issues, fix: id, question: "which?", options: ["a", "b"], recommendation: "a", effect: "e", cost: "c" }
    case "question.answer": return { type: "question.answer", actor, id, rev: revOf, answer: "a" }
    case "checkout.take": return { type: "checkout.take", actor, purpose: "work" }
    case "checkout.baseline": return { type: "checkout.baseline", actor, build: "b.log", test: "t.log" }
    case "checkout.release": return { type: "checkout.release", actor, reason: "" }
    case "shelved-fix.add": return { type: "shelved-fix.add", actor, fixes: [id], artifact: "s", ...evidence() }
    case "shelved-fix.set": return { type: "shelved-fix.set", actor, id, rev: revOf, ...evidence(), artifact: `s${pick}` }
    case "shelved-fix.request-review": return { type: "shelved-fix.request-review", actor, id, rev: revOf, reason: "the retained code walk resolves the concern without candidate changes" }
    case "shelved-fix.review":
      return { type: "shelved-fix.review", actor, id, rev: revOf, conditions: pick % 3 === 0 ? "fix the error path" : "", ...(actor === "reader" ? { reader: "property-reader", assessment: "assessment.md" } : {}) }
    case "check-in.record": return { type: "check-in.record", actor, id, rev: revOf, changeset: "cs", departures: "none" }
    default: return null
  }
}

function invariants(state: State): void {
  for (const row of state.rows) {
    if ("mark" in row && row.mark) assert.notEqual(row.mark.by, row.editor, `${row.id} marked by its editor`)
    if (row.kind === "Shelved fix" && row.review) assert.notEqual(row.review.by, row.author, `${row.id} reviewed by its author`)
    if (row.kind === "Issue" && row.state === "verified") assert.ok(row.certainty >= 3 && row.evidence, `${row.id} verified without supported evidence`)
    if (row.kind === "Shelved fix") assert.ok(row.baseline && row.validation && row.validationDigest, `${row.id} has no candidate context or validation`)
  }
  if (!isDone(state)) return
  for (const issue of rowsOf(state, "Issue")) {
    if (!isSubstantive(issue) || issue.exit || ["disproved", "duplicate", "accepted"].includes(issue.state)) continue
    if (rowsOf(state, "Question").some((question) => question.state === "open" && question.issues.includes(issue.id))) continue
    assert.ok(issue.state === "verified" || issue.state === "assumed", `done with ${issue.id} still ${issue.state}`)
    assert.ok(issue.mark, `done with ${issue.id} unmarked`)
    const fixes = rowsOf(state, "Proposed fix").filter((fix) => fix.issues.includes(issue.id))
    assert.ok(fixes.length > 0, `done with ${issue.id} agreed but no proposed fix`)
    if (state.howFar === "report-only") continue
    const shelves = rowsOf(state, "Shelved fix").filter((shelf) => shelf.fixes.some((fixId) => fixes.some((fix) => fix.id === fixId)))
    assert.ok(shelves.some((shelf) => shelf.state === "reviewed"), `done with ${issue.id} fixed but not reviewed`)
  }
}

test("the record says what each agent was doing or waiting on, and what was argued on each row", () => {
  let state = start("joint")
  assert.deepEqual(situations(state), { A: { kind: "cold pass", detail: "" }, B: { kind: "cold pass", detail: "" }, master: { kind: "idle", detail: "waiting on the reviewers" } })
  state = joint()
  assert.equal(situation(state, "A").kind, "no handoff", "nothing ready and no handoff is on the record, not hidden as idle")

  // The argument on a row: every event note carries the substance of what was said.
  const notes: string[] = []
  const say = (command: Step) => {
    const result = transition(state, { ...currentAssessment(state, command), at: at() } as Command)
    if (!result.ok) assert.fail(`${command.type} refused: ${result.error}`)
    notes.push(...result.events.map((event) => event.note))
    state = result.state
  }
  say(addIssue("A"))
  say({ type: "issue.verify", actor: "A", id: "I-A-1", rev: 1, certainty: 4, evidence: "p.log" })
  say({ type: "issue.contest", actor: "B", id: "I-A-1", rev: 2, probe: "run with n=1" })
  say({ type: "issue.set", actor: "A", id: "I-A-1", rev: 3, facts: { trigger: "n=1 and n=0" }, labelReason: "" })
  say({ type: "issue.verify", actor: "A", id: "I-A-1", rev: 4, certainty: 4, evidence: "p.log" })
  say({ type: "issue.contest", actor: "B", id: "I-A-1", rev: 5, probe: "run with n=0" })
  say({ type: "issue.probe", actor: "B", id: "I-A-1", rev: 6, verdict: "disproved", certainty: 4, evidence: "probe2.log" })
  assert.deepEqual(notes, [
    "Bug new: off by one (a.ts:12)",
    "verified at step 4: evidence p.log",
    "contested by B: run with n=1",
    "answered the contest with an edit: trigger=n=1 and n=0; marks cleared",
    "verified at step 4: evidence p.log",
    "contested by B: run with n=0",
    "check settled: disproved at step 4, evidence probe2.log",
  ])

  // Who waits on whom: B wants the checkout A holds; A waits on the user; the master carries the question.
  state = agreedIssue(joint())
  state = ok(state, { type: "checkout.take", actor: "A", purpose: "probe I-A-1" })
  state = ok(state, addIssue("B", "Bug", { claim: "second", site: "b.ts:1" }))
  state = ok(state, { type: "issue.verify", actor: "B", id: "I-B-1", rev: 1, certainty: 4, evidence: "p.log" })
  state = ok(state, { type: "issue.agree", actor: "A", id: "I-B-1", rev: 2 })
  state = ok(state, { type: "issue.take", actor: "B", id: "I-B-1", rev: 2 })
  state = ok(state, { type: "proposed-fix.add", actor: "B", issues: ["I-B-1"], ...shape({ origin: "attention-miss" }) })
  assert.deepEqual(situation(state, "A"), { kind: "checkout", detail: "probe I-A-1" })
  assert.deepEqual(situation(state, "B"), { kind: "waiting on checkout", detail: "held by A: probe I-A-1" }, "B's approved fix waits on the checkout A holds")
  state = ok(state, { type: "issue.release", actor: "A", id: "I-A-1", rev: 2 })
  assert.deepEqual(situation(state, "B"), { kind: "working", detail: "I-A-1; fixing I-B-1" }, "an issue nobody is fixing is work for B, checkout or not")
  state = ok(state, { type: "issue.take", actor: "B", id: "I-A-1", rev: 2 })
  state = ok(state, { type: "proposed-fix.add", actor: "B", issues: ["I-A-1"], ...shape({ origin: "attention-miss" }) })
  assert.equal(situation(state, "B").kind, "waiting on checkout")
  state = ok(state, { type: "checkout.release", actor: "A", reason: "" })
  assert.equal(situation(state, "B").kind, "working")
  state = ok(state, { type: "question.add", actor: "B", issues: ["I-A-1", "I-B-1"], fix: "", question: "which shape?", options: ["a", "b"], recommendation: "a", effect: "none", cost: "none" })
  assert.deepEqual(situation(state, "master"), { kind: "waiting on user", detail: "Q-B-1" })
  assert.equal(situation(state, "B").kind, "no handoff")
  state = ok(state, { type: "handoff", actor: "B" })
  assert.deepEqual(situation(state, "B"), { kind: "idle", detail: "handed off; waiting on A" })
  state = ok(state, { type: "handoff", actor: "A" })
  assert.deepEqual(situation(state, "A"), { kind: "waiting on user", detail: "Q-B-1" })
  assert.deepEqual(situation(state, "B"), { kind: "waiting on user", detail: "Q-B-1" })
  state = ok(state, { type: "question.answer", actor: "master", id: "Q-B-1", rev: 1, answer: "a" })
  assert.equal(situation(state, "B").kind, "working", "the answer puts B back to work")
})

test("cooperative takeover retains the existing candidate and disqualifies every contributor from reviewing it", () => {
  let state = agreedIssue(joint())
  state = ok(state, { type: "proposed-fix.add", actor: "A", issues: ["I-A-1"], ...shape() })
  state = ok(state, { type: "checkout.take", actor: "A", purpose: "initial candidate" })
  state = ok(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-1"], artifact: "initial.patch", ...evidence() })
  refused(state, { type: "proposed-fix.release", actor: "A", id: "P-A-1", rev: 1 }, "release the checkout")
  refused(state, { type: "proposed-fix.release", actor: "B", id: "P-A-1", rev: 1 }, "only its owner")
  refused(state, { type: "proposed-fix.take", actor: "B", id: "P-A-1", rev: 1 }, "owned by A")
  state = ok(state, { type: "checkout.release", actor: "A", reason: "" })
  state = ok(state, { type: "shelved-fix.review", ...candidateReader(state), id: "S-A-1", rev: 1, conditions: "" })
  const saved = rowsOf(state, "Shelved fix")[0]!
  const proposal = rowsOf(state, "Proposed fix")[0]!
  state = ok(state, { type: "proposed-fix.release", actor: "A", id: proposal.id, rev: proposal.rev })
  assert.ok(ready(state, "B").some((item) => item.command === "proposed-fix.take"))
  state = ok(state, { type: "proposed-fix.take", actor: "B", id: proposal.id, rev: proposal.rev })
  assert.deepEqual(rowsOf(state, "Shelved fix")[0], saved, "ownership changes no candidate, review, revision, or evidence")
  const transferred = rowsOf(state, "Proposed fix")[0]!
  assert.deepEqual(transferred, { ...proposal, owner: "B", updated: transferred.updated })
  assert.equal(rowsOf(state, "Issue")[0]?.taken, "B")
  refused(state, { type: "proposed-fix.set", actor: "A", id: proposal.id, rev: proposal.rev, shape: "old owner edit" }, "owned by B")
  state = ok(state, { type: "proposed-fix.set", actor: "B", id: proposal.id, rev: proposal.rev, shape: "include the empty-input case" })
  for (const actor of ["A", "B"] as const) refused(state, { type: "proposed-fix.mark", actor, id: proposal.id, rev: proposal.rev + 1 }, "own work")
  assert.ok(ready(state, "reader").some((item) => item.row === saved.id), "a proposal with both authors can be checked with the unchanged candidate")
  state = ok(state, { type: "checkout.take", actor: "B", purpose: "continue saved candidate" })
  state = ok(state, { type: "shelved-fix.set", actor: "B", id: saved.id, rev: saved.rev, artifact: "continued.patch", ...evidence() })
  state = ok(state, { type: "checkout.release", actor: "B", reason: "" })
  assert.deepEqual(rowsOf(state, "Shelved fix")[0]?.contributors, ["A", "B"])
  assert.equal(rowsOf(state, "Shelved fix")[0]?.author, "A")
  assert.equal(rowsOf(state, "Shelved fix")[0]?.editor, "B")
  for (const actor of ["A", "B"] as const) {
    refused(state, { type: "shelved-fix.review", actor, id: saved.id, rev: 2, conditions: "" }, "own work")
    assert.ok(!ready(state, actor).some((item) => item.command === "shelved-fix.review"))
  }
  assert.equal(isDone(state), false)
  refused(state, { type: "shelved-fix.review", actor: "reader", id: saved.id, rev: 2, conditions: "" }, "fresh non-author context")
  refused(state, { type: "shelved-fix.review", actor: "reader", id: saved.id, rev: 2, conditions: "", reader: NAMES.A, assessment: "review.md" }, "different context")
  refused(state, { type: "shelved-fix.review", actor: "reader", id: saved.id, rev: 2, conditions: "", reader: "fresh-17" }, "assessment")
  refused(state, { type: "checkout.take", actor: "reader", purpose: "edit" }, "assessments only")
  refused(state, { type: "proposed-fix.set", actor: "reader", id: proposal.id, rev: 2, shape: "edit" }, "assessments only")
  const assessment = { reader: "fresh-17", assessment: "review.md" }
  state = ok(state, { type: "shelved-fix.review", actor: "reader", id: saved.id, rev: 2, conditions: "confirm restored empty input", ...assessment })
  refused(state, { type: "shelved-fix.request-review", actor: "A", id: saved.id, rev: 2, reason: "checked" }, "owner")
  state = ok(state, { type: "shelved-fix.request-review", actor: "B", id: saved.id, rev: 2, reason: "retained check covers it" })
  state = ok(state, { type: "shelved-fix.review", actor: "reader", id: saved.id, rev: 2, conditions: "", ...assessment })
  assert.deepEqual(rowsOf(state, "Shelved fix")[0]?.review, { by: "reader", at: rowsOf(state, "Shelved fix")[0]?.updated, ...assessment })
  assert.equal(rowsOf(state, "Proposed fix")[0]?.mark?.by, "reader")
  assert.deepEqual(ready(state, "reader"), [])
})

test("release follows the donor, not the author, and handoff keeps successor work live", () => {
  let state = joint()
  state = ok(state, { type: "proposed-fix.add", actor: "B", issues: [], ...shape({ goal: "retain drafts" }) })
  state = ok(state, { type: "checkout.take", actor: "B", purpose: "initial candidate" })
  state = ok(state, { type: "shelved-fix.add", actor: "B", fixes: ["P-B-1"], artifact: "retained.patch", ...evidence() })
  state = ok(state, { type: "checkout.release", actor: "B", reason: "" })
  state = ok(state, { type: "proposed-fix.release", actor: "B", id: "P-B-1", rev: 1 })
  state = ok(state, { type: "proposed-fix.take", actor: "A", id: "P-B-1", rev: 1 })
  const shelf = rowsOf(state, "Shelved fix")[0]!
  const basis = reviewBasis(state, shelf.id)
  const arranger = freshReviews(state)
  state = ok(state, { type: "handoff", actor: "B" })
  state = ok(state, { type: "proposed-fix.release", actor: "A", id: "P-B-1", rev: 1 }, messages => {
    assert.ok(messages.some(message => message.to === "B" && /ready for you: P-B-1/.test(message.message)))
  })
  assert.equal(rowsOf(state, "Proposed fix")[0]?.releasedBy, "A")
  assert.equal(state.handedOff.B, false, "an idle successor is put back to work")
  assert.deepEqual(ready(state, "A"), [])
  assert.equal(ready(state, "B")[0]?.command, "proposed-fix.take")
  assert.equal(reviewBasis(state, shelf.id), basis)
  state = ok(state, { type: "handoff", actor: "A" })
  refused(state, { type: "handoff", actor: "B" }, "ready work remains")
  assert.equal(isDone(state), false)
  assert.equal(situation(state, "A").kind, "idle")
  state = ok(state, { type: "proposed-fix.take", actor: "B", id: "P-B-1", rev: 1 })
  assert.equal(state.handedOff.A, true)
  assert.deepEqual(rowsOf(state, "Shelved fix")[0], shelf)
  assert.equal(reviewBasis(state, shelf.id), basis)
  assert.deepEqual(freshReviews(state), arranger)
  assert.equal(rowsOf(state, "Proposed fix")[0]?.releasedBy, undefined)
})

test("release does not hide a donor-only pickup or unrelated obligation, and explicit reclaim works", () => {
  let state = agreedIssue(joint())
  state = ok(state, { type: "proposed-fix.add", actor: "A", issues: ["I-A-1"], ...shape() })
  state = ok(state, { type: "proposed-fix.release", actor: "A", id: "P-A-1", rev: 1 })
  state = ok(state, { type: "issue.take", actor: "A", id: "I-A-1", rev: 2 })
  assert.equal(ready(state, "A")[0]?.command, "proposed-fix.take", "the peer cannot take an issue held by the donor")
  refused(state, { type: "handoff", actor: "A" }, "ready work remains")
  assert.deepEqual(ready(state, "B"), [])
  state = ok(state, { type: "issue.release", actor: "A", id: "I-A-1", rev: 2 })
  state = ok(state, { type: "coverage.add", actor: "A", coverage: "scenario", target: "other obligation", state: "open", note: "not finished" })
  refused(state, { type: "handoff", actor: "A" }, "ready work remains: C-A-1")
  state = ok(state, { type: "proposed-fix.take", actor: "A", id: "P-A-1", rev: 1 })
  assert.equal(rowsOf(state, "Proposed fix")[0]?.owner, "A", "release is not a ban on explicit reclaim")
  assert.equal(rowsOf(state, "Proposed fix")[0]?.releasedBy, undefined)
})

test("single-seat and legacy released proposals remain visible without a known peer handoff", () => {
  for (const mode of ["single", "joint"] as const) {
    let state = mode === "single" ? start("single") : joint()
    state = ok(state, { type: "proposed-fix.add", actor: "A", issues: [], ...shape({ goal: "retain drafts" }) })
    state = ok(state, { type: "proposed-fix.release", actor: "A", id: "P-A-1", rev: 1 })
    if (mode === "joint") state = { ...state, rows: state.rows.map(item => {
      if (item.kind !== "Proposed fix") return item
      const { releasedBy: _releasedBy, ...legacy } = item
      return legacy
    }) }
    assert.equal(ready(state, "A")[0]?.command, "proposed-fix.take")
    state = ok(state, { type: "proposed-fix.take", actor: "A", id: "P-A-1", rev: 1 })
    assert.equal(rowsOf(state, "Proposed fix")[0]?.owner, "A")
  }
})

test("donor pickup remains visible until the successor has imported its cold pass", () => {
  let state = start("joint")
  state = ok(state, { type: "cold.import", actor: "A", rows: [] })
  state = ok(state, { type: "proposed-fix.add", actor: "A", issues: [], ...shape({ goal: "retain drafts" }) })
  state = ok(state, { type: "proposed-fix.release", actor: "A", id: "P-A-1", rev: 1 })
  refused(state, { type: "proposed-fix.take", actor: "B", id: "P-A-1", rev: 1 }, "import your cold pass")
  assert.equal(ready(state, "A")[0]?.command, "proposed-fix.take")
  refused(state, { type: "handoff", actor: "A" }, "ready work remains")
  state = ok(state, { type: "cold.import", actor: "B", rows: [] })
  assert.deepEqual(ready(state, "A"), [])
  assert.equal(ready(state, "B")[0]?.command, "proposed-fix.take")
  state = ok(state, { type: "handoff", actor: "A" })
  assert.equal(state.handedOff.A, true)
})

test("a bundled feature handoff is atomic and leaves dependency owners and evidence intact", () => {
  let state = joint()
  state = ok(state, { type: "proposed-fix.add", actor: "A", issues: [], ...shape({ goal: "save drafts" }) })
  state = ok(state, { type: "proposed-fix.add", actor: "A", issues: [], ...shape({ goal: "load drafts" }) })
  state = ok(state, { type: "proposed-fix.add", actor: "A", issues: [], ...shape({ goal: "resume session" }) })
  state = ok(state, { type: "checkout.take", actor: "A", purpose: "save two related features and one dependent" })
  state = ok(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-1", "P-A-2"], artifact: "drafts.patch", ...evidence() })
  state = ok(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-3"], artifact: "resume.patch", ...evidence(), dependencies: [{ id: "S-A-1", rev: 1 }] })
  state = ok(state, { type: "checkout.release", actor: "A", reason: "" })
  state = ok(state, { type: "shelved-fix.review", ...candidateReader(state), id: "S-A-1", rev: 1, conditions: "" })
  state = ok(state, { type: "shelved-fix.review", ...candidateReader(state), id: "S-A-2", rev: 1, conditions: "" })
  const shelves = rowsOf(state, "Shelved fix")
  refused(state, { type: "proposed-fix.release", actor: "A", id: "P-A-1", rev: 7 }, "read it again")
  state = ok(state, { type: "proposed-fix.release", actor: "A", id: "P-A-1", rev: 1 })
  assert.deepEqual(rowsOf(state, "Proposed fix").map((item) => item.owner), [null, null, "A"])
  assert.deepEqual(rowsOf(state, "Proposed fix").map((item) => item.releasedBy), ["A", "A", undefined])
  assert.deepEqual(ready(state, "A"), [])
  state = ok(state, { type: "handoff", actor: "A" })
  assert.equal(ready(state, "B").filter(item => item.command === "proposed-fix.take").length, 2)
  state = ok(state, { type: "proposed-fix.take", actor: "B", id: "P-A-2", rev: 1 })
  assert.deepEqual(rowsOf(state, "Proposed fix").map((item) => item.owner), ["B", "B", "A"])
  assert.deepEqual(rowsOf(state, "Shelved fix"), shelves)
  state = ok(state, { type: "checkout.take", actor: "B", purpose: "continue bundled candidate" })
  state = ok(state, { type: "shelved-fix.set", actor: "B", id: "S-A-1", rev: 1, artifact: "drafts-v2.patch", ...evidence() })
  assert.equal(rowsOf(state, "Shelved fix")[1]?.state, "stale", "the actual candidate revision invalidates dependent validation")
  assert.equal(rowsOf(state, "Proposed fix")[2]?.owner, "A")
})

test("released proposal takes respect outstanding issue holds and questions without a partial transfer", () => {
  let state = agreedIssue(joint())
  state = ok(state, { type: "proposed-fix.add", actor: "A", issues: ["I-A-1"], ...shape() })
  state = ok(state, { type: "proposed-fix.release", actor: "A", id: "P-A-1", rev: 1 })
  state = ok(state, { type: "issue.take", actor: "A", id: "I-A-1", rev: 2 })
  refused(state, { type: "proposed-fix.take", actor: "B", id: "P-A-1", rev: 1 }, "taken by A")
  assert.equal(rowsOf(state, "Proposed fix")[0]?.owner, null)
  assert.ok(!ready(state, "B").some((item) => item.command === "proposed-fix.take"))
  state = ok(state, { type: "issue.release", actor: "A", id: "I-A-1", rev: 2 })
  state = ok(state, { type: "question.add", actor: "A", issues: [], fix: "P-A-1", question: "retain drafts?", options: ["retain", "delete"], recommendation: "retain", effect: "persistence", cost: "one handler" })
  refused(state, { type: "proposed-fix.take", actor: "B", id: "P-A-1", rev: 1 }, "waits for the user's answer")
  assert.equal(rowsOf(state, "Proposed fix")[0]?.owner, null)
  state = ok(state, { type: "question.answer", actor: "master", id: "Q-A-1", rev: 1, answer: "retain" })
  state = ok(state, { type: "proposed-fix.take", actor: "B", id: "P-A-1", rev: 2 })
  state = ok(state, { type: "proposed-fix.set", actor: "B", id: "P-A-1", rev: 2, shape: "retain drafts" })
  assert.equal(rowsOf(state, "Proposed fix")[0]?.owner, "B")
})

test("a report-only takeover keeps proposal contributors and exposes a fresh assessment", () => {
  let state = joint("report-only")
  state = ok(state, { type: "proposed-fix.add", actor: "A", issues: [], ...shape({ goal: "retain unsent drafts" }) })
  state = ok(state, { type: "proposed-fix.release", actor: "A", id: "P-A-1", rev: 1 })
  state = ok(state, { type: "proposed-fix.take", actor: "B", id: "P-A-1", rev: 1 })
  state = ok(state, { type: "proposed-fix.set", actor: "B", id: "P-A-1", rev: 1, shape: "retain unsent drafts across restarts" })
  assert.equal(ready(state, "reader")[0]?.command, "proposed-fix.mark")
  assert.equal(isDone(state), false)
  state = ok(state, { type: "proposed-fix.mark", actor: "reader", id: "P-A-1", rev: 2, reader: "fresh-18", assessment: "proposal-review.md" })
  assert.deepEqual(ready(state, "reader"), [])
  assert.equal(rowsOf(state, "Proposed fix")[0]?.mark?.reader, "fresh-18")
})

test("property: traces that follow ready work keep every rule and never stop with agreed work unfinished", () => {
  let finished = 0
  fc.assert(
    fc.property(
      fc.constantFrom<HowFar>("fix", "report-only"),
      fc.integer({ min: 1, max: 4 }),
      fc.array(fc.tuple(fc.constantFrom<Actor>("A", "B", "B", "A", "master", "reader"), fc.nat(1000)), { minLength: 40, maxLength: 160 }),
      (howFar, issueCount, picks) => {
        let state = joint(howFar)
        for (let index = 0; index < issueCount; index += 1) {
          const author: Seat = index % 2 === 0 ? "A" : "B"
          state = ok(state, addIssue(author, index % 5 === 4 ? "Hardening" : "Bug", { claim: `issue ${index}` }))
        }
        let revisions = new Map<string, number>()
        for (const [actor, pick] of picks) {
          const options = ready(state, actor)
          let step: Step | null = null
          if (options.length > 0) step = concrete(state, actor, options[pick % options.length]!, pick)
          else if (isSeat(actor) && !state.handedOff[actor] && state.checkout?.holder !== actor) step = { type: "handoff", actor }
          else if (actor !== "master" && state.checkout?.holder === actor) step = { type: "checkout.release", actor, reason: "" }
          if (!step) continue
          const result = transition(state, { ...currentAssessment(state, step), at: at() } as Command)
          // The generator may pick a choice the rules refuse (a self-contest, a second edit); the state stays.
          if (!result.ok) continue
          for (const row of result.state.rows) {
            const before = revisions.get(row.id)
            if (before !== undefined) assert.ok(row.rev >= before, `${row.id} rev went backwards`)
          }
          revisions = new Map(result.state.rows.map((row) => [row.id, row.rev]))
          state = result.state
          invariants(state)
        }
        if (isDone(state)) finished += 1
      },
    ),
    { numRuns: 150 },
  )
  assert.ok(finished > 20, `only ${finished} traces reached the end of a run; the generator is too weak to mean much`)
})
