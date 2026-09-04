import assert from "node:assert/strict"
import { test } from "node:test"
import fc from "fast-check"

import {
  initialState,
  isDone,
  isSubstantive,
  ready,
  rowById,
  rowsOf,
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
  const result = transition(state, { ...command, at: at() } as Command)
  if (!result.ok) assert.fail(`${command.type} refused: ${result.error}`)
  expect?.(result.notifications)
  return result.state
}

/** Apply a command that must be refused with a message containing `text`. */
function refused(state: State, command: Step, text: string): void {
  const result = transition(state, { ...command, at: at() } as Command)
  assert.equal(result.ok, false, `${command.type} should be refused`)
  if (!result.ok) assert.match(result.error, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"))
}

const FULL: Facts = { claim: "off by one", site: "a.ts:12", trigger: "list of 1", cause: "<= vs <", scope: "all users", frequency: "every save", impact: "crash", rank: 1, detector: "" }

function addIssue(actor: Seat, label: Issue["label"] = "Bug", facts: Partial<Facts> = {}): Step {
  return { type: "issue.add", actor, label, certainty: 2, facts: { ...FULL, ...facts }, parents: [], clusters: [], state: "new", evidence: "", assumption: "", reason: "" }
}

function shape(overrides: Partial<ProposedFix> = {}) {
  return { origin: "self-consistency" as const, shape: "assert at boundary", sites: "a.ts:12, b.ts:3", rulings: "none recorded", test: "a.test.ts", cost: "two files", guardrail: "unit test", coordination: "", needsMark: true, ...overrides }
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
  assert.equal(ready(state, "B")[0]?.command, "issue.agree")
  assert.equal(ready(state, "A")[0]?.command, "issue.verify")

  state = ok(state, { type: "issue.verify", actor: "A", id: "I-A-1", rev: 1, certainty: 4, evidence: "probe.log" })
  refused(state, { type: "issue.take", actor: "A", id: "I-A-1", rev: 2 }, "not agreed yet")
  state = ok(state, { type: "issue.agree", actor: "B", id: "I-A-1", rev: 2 }, (messages) => {
    assert.equal(messages.length, 1)
    assert.equal(messages[0]!.to, "A")
  })
  assert.deepEqual(ready(state, "A").map((item) => item.command), ["issue.take"])
  assert.deepEqual(ready(state, "B").map((item) => item.command), ["issue.take"], "a verified issue nobody is fixing is either reviewer's to take")

  state = ok(state, { type: "issue.take", actor: "A", id: "I-A-1", rev: 2 })
  assert.deepEqual(ready(state, "B"), [], "B has nothing while A writes the fix")
  refused(state, { type: "proposed-fix.add", actor: "B", issues: ["I-A-1"], ...shape() }, "take I-A-1")
  state = ok(state, { type: "proposed-fix.add", actor: "A", issues: ["I-A-1"], ...shape() }, (messages) => {
    assert.equal(messages[0]?.to, "B", "B is told the proposal awaits its mark")
  })
  assert.equal(ready(state, "A").length, 0, "A waits for B's mark on the proposal and does other work")
  state = ok(state, { type: "proposed-fix.mark", actor: "B", id: "P-A-1", rev: 1 })
  assert.equal(ready(state, "A")[0]?.command, "checkout.take")

  state = ok(state, { type: "checkout.take", actor: "A", purpose: "fix I-A-1" })
  refused(state, { type: "checkout.take", actor: "B", purpose: "probe" }, "held by A")
  refused(state, { type: "handoff", actor: "A" }, "release the checkout")
  refused(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-1"], artifact: "stash", red: "", green: "green.log", question: "" }, "red log")
  refused(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-1"], artifact: "stash", red: "same.log", green: "same.log", question: "" }, "two different logs")
  state = ok(state, { type: "checkout.baseline", actor: "A", build: "build.log", test: "test.log" })
  state = ok(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-1"], artifact: "stash@0", red: "red.log", green: "green.log", question: "" }, (messages) => {
    assert.equal(messages[0]?.to, "B", "B is told a diff awaits review")
  })
  assert.equal((rowById(state, "I-A-1") as Issue).taken, null, "the shelve releases the take")
  state = ok(state, { type: "checkout.release", actor: "A", reason: "" })
  refused(state, { type: "shelved-fix.review", actor: "A", id: "S-A-1", rev: 1, conditions: "" }, "nobody marks their own work")
  state = ok(state, { type: "shelved-fix.review", actor: "B", id: "S-A-1", rev: 1, conditions: "error path swallows the failure" })
  assert.equal(ready(state, "A")[0]?.command, "checkout.take", "conditions send the author back to the checkout")
  state = ok(state, { type: "checkout.take", actor: "A", purpose: "meet conditions" })
  state = ok(state, { type: "shelved-fix.set", actor: "A", id: "S-A-1", rev: 2, artifact: "stash@1" })
  state = ok(state, { type: "checkout.release", actor: "A", reason: "" })
  state = ok(state, { type: "shelved-fix.review", actor: "B", id: "S-A-1", rev: 3, conditions: "" })

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
  state = ok(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-1"], artifact: "s", red: "r.log", green: "g.log", question: "" })
  state = ok(state, { type: "checkout.release", actor: "A", reason: "" })
  state = ok(state, { type: "shelved-fix.review", actor: "B", id: "S-A-1", rev: 1, conditions: "" })

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

test("argue twice, then the contester runs the probe", () => {
  let state = joint()
  state = ok(state, addIssue("A"))
  state = ok(state, { type: "issue.verify", actor: "A", id: "I-A-1", rev: 1, certainty: 4, evidence: "p.log" })
  refused(state, { type: "issue.contest", actor: "A", id: "I-A-1", rev: 2, probe: "x" }, "the other reviewer contests")
  state = ok(state, { type: "issue.contest", actor: "B", id: "I-A-1", rev: 2, probe: "run with n=1" })
  assert.equal(ready(state, "A")[0]?.command, "issue.set", "the editor answers the first contest")
  refused(state, { type: "issue.probe", actor: "B", id: "I-A-1", rev: 3, verdict: "disproved", certainty: 4, evidence: "p2.log" }, "contested once")
  state = ok(state, { type: "issue.set", actor: "A", id: "I-A-1", rev: 3, facts: { trigger: "n=1 and n=0" }, labelReason: "" })
  assert.equal((rowById(state, "I-A-1") as Issue).state, "new")
  state = ok(state, { type: "issue.verify", actor: "A", id: "I-A-1", rev: 4, certainty: 4, evidence: "p.log" })
  state = ok(state, { type: "issue.contest", actor: "B", id: "I-A-1", rev: 5, probe: "run with n=0" })
  assert.deepEqual(ready(state, "A"), [], "after two contests the editor argues no further")
  assert.equal(ready(state, "B")[0]?.command, "issue.probe")
  refused(state, { type: "issue.verify", actor: "B", id: "I-A-1", rev: 6, certainty: 4, evidence: "x.log" }, "contested twice")
  state = ok(state, { type: "issue.probe", actor: "B", id: "I-A-1", rev: 6, verdict: "disproved", certainty: 4, evidence: "probe2.log" })
  assert.equal((rowById(state, "I-A-1") as Issue).state, "disproved")
  assert.deepEqual(ready(state, "A"), [])
  assert.deepEqual(ready(state, "B"), [])
})

test("a shape rejected twice becomes the user's question, and the answer reopens the proposal", () => {
  let state = agreedIssue(joint())
  state = ok(state, { type: "proposed-fix.add", actor: "A", issues: ["I-A-1"], ...shape() })
  refused(state, { type: "proposed-fix.set", actor: "B", id: "P-A-1", rev: 1, shape: "other" }, "reject it with a reason")
  state = ok(state, { type: "proposed-fix.reject", actor: "B", id: "P-A-1", rev: 1, reason: "patches the symptom" })
  state = ok(state, { type: "proposed-fix.set", actor: "A", id: "P-A-1", rev: 2, shape: "move the check to the producer" })
  state = ok(state, { type: "proposed-fix.reject", actor: "B", id: "P-A-1", rev: 3, reason: "still two owners" })
  refused(state, { type: "proposed-fix.set", actor: "A", id: "P-A-1", rev: 4, shape: "third try" }, "user's call")
  assert.equal(ready(state, "A")[0]?.command, "question.add")
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
    assert.ok(messages.some((message) => message.to === "B"), "B is told the reopened proposal awaits its mark")
  })
  const fix = rowById(state, "P-A-1") as ProposedFix
  assert.equal(fix.disputes, 0)
  assert.equal(fix.state, "draft")
  assert.equal(ready(state, "B")[0]?.command, "proposed-fix.mark")
})

test("the test comes first: no red log without the user's no-red answer that covers every issue", () => {
  let state = agreedIssue(joint())
  state = ok(state, { type: "proposed-fix.add", actor: "A", issues: ["I-A-1"], ...shape({ test: "none: no seam reaches the scheduler" }) })
  state = ok(state, { type: "proposed-fix.mark", actor: "B", id: "P-A-1", rev: 1 })
  state = ok(state, { type: "checkout.take", actor: "A", purpose: "fix" })
  refused(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-1"], artifact: "s", red: "", green: "g.log", question: "Q-A-9" }, "does not exist")
  state = ok(state, { type: "checkout.release", actor: "A", reason: "" })
  state = ok(state, { type: "question.add", actor: "A", issues: ["I-A-1"], fix: "", question: "shelve without a red run?", options: ["allow, architecture issue filed", "build the seam first"], recommendation: "allow, architecture issue filed", effect: "e", cost: "c" })
  refused(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-1"], artifact: "s", red: "", green: "g.log", question: "Q-A-1" }, "checkout")
  state = ok(state, { type: "checkout.take", actor: "A", purpose: "fix" })
  refused(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-1"], artifact: "s", red: "", green: "g.log", question: "Q-A-1" }, "waits for the user")
  state = ok(state, { type: "question.answer", actor: "master", id: "Q-A-1", rev: 1, answer: "allow, architecture issue filed" })
  state = ok(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-1"], artifact: "s", red: "", green: "g.log", question: "Q-A-1" })
  assert.equal(rowsOf(state, "Shelved fix")[0]?.question, "Q-A-1")
})

test("report only: issues and proposed fixes, no shelve, no check-in", () => {
  let state = agreedIssue(joint("report-only"))
  state = ok(state, { type: "proposed-fix.add", actor: "A", issues: ["I-A-1"], ...shape() })
  state = ok(state, { type: "proposed-fix.mark", actor: "B", id: "P-A-1", rev: 1 })
  assert.deepEqual(ready(state, "A"), [])
  assert.deepEqual(ready(state, "B"), [])
  state = ok(state, { type: "checkout.take", actor: "A", purpose: "probe" })
  refused(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-1"], artifact: "s", red: "r", green: "g", question: "" }, "report only")
  refused(state, { type: "check-in.approve", actor: "master", shelves: ["S-A-1"], executor: "A", approval: "go" }, "report only")
})

test("Hardening, telemetry-quality, and Nit never hold up the run; only a Nit is accepted", () => {
  let state = joint()
  state = ok(state, addIssue("A", "Hardening"))
  state = ok(state, addIssue("A", "Nit", { claim: "name" }))
  state = ok(state, addIssue("B", "telemetry-quality", { claim: "field" }))
  assert.deepEqual(ready(state, "A"), [])
  assert.deepEqual(ready(state, "B"), [])
  refused(state, { type: "issue.accept", actor: "A", id: "I-A-1", rev: 1, reason: "fine" }, "only a Nit")
  state = ok(state, { type: "issue.accept", actor: "B", id: "I-A-2", rev: 1, reason: "one run of life" })
  state = ok(state, { type: "handoff", actor: "A" })
  state = ok(state, { type: "handoff", actor: "B" })
  assert.equal(isDone(state), true)
  // A Hardening fix, when written, is shelved and reviewed like any other.
  state = ok(state, { type: "issue.verify", actor: "A", id: "I-A-1", rev: 1, certainty: 4, evidence: "p.log" })
  state = ok(state, { type: "proposed-fix.add", actor: "A", issues: ["I-A-1"], ...shape({ origin: "attention-miss", needsMark: false }) })
  state = ok(state, { type: "checkout.take", actor: "A", purpose: "fix" })
  state = ok(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-1"], artifact: "s", red: "r.log", green: "g.log", question: "" })
  assert.equal(ready(state, "B")[0]?.command, "shelved-fix.review")
})

test("a proposed fix is complete before it is shelved; an incomplete one is reported as a direction", () => {
  let state = agreedIssue(joint())
  state = ok(state, { type: "proposed-fix.add", actor: "A", issues: ["I-A-1"], ...shape({ sites: "", rulings: "" }) })
  state = ok(state, { type: "proposed-fix.mark", actor: "B", id: "P-A-1", rev: 1 })
  state = ok(state, { type: "checkout.take", actor: "A", purpose: "fix" })
  refused(state, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-1"], artifact: "s", red: "r", green: "g", question: "" }, "direction, not a proposal")
  refused(state, { type: "proposed-fix.add", actor: "A", issues: ["I-A-1"], ...shape({ origin: "self-consistency", needsMark: false }) }, "attention-miss")
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
  single = ok(single, { type: "shelved-fix.add", actor: "A", fixes: ["P-A-1"], artifact: "s", red: "r.log", green: "g.log", question: "" })
  single = ok(single, { type: "checkout.release", actor: "A", reason: "" })
  assert.deepEqual(ready(single, "B").map((item) => item.command), ["shelved-fix.review"])
  refused(single, { type: "handoff", actor: "A" }, "single run prints its report")
  single = ok(single, { type: "shelved-fix.review", actor: "B", id: "S-A-1", rev: 1, conditions: "" })
  assert.equal(isDone(single), true)
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
      return { type: "proposed-fix.add", actor, issues: [id], ...shape(pick % 4 === 0 ? { origin: "attention-miss", needsMark: false } : {}) }
    case "proposed-fix.set": return { type: "proposed-fix.set", actor, id, rev: revOf, shape: `shape ${pick}` }
    case "proposed-fix.mark":
      return pick % 3 === 0 ? { type: "proposed-fix.reject", actor, id, rev: revOf, reason: "no" } : { type: "proposed-fix.mark", actor, id, rev: revOf }
    case "question.add":
      return { type: "question.add", actor, issues: (row as ProposedFix).issues, fix: id, question: "which?", options: ["a", "b"], recommendation: "a", effect: "e", cost: "c" }
    case "question.answer": return { type: "question.answer", actor, id, rev: revOf, answer: "a" }
    case "checkout.take": return { type: "checkout.take", actor, purpose: "work" }
    case "checkout.baseline": return { type: "checkout.baseline", actor, build: "b.log", test: "t.log" }
    case "checkout.release": return { type: "checkout.release", actor, reason: "" }
    case "shelved-fix.add": return { type: "shelved-fix.add", actor, fixes: [id], artifact: "s", red: "r.log", green: "g.log", question: "" }
    case "shelved-fix.set": return { type: "shelved-fix.set", actor, id, rev: revOf, artifact: `s${pick}` }
    case "shelved-fix.review":
      return { type: "shelved-fix.review", actor, id, rev: revOf, conditions: pick % 3 === 0 ? "fix the error path" : "" }
    case "check-in.record": return { type: "check-in.record", actor, id, rev: revOf, changeset: "cs", departures: "none" }
    default: return null
  }
}

function invariants(state: State): void {
  for (const row of state.rows) {
    if ("mark" in row && row.mark) assert.notEqual(row.mark.by, row.editor, `${row.id} marked by its editor`)
    if (row.kind === "Shelved fix" && row.review) assert.notEqual(row.review.by, row.author, `${row.id} reviewed by its author`)
    if (row.kind === "Issue" && row.state === "verified") assert.ok(row.certainty >= 4 && row.evidence, `${row.id} verified without step 4 evidence`)
    if (row.kind === "Shelved fix" && !row.red) assert.ok(row.question, `${row.id} has no red log and no answered question`)
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

test("property: traces that follow ready work keep every rule and never stop with agreed work unfinished", () => {
  let finished = 0
  fc.assert(
    fc.property(
      fc.constantFrom<HowFar>("fix", "report-only"),
      fc.integer({ min: 1, max: 4 }),
      fc.array(fc.tuple(fc.constantFrom<Actor>("A", "B", "B", "A", "master"), fc.nat(1000)), { minLength: 40, maxLength: 160 }),
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
          else if (actor !== "master" && !state.handedOff[actor] && state.checkout?.holder !== actor) step = { type: "handoff", actor }
          else if (actor !== "master" && state.checkout?.holder === actor) step = { type: "checkout.release", actor, reason: "" }
          if (!step) continue
          const result = transition(state, { ...step, at: at() } as Command)
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
