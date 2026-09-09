import assert from "node:assert/strict"
import { test } from "node:test"
import { taskById } from "../src/protocol.ts"
import { renderStatus } from "../src/report.ts"
import { env, initial, apply, add, save, publish, rejected } from "./domain-fixture.ts"

test("report-only validation can hold stable inputs without acquiring write authority", () => {
  let state = apply(initial(), { type: "scope.set", ...env("master"), rev: 1, mode: "report-only", source: "Only assess this change" })
  state = apply(state, { ...add("candidate"), permission: "write" })
  state = apply(state, { type: "checkout.take", ...env(), rev: 0, purpose: "Build and test the unchanged candidate" })
  assert.equal(state.checkout?.holder, "A")
  assert.equal(state.scope.mode, "report-only")
  rejected(state, { type: "task.start", ...env(), id: "candidate", rev: 1 }, /report-only/)
  rejected(state, { type: "dispatch.reserve", ...env(), id: "writer", task: "candidate", taskRev: 1, inspectAfter: "2099-01-01T00:00:00Z" }, /report-only/)
  rejected(state, { type: "checkout.take", ...env("B"), rev: 1, purpose: "Overlapping build" }, /held/)
  state = apply(state, { type: "checkout.release", ...env(), rev: 1, reason: "Validation evidence retained; inputs unchanged" })
  assert.equal(state.checkout, null)
})

test("master visibility does not invalidate the task revision a worker is using", () => {
  let state = apply(initial(), { ...add("validation"), wait: { kind: "external", reason: "Build prerequisite unavailable" } })
  const seen = taskById(state, "validation")!
  state = apply(state, { type: "task.ack", ...env("master"), id: seen.id, rev: seen.rev })
  assert.equal(taskById(state, seen.id)!.rev, seen.rev)
  state = apply(state, { type: "task.set", ...env(), id: seen.id, rev: seen.rev, wait: null, note: "Prerequisite restored" })
  assert.equal(taskById(state, seen.id)!.wait, null)
  rejected(state, { type: "task.ack", ...env("master"), id: seen.id, rev: seen.rev }, /rev/)
})

test("acknowledging a conclusion neither invalidates peer review nor hides subsequent changes", () => {
  let state = apply(apply(initial(), add("issue")), save("argument"))
  state = publish(state, "issue")
  const seen = taskById(state, "issue")!
  state = apply(state, { type: "task.ack", ...env("master"), id: seen.id, rev: seen.rev })
  rejected(state, { type: "task.ack", ...env("master"), id: seen.id, rev: seen.rev }, /no unread/)
  state = apply(state, { type: "task.agree", ...env("B"), id: seen.id, rev: seen.rev })
  const agreed = taskById(state, seen.id)!
  assert.ok(agreed.attention > agreed.acknowledged)
  assert.deepEqual(agreed.conclusion?.agreedBy, ["A", "B"])
})

test("task counts and recorded action facts do not masquerade as findings or runtime liveness", () => {
  let state = apply(initial(), add("review-area"))
  state = apply(state, { type: "task.start", ...env(), id: "review-area", rev: 1 })
  const status = renderStatus(state, "master")
  assert.match(status, /Tasks: 1 open/)
  assert.doesNotMatch(status, /Issues:|in progress|acting:/)
  assert.match(status, /start recorded/)
})
