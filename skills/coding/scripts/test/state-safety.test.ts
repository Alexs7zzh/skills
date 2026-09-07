import assert from "node:assert/strict"
import { test } from "node:test"
import { initialState, ready, rowById, rowsOf, transition, type Command, type Issue, type ProposedFix, type State } from "../src/protocol.ts"
import { renderReport, renderStatus } from "../src/report.ts"
import { currentAssessment } from "./assessment-input.ts"

type Step = Command extends infer C ? C extends Command ? Omit<C, "at"> : never : never
let tick = 0
function apply(state: State, step: Step): State {
  const result = transition(state, { ...currentAssessment(state, step), at: new Date(++tick * 1000).toISOString() } as Command)
  if (!result.ok) assert.fail(`${step.type}: ${result.error}`)
  return result.state
}
function refuse(state: State, step: Step, message: RegExp): void {
  const result = transition(state, { ...currentAssessment(state, step), at: new Date(++tick * 1000).toISOString() } as Command)
  assert.equal(result.ok, false, `${step.type} must be refused`)
  if (!result.ok) assert.match(result.error, message)
}
function start(mode: "single" | "joint" = "single"): State {
  let state = initialState({ mode, route: "write", howFar: "fix", names: { A: "writer-a", B: "writer-b", master: "coordinator" }, declared: [] })
  if (mode === "joint") for (const actor of ["A", "B"] as const) state = apply(state, { type: "cold.import", actor, rows: [] })
  return state
}
function proposal(goal: string, issues: string[] = []): Step {
  return { type: "proposed-fix.add", actor: "A", issues, goal, origin: "requested behavior", shape: goal, sites: "draft.ts:12", rulings: "preserve drafts", test: "restart and compare the retained draft", cost: "one persistence boundary", guardrail: "", coordination: "" }
}
function issue(claim: string, parents: string[] = []): Step {
  return { type: "issue.add", actor: "A", label: "Bug", certainty: 3, facts: { claim, site: "draft.ts:12", trigger: "restart", cause: "missing flush", scope: "saved drafts", frequency: "every restart", impact: "lost work", rank: 2, detector: "" }, parents, clusters: [], state: "verified", evidence: "proof.md", assumption: "", reason: "" }
}
function validation(version = "initial") {
  return { validation: `${version}.md`, validationDigest: `${version}-digest` }
}
function shelf(state: State, fixes: string[], dependencies: { id: string; rev: number }[] = []): State {
  return apply(state, { type: "shelved-fix.add", actor: "A", fixes, artifact: `${fixes.join("-")}.patch`, baseline: "base-sha + local.patch", dependencies, ...validation() })
}
function review(state: State, id: string, conditions = ""): State {
  const actor = state.mode === "joint" ? "reader" : "B"
  return apply(state, { type: "shelved-fix.review", actor, id, rev: rowById(state, id)!.rev, conditions, ...(actor === "reader" ? { reader: "fresh-check", assessment: "assessment.md" } : {}) })
}
function question(issues: string[] = [], fix = ""): Step {
  return { type: "question.add", actor: "A", issues, fix, question: "retain drafts on sign-out?", options: ["retain", "delete"], recommendation: "delete", effect: "privacy versus resumption", cost: "one lifecycle path" }
}

test("partial bundle drop retains its history while surviving work can be handed off and reshelved", () => {
  let state = start("joint")
  state = apply(state, proposal("save drafts"))
  state = apply(state, proposal("load drafts"))
  state = apply(state, proposal("resume sessions"))
  state = apply(state, { type: "checkout.take", actor: "A", purpose: "bundle related changes" })
  state = shelf(state, ["P-A-1", "P-A-2"])
  state = shelf(state, ["P-A-3"], [{ id: "S-A-1", rev: 1 }])
  state = apply(state, { type: "checkout.release", actor: "A", reason: "" })
  state = review(review(state, "S-A-1"), "S-A-2")
  const original = rowsOf(state, "Shelved fix")[0]!
  state = apply(state, { type: "proposed-fix.drop", actor: "master", id: "P-A-1", rev: 1, reason: "user drops save but keeps load" })
  assert.ok(!ready(state, "A").some(item => item.row === "S-A-1"), "the old bundle is historical")
  assert.ok(ready(state, "A").some(item => item.row === "P-A-2" && item.command === "checkout.take"))
  assert.equal(rowsOf(state, "Shelved fix")[1]?.state, "stale")
  state = apply(state, { type: "proposed-fix.release", actor: "A", id: "P-A-2", rev: 1 })
  state = apply(state, { type: "proposed-fix.take", actor: "B", id: "P-A-2", rev: 1 })
  assert.equal((rowById(state, "P-A-1") as ProposedFix).state, "dropped")
  state = apply(state, { type: "checkout.take", actor: "B", purpose: "save surviving work" })
  state = apply(state, { type: "shelved-fix.add", actor: "B", fixes: ["P-A-2"], artifact: "load-only.patch", baseline: "base-sha", dependencies: [], ...validation("load-only") })
  refuse(state, { type: "shelved-fix.add", actor: "B", fixes: ["P-A-2"], artifact: "duplicate.patch", baseline: "base-sha", dependencies: [], ...validation("duplicate") }, /already shelved/)
  state = apply(state, { type: "checkout.release", actor: "B", reason: "" })
  state = review(state, "S-B-1")
  const history = rowsOf(state, "Shelved fix")[0]!
  assert.equal(history.artifact, original.artifact)
  assert.deepEqual(history.fixes, original.fixes)
  assert.equal(history.validationDigest, original.validationDigest)
  refuse(state, { type: "check-in.approve", actor: "master", shelves: ["S-A-1"], approval: "ship old bundle", executor: "A" }, /no longer answers an active/)
  state = apply(state, { type: "check-in.approve", actor: "master", shelves: ["S-B-1"], approval: "user selects load-only", executor: "B" })
  assert.equal(rowsOf(state, "Check-in")[0]?.state, "approved")
})

test("questions cannot revive a terminal proposal drop", () => {
  let state = apply(start(), proposal("retain drafts"))
  state = apply(state, question([], "P-A-1"))
  state = apply(state, { type: "proposed-fix.drop", actor: "master", id: "P-A-1", rev: 1, reason: "user abandons persistence" })
  refuse(state, question([], "P-A-1"), /dropped/)
  refuse(state, { type: "question.answer", actor: "master", id: "Q-A-1", rev: 2, answer: "delete" }, /withdrawn/)
  state = apply(state, proposal("offer manual export instead"))
  state = apply(state, question([], "P-A-2"))
  state = apply(state, { type: "question.answer", actor: "master", id: "Q-A-2", rev: 1, answer: "delete" })
  assert.equal((rowById(state, "P-A-1") as ProposedFix).state, "dropped")
  assert.equal((rowById(state, "P-A-2") as ProposedFix).state, "draft")
})

test("surviving issue proposals can reclaim their investigation after a bundle is dropped", () => {
  let state = apply(start("joint"), issue("draft loss"))
  state = apply(state, { type: "issue.take", actor: "A", id: "I-A-1", rev: 1 })
  state = apply(state, proposal("fix draft loss", ["I-A-1"]))
  state = apply(state, proposal("add automatic save"))
  state = apply(state, { type: "checkout.take", actor: "A", purpose: "related candidate" })
  state = shelf(state, ["P-A-1", "P-A-2"])
  state = apply(state, { type: "checkout.release", actor: "A", reason: "" })
  state = review(state, "S-A-1")
  state = apply(state, { type: "proposed-fix.drop", actor: "master", id: "P-A-2", rev: 1, reason: "user keeps the fix without automatic save" })
  assert.ok(ready(state, "A").some(item => item.command === "issue.take" && item.row === "I-A-1"))
  state = apply(state, { type: "issue.take", actor: "A", id: "I-A-1", rev: 1 })
  assert.ok(ready(state, "A").some(item => item.command === "checkout.take" && item.row === "P-A-1"))
  state = apply(state, { type: "checkout.take", actor: "A", purpose: "save fix separately" })
  state = shelf(state, ["P-A-1"])
  assert.equal(rowsOf(state, "Shelved fix").length, 2)
})

test("dependency staleness and refreshed evidence retain the independent reader's unresolved conditions", () => {
  let state = apply(apply(start(), proposal("save drafts")), proposal("resume sessions"))
  state = apply(state, { type: "checkout.take", actor: "A", purpose: "candidate chain" })
  state = shelf(state, ["P-A-1"])
  state = shelf(state, ["P-A-2"], [{ id: "S-A-1", rev: 1 }])
  state = review(state, "S-A-1")
  state = review(state, "S-A-2", "demonstrate bounded retries under permanent failure")
  state = apply(state, { type: "shelved-fix.set", actor: "A", id: "S-A-1", rev: 1, ...validation("save-v2") })
  const dependent = rowsOf(state, "Shelved fix")[1]!
  assert.equal(dependent.state, "stale")
  assert.equal(dependent.conditions, "demonstrate bounded retries under permanent failure")
  state = apply(state, { type: "shelved-fix.set", actor: "A", id: "S-A-2", rev: 1, dependencies: [{ id: "S-A-1", rev: 2 }], ...validation("resume-v2") })
  assert.equal(rowsOf(state, "Shelved fix")[1]?.conditions, dependent.conditions)
  state = review(state, "S-A-2")
  assert.equal(rowsOf(state, "Shelved fix")[1]?.conditions, "")
})

test("parent proof changes and user answers invalidate the dependent claim graph without discarding evidence", () => {
  for (const cause of ["claim edit", "user answer"] as const) {
    let state = start()
    for (const [claim, parents] of [["root", []], ["left", ["I-A-1"]], ["right", ["I-A-1"]], ["combined", ["I-A-2", "I-A-3"]], ["unrelated", []]] as const) state = apply(state, issue(claim, [...parents]))
    for (const current of rowsOf(state, "Issue")) state = apply(state, { type: "issue.agree", actor: "B", id: current.id, rev: current.rev })
    state = apply(state, proposal("fix combined defect", ["I-A-4"]))
    state = apply(state, proposal("unrelated feature", ["I-A-5"]))
    state = apply(state, { type: "checkout.take", actor: "A", purpose: "save combined and independent candidates" })
    state = shelf(state, ["P-A-1"])
    state = shelf(state, ["P-A-2"])
    state = review(review(state, "S-A-1"), "S-A-2")
    const before = rowsOf(state, "Issue")
    const candidates = rowsOf(state, "Shelved fix")
    if (cause === "claim edit") state = apply(state, { type: "issue.set", actor: "A", id: "I-A-1", rev: 1, facts: { scope: "only unsent drafts" }, labelReason: "" })
    else {
      state = apply(state, question(["I-A-1"]))
      refuse(state, { type: "proposed-fix.set", actor: "A", id: "P-A-1", rev: 1, shape: "change while the parent ruling waits" }, /waits for the user's answer/)
      state = apply(state, { type: "question.answer", actor: "master", id: "Q-A-1", rev: 1, answer: "delete" })
    }
    const after = rowsOf(state, "Issue")
    assert.ok(after.slice(0, 4).every(current => current.mark === null), cause)
    for (let index = 1; index < 4; index += 1) assert.deepEqual(after[index], { ...before[index], mark: null, updated: after[index]!.updated })
    assert.deepEqual(after[4], before[4])
    assert.equal(rowsOf(state, "Shelved fix")[0]?.state, "shelved")
    assert.equal(rowsOf(state, "Shelved fix")[0]?.validationDigest, candidates[0]?.validationDigest)
    assert.equal(rowsOf(state, "Shelved fix")[0]?.rev, candidates[0]?.rev)
    assert.deepEqual(rowsOf(state, "Shelved fix")[1], candidates[1])
  }
})

test("issue proof dependencies reject missing and cyclic links while clusters stay independent", () => {
  let state = start()
  refuse(state, issue("missing parent", ["I-A-99"]), /does not exist/)
  state = apply(state, issue("root"))
  state = apply(state, issue("derived", ["I-A-1"]))
  refuse(state, { type: "issue.set", actor: "A", id: "I-A-1", rev: 1, facts: {}, labelReason: "", parents: ["I-A-1"] }, /cycle/)
  refuse(state, { type: "issue.set", actor: "A", id: "I-A-1", rev: 1, facts: {}, labelReason: "", parents: ["I-A-2"] }, /cycle/)
  refuse(state, { type: "issue.set", actor: "A", id: "I-A-2", rev: 1, facts: {}, labelReason: "", parents: ["I-A-99"] }, /does not exist/)
  state = apply(state, { type: "issue.agree", actor: "B", id: "I-A-2", rev: 1 })
  state = apply(state, { type: "issue.set", actor: "A", id: "I-A-2", rev: 1, facts: {}, labelReason: "", parents: [], clusters: ["same-topic"] })
  state = apply(state, { type: "issue.agree", actor: "B", id: "I-A-2", rev: 2 })
  state = apply(state, { type: "issue.set", actor: "A", id: "I-A-1", rev: 1, facts: { scope: "narrower" }, labelReason: "", clusters: ["same-topic"] })
  assert.ok((rowById(state, "I-A-2") as Issue).mark, "topic overlap is not proof dependence")
})

test("single-run B can assess work but cannot create it or become its executor", () => {
  let state = apply(start(), issue("lost draft"))
  refuse(state, { ...proposal("reader-owned feature"), actor: "B" }, /assessments only/)
  refuse(state, { type: "checkout.take", actor: "B", purpose: "reader edits" }, /assessments only/)
  refuse(state, { type: "issue.set", actor: "B", id: "I-A-1", rev: 1, facts: { scope: "reader correction" }, labelReason: "" }, /assessments only/)
  state = apply(state, { type: "issue.agree", actor: "B", id: "I-A-1", rev: 1 })
  state = apply(state, proposal("retain drafts", ["I-A-1"]))
  state = apply(state, { type: "proposed-fix.reject", actor: "B", id: "P-A-1", rev: 1, reason: "the sign-out path needs assessment" })
  state = apply(state, { type: "checkout.take", actor: "A", purpose: "candidate" })
  state = shelf(state, ["P-A-1"])
  state = review(state, "S-A-1")
  refuse(state, { type: "check-in.approve", actor: "master", shelves: ["S-A-1"], executor: "B", approval: "user asks reader to commit" }, /assessments only/)
  state = apply(state, { type: "check-in.approve", actor: "master", shelves: ["S-A-1"], executor: "A", approval: "user selects writer" })
  assert.equal(rowsOf(state, "Check-in")[0]?.executor, "A")
})

test("one candidate assessment covers its supported parent proofs and refuses unsupported prerequisites", () => {
  for (const parentState of ["new", "disproved", "dropped"] as const) {
    let state = apply(start(), parentState === "new" ? { ...issue("parent proof"), state: "new" } as Step : issue("parent proof"))
    state = apply(state, issue("combined consequence", ["I-A-1"]))
    state = apply(state, proposal("fix combined consequence", ["I-A-2"]))
    state = apply(state, { type: "checkout.take", actor: "A", purpose: "candidate" })
    state = shelf(state, ["P-A-1"])
    if (parentState === "disproved") state = apply(state, { type: "issue.disprove", actor: "A", id: "I-A-1", rev: 1, certainty: 3, evidence: "disproof.md" })
    if (parentState === "dropped") state = apply(state, { type: "issue.exit", actor: "master", id: "I-A-1", rev: 1, exit: "drop", reference: "user withdraws this claim" })
    refuse(state, { type: "shelved-fix.review", actor: "B", id: "S-A-1", rev: 1, conditions: "" }, new RegExp(`I-A-1 is ${parentState}`))
    refuse(state, { type: "issue.agree", actor: "B", id: "I-A-2", rev: 1 }, new RegExp(`I-A-1 is ${parentState}`))
    state = review(state, "S-A-1", "the parent proof must be supported or replaced")
    if (parentState === "new") {
      state = apply(state, { type: "issue.verify", actor: "A", id: "I-A-1", rev: 1, certainty: 3, evidence: "checked-parent-proof.md" })
    } else {
      state = apply(state, { type: "issue.set", actor: "A", id: "I-A-2", rev: 1, parents: [], facts: { cause: "independent mechanism established in replacement proof" }, labelReason: "" })
    }
    state = review(state, "S-A-1")
    assert.equal(rowsOf(state, "Shelved fix")[0]?.rev, 1)
    assert.equal(rowsOf(state, "Shelved fix")[0]?.validationDigest, "initial-digest")
    assert.ok((rowById(state, "I-A-2") as Issue).mark)
    if (parentState === "new") assert.ok((rowById(state, "I-A-1") as Issue).mark, "one candidate assessment marks the supporting proof too")
  }
})

test("cold import finishes declared discovery and open coverage without requiring issue verification", () => {
  let shared = initialState({ mode: "joint", route: "review", howFar: "fix", names: { A: "a", B: "b", master: "m" }, declared: [{ coverage: "hunk", target: "save" }, { coverage: "cluster", target: "restart" }] })
  let cold = initialState({ mode: "cold", seat: "A", route: "review", howFar: "fix", names: shared.names, declared: shared.declared })
  refuse(shared, { type: "cold.import", actor: "A", rows: cold.rows }, /cold coverage/)
  cold = apply(cold, { type: "coverage.add", actor: "A", coverage: "hunk", target: "save", state: "open", note: "" })
  cold = apply(cold, { ...issue("restart needs investigation"), state: "new", clusters: ["restart"] } as Step)
  refuse(shared, { type: "cold.import", actor: "A", rows: cold.rows }, /cold coverage/)
  cold = apply(cold, { type: "coverage.set", actor: "A", id: "C-A-1", rev: 1, state: "gap", note: "generated input unavailable; inspect the generator next" })
  shared = apply(shared, { type: "cold.import", actor: "A", rows: cold.rows })
  assert.equal(shared.imported.A, true)
  assert.equal(rowsOf(shared, "Issue")[0]?.state, "new")
})

test("reports distinguish historical candidates, replacement fixes, and blocked report-readiness", () => {
  let state = apply(start(), issue("lost draft"))
  state = apply(state, proposal("old direction", ["I-A-1"]))
  state = apply(state, proposal("surviving direction", ["I-A-1"]))
  state = apply(state, { type: "checkout.take", actor: "A", purpose: "initial bundle" })
  state = shelf(state, ["P-A-1", "P-A-2"])
  state = review(state, "S-A-1")
  state = apply(state, { type: "proposed-fix.drop", actor: "master", id: "P-A-1", rev: 1, reason: "user keeps only the surviving direction" })
  assert.match(renderReport(state, [], {}), /Open substantive issues: 1/)
  assert.match(renderStatus(state, "A"), /S-A-1@1 \(historical bundle\)/)
  state = shelf(state, ["P-A-2"])
  state = review(state, "S-A-2")
  assert.match(renderReport(state, [], {}), /Open substantive issues: 0/)
  state = apply(state, { type: "checkout.release", actor: "A", reason: "" })
  state = apply(state, question(["I-A-1"]))
  const report = renderReport(state, [], {})
  assert.match(report, /Ready to report; unresolved work is listed below/)
  assert.match(report, /Q-A-1 \| open/)
  assert.doesNotMatch(report, /The run is done/)
})
