import assert from "node:assert/strict"
import { test } from "node:test"
import { freshReviews, initialState, isDone, ready, rowById, transition, type Command, type HowFar, type Seat, type State } from "../src/protocol.ts"
import { renderStatus, summary } from "../src/report.ts"
import { currentAssessment } from "./assessment-input.ts"

type Step = Command extends infer C ? C extends Command ? Omit<C, "at"> : never : never
let clock = 0
function apply(state: State, command: Step) {
  const result = transition(state, { ...currentAssessment(state, command), at: new Date(Date.UTC(2026, 0, 1, 0, 0, ++clock)).toISOString() } as Command)
  if (!result.ok) assert.fail(result.error)
  return result
}
function joint(howFar: HowFar = "fix") {
  let state = initialState({ mode: "joint", route: "write", howFar, names: { A: "author-a", B: "author-b", master: "lead" }, declared: [] })
  for (const actor of ["A", "B"] as const) state = apply(state, { type: "cold.import", actor, rows: [] }).state
  return state
}
function proposal(state: State, actor: Seat, issues: string[] = []) {
  return apply(state, { type: "proposed-fix.add", actor, issues, goal: issues.length ? "" : "retain drafts", origin: "user goal", shape: "save draft", sites: "draft.ts", rulings: "retain drafts", test: "restart test", cost: "one field", guardrail: "", coordination: "" }).state
}
function candidate(state: State, actor: Seat, fix: string) {
  state = apply(state, { type: "checkout.take", actor, purpose: "save candidate" }).state
  const result = apply(state, { type: "shelved-fix.add", actor, fixes: [fix], artifact: "draft.patch", baseline: "base", dependencies: [], validation: "validation.md", validationDigest: String(clock) })
  return { ...result, state: apply(result.state, { type: "checkout.release", actor, reason: "" }).state }
}
const assessment = { actor: "reader", reader: "independent-context", assessment: "assessment.md" } as const

test("each joint candidate has one arranger, while only its fresh reader can assess it", () => {
  const { state, notifications } = candidate(proposal(joint(), "A"), "A", "P-A-1")
  assert.deepEqual(freshReviews(state), [{ row: "S-A-1", rev: 1, arranger: "B", command: "shelved-fix.review" }])
  assert.deepEqual(notifications.map((message) => message.to), ["B"])
  assert.match(notifications[0]!.message, /fresh assessments for you to arrange or update: S-A-1@1 basis=sha256:/)
  assert.match(summary(state, "B"), /only you arrange/)
  for (const actor of ["A", "master"] as const) assert.doesNotMatch(summary(state, actor), /dispatch|only you arrange/)
  for (const actor of ["A", "B", "master", "reader"] as const) assert.match(renderStatus(state, actor), /\| S-A-1 \| 1 \| sha256:[a-f0-9]{64} \| B \|/)
  for (const actor of ["A", "B"] as const) {
    assert.deepEqual(ready(state, actor), [], "arranging a running child must not prevent handoff")
    for (const conditions of ["", "check recovery"]) {
      const result = transition(state, { ...currentAssessment(state, { type: "shelved-fix.review" as const, actor, id: "S-A-1", rev: 1, conditions }), at: "now" })
      assert.equal(result.ok, false, "a continuing parent cannot submit clean or conditional candidate assessments")
    }
  }
  assert.equal(ready(state, "reader")[0]?.command, "shelved-fix.review")
  const handoff = apply(state, { type: "handoff", actor: "A" })
  assert.match(handoff.notifications[0]!.message, /Pending fresh assessments arranged by you: S-A-1@1/)
  assert.match(handoff.notifications[0]!.message, /Check your working note.*pending does not mean no child is running/)
  assert.doesNotMatch(handoff.notifications[0]!.message, /Nothing awaits you/)
  const handed = apply(handoff.state, { type: "handoff", actor: "B" }).state
  assert.equal(isDone(handed), false)
  assert.equal(isDone(apply(handed, { type: "shelved-fix.review", ...assessment, id: "S-A-1", rev: 1, conditions: "" }).state), true)
})

test("every new pending assessment notifies its arranger even when other reviews are pending", () => {
  let state = candidate(proposal(joint(), "A"), "A", "P-A-1").state
  state = proposal(state, "A")
  const second = candidate(state, "A", "P-A-2")
  assert.deepEqual(second.notifications.map((message) => message.to), ["B"])
  assert.match(second.notifications[0]!.message, /S-A-2@1/)
  assert.doesNotMatch(second.notifications[0]!.message, /S-A-1@1/)
  state = proposal(second.state, "B")
  const third = candidate(state, "B", "P-B-1")
  assert.deepEqual(third.notifications.map((message) => message.to), ["A"])
  assert.match(third.notifications[0]!.message, /S-B-1@1/)
  assert.match(summary(third.state, "A"), /S-B-1@1/)
  assert.match(summary(third.state, "B"), /S-A-1@1 basis=sha256:[a-f0-9]{64}, S-A-2@1 basis=sha256:/)
  assert.doesNotMatch(summary(third.state, "master"), /dispatch|only you arrange/)
})

test("candidate arranger survives ownership-only takeover and changes with the next candidate editor", () => {
  let state = candidate(proposal(joint(), "B"), "B", "P-B-1").state
  state = apply(state, { type: "proposed-fix.release", actor: "B", id: "P-B-1", rev: 1 }).state
  const transferred = apply(state, { type: "proposed-fix.take", actor: "A", id: "P-B-1", rev: 1 })
  state = transferred.state
  assert.deepEqual(freshReviews(state).map((review) => review.arranger), ["A"])
  assert.ok(!transferred.notifications.some((message) => /fresh assessments/.test(message.message)))
  state = apply(state, { type: "checkout.take", actor: "A", purpose: "continue candidate" }).state
  const revised = apply(state, { type: "shelved-fix.set", actor: "A", id: "S-B-1", rev: 1, validation: "new-validation.md", validationDigest: "new" })
  assert.deepEqual(freshReviews(revised.state), [{ row: "S-B-1", rev: 2, arranger: "B", command: "shelved-fix.review" }])
  assert.deepEqual(revised.notifications.filter((message) => /fresh assessments/.test(message.message)).map((message) => message.to), ["B"])
  assert.doesNotMatch(summary(revised.state, "A"), /only you arrange/)
})

test("unchanged-revision follow-up keeps its arranger and notifies it with another pending review", () => {
  let state = candidate(proposal(joint(), "A"), "A", "P-A-1").state
  state = candidate(proposal(state, "A"), "A", "P-A-2").state
  state = apply(state, { type: "shelved-fix.review", ...assessment, id: "S-A-1", rev: 1, conditions: "check recovery" }).state
  assert.deepEqual(freshReviews(state).map((review) => review.row), ["S-A-2"])
  // The same independent reader may refine its conditions directly.
  state = apply(state, { type: "shelved-fix.review", ...assessment, id: "S-A-1", rev: 1, conditions: "check restart recovery" }).state
  const requested = apply(state, { type: "shelved-fix.request-review", actor: "A", id: "S-A-1", rev: 1, reason: "retained test demonstrates recovery" })
  assert.match(requested.notifications.find((message) => message.to === "B")!.message, /S-A-1@1/)
  assert.deepEqual(freshReviews(requested.state).map((review) => [review.row, review.rev, review.arranger]), [["S-A-1", 1, "B"], ["S-A-2", 1, "B"]])
  state = apply(requested.state, { type: "shelved-fix.review", ...assessment, id: "S-A-1", rev: 1, conditions: "" }).state
  const changed = apply(state, { type: "proposed-fix.set", actor: "A", id: "P-A-1", rev: 1, shape: "save through restart recovery" })
  assert.match(changed.notifications.find((message) => message.to === "B")!.message, /S-A-1@1/)
  assert.equal(rowById(changed.state, "S-A-1")?.rev, 1)
})

test("fresh candidate assessment covers peer-authored claims without separate compensating marks", () => {
  let state = joint()
  state = apply(state, { type: "issue.add", actor: "B", label: "Bug", certainty: 4, facts: { claim: "draft lost", site: "draft.ts", trigger: "restart", cause: "no persistence", scope: "all drafts", frequency: "every restart", impact: "data loss", rank: 1, detector: "" }, parents: [], clusters: [], state: "verified", evidence: "restart.log", assumption: "", reason: "" }).state
  state = apply(state, { type: "issue.take", actor: "A", id: "I-B-1", rev: 1 }).state
  state = candidate(proposal(state, "A", ["I-B-1"]), "A", "P-A-1").state
  assert.ok(!ready(state, "A").some((item) => item.command === "issue.agree"))
  assert.ok(!ready(state, "B").some((item) => item.command === "shelved-fix.review"))
  state = apply(state, { type: "shelved-fix.review", ...assessment, id: "S-A-1", rev: 1, conditions: "" }).state
  const issue = rowById(state, "I-B-1")!
  assert.ok(issue.kind === "Issue" && issue.mark?.by === "reader")
})

test("report-only shared proposals use the same arranger rule; ordinary peer discussion remains", () => {
  let state = proposal(joint("report-only"), "A")
  assert.deepEqual(ready(state, "B").map((item) => item.command), ["proposed-fix.mark"])
  assert.deepEqual(freshReviews(state), [])
  state = apply(state, { type: "proposed-fix.release", actor: "A", id: "P-A-1", rev: 1 }).state
  state = apply(state, { type: "proposed-fix.take", actor: "B", id: "P-A-1", rev: 1 }).state
  const edited = apply(state, { type: "proposed-fix.set", actor: "B", id: "P-A-1", rev: 1, shape: "retain across restarts" })
  state = edited.state
  assert.deepEqual(freshReviews(state), [{ row: "P-A-1", rev: 2, arranger: "A", command: "proposed-fix.mark" }])
  assert.deepEqual(edited.notifications.map((message) => message.to), ["A"])
  assert.match(summary(state, "A"), /only you arrange/)
  for (const actor of ["B", "master"] as const) assert.doesNotMatch(summary(state, actor), /dispatch|only you arrange/)
  state = apply(state, { type: "proposed-fix.release", actor: "B", id: "P-A-1", rev: 2 }).state
  state = apply(state, { type: "proposed-fix.take", actor: "A", id: "P-A-1", rev: 2 }).state
  assert.equal(freshReviews(state)[0]?.arranger, "A")
  assert.equal(apply(state, { type: "proposed-fix.mark", ...assessment, id: "P-A-1", rev: 2 }).state.rows.find((item) => item.id === "P-A-1")?.kind, "Proposed fix")
})

test("a retained candidate covers its shared report-only proposal without a second assessment", () => {
  let state = candidate(proposal(joint(), "A"), "A", "P-A-1").state
  state = apply(state, { type: "proposed-fix.release", actor: "A", id: "P-A-1", rev: 1 }).state
  state = apply(state, { type: "proposed-fix.take", actor: "B", id: "P-A-1", rev: 1 }).state
  state = apply(state, { type: "proposed-fix.set", actor: "B", id: "P-A-1", rev: 1, shape: "retain across restarts" }).state
  state = apply(state, { type: "run.set", actor: "master", howFar: "report-only", reason: "user wants a report" }).state
  assert.deepEqual(freshReviews(state), [{ row: "S-A-1", rev: 1, arranger: "B", command: "shelved-fix.review" }])
  assert.ok(!ready(state, "A").some((item) => item.command === "proposed-fix.mark"))
  assert.ok(!ready(state, "B").some((item) => item.command === "proposed-fix.mark"))
  state = apply(state, { type: "shelved-fix.review", ...assessment, id: "S-A-1", rev: 1, conditions: "" }).state
  const fix = rowById(state, "P-A-1")!
  assert.ok(fix.kind === "Proposed fix" && fix.mark?.by === "reader")
  assert.deepEqual(freshReviews(state), [])
})
