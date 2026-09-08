import assert from "node:assert/strict"
import test from "node:test"
import fc from "fast-check"
import { taskById, transition, type Command, type State } from "../src/protocol.ts"
import { activeDispatch, agreed, eligibility, runComplete, workSignals } from "../src/work.ts"
import { at, env, initial, apply, add, save } from "./domain-fixture.ts"

function responsibility(state: State): void {
  const keys = new Set(Object.keys(state.names).flatMap((actor) => workSignals(state, actor).map((signal) => signal.key)))
  for (const task of state.tasks) {
    if (agreed(state, task)) continue
    if (task.conclusion) { assert.ok(keys.has("agree:" + task.id)); continue }
    const dispatch = activeDispatch(state, task.id)
    if (dispatch) {
      assert.ok(state.names[dispatch.parent]); assert.ok(Number.isFinite(Date.parse(dispatch.inspectAfter)))
      continue
    }
    // An acknowledged wait is deliberately parked, not stranded ready work.
    if (task.wait) { assert.ok(task.wait.reason); assert.ok(task.attention > 0); continue }
    assert.ok(keys.has("task:" + task.id) || keys.has("unassigned:" + task.id) || keys.has("authority:" + task.id), "unresolved node has no reachable actor: " + task.id)
  }
  assert.equal(runComplete(state), state.tasks.length > 0 && state.tasks.every((task) => agreed(state, task)) && !state.checkout && !state.dispatches.some((dispatch) => ["reserved", "running"].includes(dispatch.state)))
}

test("generated replacement/agreement/wait/dispatch/ownership interleavings preserve reachable responsibility", () => {
  fc.assert(fc.property(fc.array(fc.record({ n: fc.integer({ min: 0, max: 3 }), action: fc.constantFrom("publishA", "publishB", "replace", "agreeA", "agreeB", "reopen", "note", "wait", "clear", "ack", "release", "claimA", "claimB", "reserve", "stop", "scope") }), { maxLength: 60 }), (steps) => {
    let state = apply(initial(), save("argument"))
    for (let i = 0; i < 4; i++) state = apply(state, add("n" + i, i % 2 ? "B" : "A"))
    for (const [index, step] of steps.entries()) {
      const task = taskById(state, "n" + step.n)!, target = { id: task.id, rev: task.rev }, actor = task.owner ?? "A"
      let command: Command
      switch (step.action) {
        case "publishA": case "publishB": command = { type: "task.publish", ...env(step.action === "publishA" ? "A" : "B"), ...target, disposition: index % 2 ? "done" : "stopped", result: { id: "argument", rev: 1 } }; break
        case "replace": command = { type: "task.publish", ...env("A"), ...target, disposition: "replaced", children: ["n" + ((step.n + 1) % 4)], result: { id: "argument", rev: 1 } }; break
        case "agreeA": case "agreeB": command = { type: "task.agree", ...env(step.action === "agreeA" ? "A" : "B"), ...target }; break
        case "reopen": command = { type: "task.reopen", ...env("B"), ...target, reason: "new evidence" }; break
        case "ack": command = { type: "task.ack", ...env("master"), ...target }; break
        case "release": command = { type: "task.release", ...env("master"), ...target, note: "preserved", next: "continue" }; break
        case "claimA": case "claimB": command = { type: "task.claim", ...env("master"), ...target, owner: step.action === "claimA" ? "A" : "B" }; break
        case "reserve": command = { type: "dispatch.reserve", ...env(actor), id: "child-" + index, task: task.id, taskRev: task.rev, inspectAfter: at }; break
        case "stop": { const dispatch = activeDispatch(state, task.id); command = { type: "dispatch.update", ...env("master"), id: dispatch?.id ?? "missing", rev: dispatch?.rev ?? 1, state: "stopped", observation: "confirmed process stopped" }; break }
        case "scope": command = { type: "scope.set", ...env("master"), rev: state.scope.rev, mode: state.scope.mode === "fix" ? "report-only" : "fix", source: "user direction" }; break
        default: command = { type: "task.set", ...env("master"), ...target, ...(step.action === "wait" ? { wait: { kind: "external", reason: "service down" } } : step.action === "clear" ? { wait: null } : { note: "checkpoint" }) }
      }
      const result = transition(state, command)
      if (result.ok) state = result.state
      responsibility(state)
      for (const actor of ["A", "B", "master"]) {
        const now = taskById(state, task.id)!
        assert.equal(transition(state, { type: "task.start", ...env(actor), id: now.id, rev: now.rev }).ok, eligibility(state, now, actor, "start").allowed)
      }
    }
  }), { numRuns: 200, seed: 90411 })
})

test("orphan assertion fails when the missing peer has no signal", () => {
  let state = apply(initial(), save("argument")); state = apply(state, add("issue"))
  state = apply(state, { type: "task.publish", ...env(), id: "issue", rev: 1, disposition: "done", result: { id: "argument", rev: 1 } })
  assert.ok(!runComplete(state))
  assert.ok(workSignals(state, "B").some((signal) => signal.key === "agree:issue"))
  assert.throws(() => responsibility({ ...state, names: { master: "manager", A: "alice" } }), /assertion|false|true/i)
})
