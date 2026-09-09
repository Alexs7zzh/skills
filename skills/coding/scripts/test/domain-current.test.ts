import assert from "node:assert/strict"
import { test } from "node:test"
import { initialState, recordByRef, taskById } from "../src/protocol.ts"
import { agreed, runComplete, workSignals } from "../src/work.ts"
import { env, initial, apply, add, save, publish, rejected } from "./domain-fixture.ts"

test("started action belongs to its ownership tenure, not its next owner", () => {
  let state = apply(initial(), add("handoff"))
  state = apply(state, { type: "task.start", ...env(), id: "handoff", rev: 1 })
  state = apply(state, { type: "task.claim", ...env(), id: "handoff", rev: 2 })
  assert.equal(taskById(state, "handoff")!.started, true, "same-owner resumption retains the start")
  rejected(state, { type: "task.start", ...env(), id: "handoff", rev: 3 }, /already started/)
  const baselineVersion = taskById(state, "handoff")!.version
  state = apply(state, { type: "task.release", ...env(), id: "handoff", rev: 3, note: "evidence retained", next: "check remaining case" })
  assert.equal(taskById(state, "handoff")!.started, false)
  state = apply(state, { type: "task.claim", ...env("B"), id: "handoff", rev: 4 })
  state = apply(state, { type: "task.start", ...env("B"), id: "handoff", rev: 5 })
  state = apply(state, { type: "task.claim", ...env("master"), id: "handoff", rev: 6, owner: "A" })
  assert.equal(taskById(state, "handoff")!.started, false, "direct master reassignment starts a new tenure too")
  assert.equal(taskById(state, "handoff")!.version, baselineVersion, "transfer does not revise the promised outcome")
  state = apply(state, { type: "task.start", ...env(), id: "handoff", rev: 7 })
  assert.equal(taskById(state, "handoff")!.started, true)
})

test("comparison evidence accepts distinct versions but rejects repeated exact references", () => {
  let state = apply(initial(), save("measurement"))
  state = apply(state, save("measurement", "B", 1))
  const inputs = [{ id: "measurement", rev: 1 }, { id: "measurement", rev: 2 }]
  state = apply(state, { ...save("comparison"), inputs })
  state = apply(state, { ...add("compare"), inputs })
  assert.deepEqual(recordByRef(state, { id: "comparison", rev: 1 })!.inputs, inputs)
  assert.deepEqual(taskById(state, "compare")!.inputs, inputs)
  rejected(state, { ...save("duplicate"), inputs: [inputs[0]!, inputs[0]!] }, /unique/)
  rejected(state, { ...add("missing"), inputs: [{ id: "measurement", rev: 3 }] }, /missing record/)
  state = apply(state, { type: "scope.set", ...env("master"), rev: 1, mode: "check-in", source: "user authorized selected comparison" })
  state = apply(state, { type: "task.set", ...env(), id: "compare", rev: 1, permission: "check-in", reason: "user authorized integration" })
  rejected(state, { type: "scope.authorize", ...env("master"), id: "compare", rev: 2, scopeRev: 2, executor: "A", inputs: [inputs[0]!], source: "incomplete selection" }, /exactly match/)
  state = apply(state, { type: "scope.authorize", ...env("master"), id: "compare", rev: 2, scopeRev: 2, executor: "A", inputs: [...inputs].reverse(), source: "exact selected versions" })
  state = apply(state, { type: "task.start", ...env(), id: "compare", rev: 2 })
  assert.equal(taskById(state, "compare")!.started, true)
})

test("publication endorses author only; stale peer writes refuse; substantive republish resets only peer", () => {
  let state = apply(initial(), add("issue")); state = apply(state, save("argument"))
  assert.equal(state.tasks[0]!.conclusion, null)
  state = publish(state, "issue")
  assert.deepEqual(state.tasks[0]!.conclusion!.agreedBy, ["A"])
  rejected(state, { type: "task.agree", ...env("B"), id: "issue", rev: 1 }, /rev/)
  rejected(state, { type: "task.agree", ...env("master"), id: "issue", rev: 2 }, /investigators/)
  state = apply(state, { type: "task.agree", ...env("B"), id: "issue", rev: 2 })
  assert.equal(agreed(state, state.tasks[0]!), true)
  state = apply(state, { type: "task.set", ...env(), id: "issue", rev: 3, note: "cosmetic clarification" })
  assert.equal(agreed(state, state.tasks[0]!), true)
  state = apply(state, save("argument", "B", 1))
  assert.equal(agreed(state, state.tasks[0]!), true, "saving evidence is not publication")
  assert.equal(state.tasks[0]!.conclusion!.record.rev, 1, "published argument remains exact")
  state = apply(state, { type: "task.publish", ...env("B"), id: "issue", rev: 4, disposition: "done", result: { id: "argument", rev: 2 } })
  assert.deepEqual(state.tasks[0]!.conclusion!.agreedBy, ["B"])
  assert.equal(runComplete(state), false)
  assert.ok(workSignals(state, "A").some((s) => s.key === "agree:issue"))
  assert.equal(recordByRef(state, { id: "argument", rev: 1 })!.content, "Argument argument version 1")
})

test("master read acknowledgement neither endorses nor erases later attention", () => {
  let state = apply(initial(), add("issue")); state = apply(state, save("argument")); state = publish(state, "issue")
  state = apply(state, { type: "task.ack", ...env("master"), id: "issue", rev: 2 })
  assert.equal(agreed(state, state.tasks[0]!), false)
  assert.equal(workSignals(state, "master").some((s) => s.key === "outcome:issue"), false)
  state = apply(state, { type: "task.agree", ...env("B"), id: "issue", rev: 2 })
  assert.ok(workSignals(state, "master").some((s) => s.key === "outcome:issue"))
  rejected(state, { type: "task.ack", ...env("master"), id: "issue", rev: 2 }, /rev/)
  state = apply(state, { type: "task.reopen", ...env("B"), id: "issue", rev: 3, reason: "new evidence refutes conclusion" })
  assert.equal(state.tasks[0]!.conclusion, null)
  assert.ok(workSignals(state, "master").some((s) => s.key === "outcome:issue"))
})

test("replacement allows shared children, rejects missing/empty/cyclic links and never infers parent success", () => {
  let state = apply(initial(), save("argument"))
  for (const id of ["A", "B", "C", "D"]) state = apply(state, add(id))
  state = publish(state, "A", "A", "replaced", ["B", "C"])
  state = publish(state, "D", "B", "replaced", ["C"])
  for (const children of [[], ["missing"], ["C", "C"]]) {
    rejected(state, { type: "task.publish", ...env(), id: "B", rev: 1, result: { id: "argument", rev: 1 }, disposition: "replaced", children }, /replacement|missing/)
  }
  rejected(state, { type: "task.publish", ...env(), id: "C", rev: 1, result: { id: "argument", rev: 1 }, disposition: "replaced", children: ["A"] }, /cycle/)
  state = publish(state, "B")
  state = publish(state, "C", "B", "stopped")
  for (const task of [...state.tasks]) {
    state = apply(state, { type: "task.agree", ...env(task.conclusion!.author === "A" ? "B" : "A"), id: task.id, rev: taskById(state, task.id)!.rev })
  }
  assert.equal(runComplete(state), true)
  assert.equal(state.tasks[0]!.state, "replaced")
  assert.equal(state.tasks[2]!.state, "stopped")
  state = apply(state, { type: "task.reopen", ...env("B"), id: "C", rev: taskById(state, "C")!.rev, reason: "new approach" })
  assert.equal(runComplete(state), false)
  assert.equal(state.tasks[0]!.state, "replaced", "parent remains explanation, not computed proof")
})

test("local mode and actor/runtime namespaces cannot erase a peer agreement", () => {
  const local = initialState({ goal: "local", names: { master: "local-worker" }, scope: "report-only", source: "local request" })
  assert.deepEqual(local.investigators, ["master"])
  let state = initialState({ goal: "collision", names: { master: "manager", A: "B", B: "bob" }, scope: "fix", source: "request" })
  state = apply(state, add("issue")); state = apply(state, save("argument")); state = publish(state, "issue")
  assert.deepEqual(state.tasks[0]!.conclusion!.agreedBy, ["A"])
  state = apply(state, { type: "task.agree", ...env("B"), id: "issue", rev: 2 })
  assert.equal(runComplete(state), true)
  assert.throws(() => initialState({ goal: "bad", names: { master: "manager", A: "alice", B: "bob" }, investigators: ["A"], scope: "fix", source: "request" }), /every named peer/)
})

test("large shared replacement ancestry does not repeatedly evaluate paths", () => {
  let state = apply(initial(), save("argument"))
  for (let i = 0; i < 45; i++) state = apply(state, add("n" + i))
  for (let i = 2; i < 45; i++) state = publish(state, "n" + i, "A", "replaced", ["n" + (i - 1), "n" + (i - 2)])
  const start = performance.now()
  for (const actor of ["A", "B", "master"]) workSignals(state, actor)
  assert.ok(performance.now() - start < 1000, "shared ancestors should not create exponential work")
  assert.equal(runComplete(state), false)
})
