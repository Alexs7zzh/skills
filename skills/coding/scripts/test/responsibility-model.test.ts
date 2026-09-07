import assert from "node:assert/strict"
import test from "node:test"
import fc from "fast-check"
import { initialState, taskById, transition, type Command, type State } from "../src/protocol.ts"
import { overdueDispatches, workSignals, type WorkSignal } from "../src/work.ts"

const at = "2026-09-08T00:00:00.000Z"
const inspectAfter = "2026-09-08T00:15:00.000Z"
const actors = ["A", "B", "master"] as const
function initial(): State {
  let state = initialState({ goal: "No unfinished commitment loses its next responsible actor", names: { master: "manager", A: "alice", B: "bob" }, scope: "fix", source: "User requested outcomes", at })
  const commands: Command[] = [
    { type: "record.save", actor: "A", at, id: "input", rev: 0, kind: "evidence", title: "input", content: "initial evidence" },
    { type: "record.save", actor: "master", at, id: "ruling", rev: 0, kind: "ruling", title: "User ruling", content: "User selected compatible output; source current message" },
    ...["source", "dependent", "write", "check-in"].map((id, index): Command => ({ type: "task.add", actor: "master", at, id, owner: index === 3 ? null : index === 1 ? "B" : "A", title: id, outcome: `Deliver ${id}`, next: `Continue ${id}`, permission: index === 2 ? "write" : index === 3 ? "check-in" : "read", inputs: [{ id: "input", rev: 1 }], requires: index === 1 ? [{ id: "source", version: 1 }] : [], wait: index === 3 ? { kind: "user", reason: "Choose check-in scope" } : null })),
  ]
  for (const command of commands) { const result = transition(state, command); assert.ok(result.ok); state = result.state }
  return state
}

/** Independent reachability oracle: a pending result may lead to another task,
 * but that chain must end at a surfaced actor action or a retained child inspection.
 * Merely possessing an owner or an eligibility blocker does not satisfy the check. */
function assertResponsibility(state: State, now = at, project: (state: State, actor: string) => readonly WorkSignal[] = workSignals): void {
  const keys = Object.fromEntries(actors.map((actor) => [actor, new Set(project(state, actor).map((signal) => signal.key))]))
  const due = overdueDispatches(state, now)
  function reachable(id: string, path = new Set<string>()): boolean {
    if (path.has(id)) return false
    const task = taskById(state, id)
    if (!task || task.state !== "open") return false
    const next = new Set(path).add(id)
    if (task.owner === null) return keys.master!.has(`unassigned:${id}`)
    assert.ok(Object.hasOwn(state.names, task.owner))
    const active = state.dispatches.filter((dispatch) => dispatch.task === id && ["reserved", "running"].includes(dispatch.state))
    assert.ok(active.length <= 1)
    if (active.length) {
      const dispatch = active[0]!
      assert.equal(dispatch.parent, task.owner)
      if (Date.parse(dispatch.inspectAfter) <= Date.parse(now)) assert.ok(due.some((inspection) => inspection.id === dispatch.id && inspection.parent === task.owner), `missing due inspection for ${id}`)
      return Object.hasOwn(state.names, dispatch.parent) && Number.isFinite(Date.parse(dispatch.inspectAfter))
    }
    if (keys[task.owner]?.has(`task:${id}`) || keys[task.owner]?.has(`reconcile:${id}`) || keys.master!.has(`reconcile:${id}`)) return true
    if (task.wait) return keys.master!.has(`wait:${id}`)
    if (keys.master!.has(`authority:${id}`)) return true
    const pending = task.requires.map((ref) => taskById(state, ref.id)).filter((dependency) => dependency?.state === "open")
    return pending.length > 0 && pending.every((dependency) => reachable(dependency!.id, next))
  }
  for (const task of [...state.tasks].reverse()) if (task.state === "open") assert.ok(reachable(task.id), `orphaned ${task.id}: ${JSON.stringify(state)}`)
  if (state.tasks.every((task) => task.state !== "open")) assert.ok(keys.master!.has(state.checkout ? "checkout" : "run-results-ready"))
}

test("orphan oracle detects a dependency chain whose owned final resolver signal disappeared", () => {
  const state = initial()
  assert.equal(taskById(state, "source")?.owner, "A")
  assert.equal(taskById(state, "dependent")?.owner, "B")
  assertResponsibility(state)
  assert.throws(() => assertResponsibility(state, at, (snapshot, actor) => workSignals(snapshot, actor).filter((signal) => signal.key !== "task:source")), /orphaned dependent/)
})

const operations = ["requires", "user-wait", "external-wait", "resolve", "clarify", "release", "claim", "scope", "authorize", "reserve", "running", "finished", "stopped", "cancel", "reopen", "finish", "revise-input", "reconcile-input", "take-checkout", "release-checkout"] as const
const step = fc.record({ operation: fc.constantFrom(...operations), target: fc.integer({ min: 0, max: 3 }), peer: fc.integer({ min: 0, max: 3 }), choice: fc.integer({ min: 0, max: 2 }) })

test("generated dependencies, waits, executions, permissions and ownership retain reachable responsibility", () => {
  const accepted = new Set<string>()
  fc.assert(fc.property(fc.array(step, { minLength: 25, maxLength: 90 }), (steps) => {
    let state = initial()
    assertResponsibility(state)
    for (const [index, action] of steps.entries()) {
      const task = state.tasks[action.target]!, peer = state.tasks[action.peer]!
      const owner = task.owner ?? "master", actor = actors[action.choice]!
      const target = { at, id: task.id, rev: task.rev }
      const dispatch = state.dispatches.find((item) => item.task === task.id && ["reserved", "running"].includes(item.state))
      let commands: Command[] = []
      switch (action.operation) {
        case "requires": commands = [{ type: "task.set", actor: "master", ...target, requires: action.choice === 0 ? [] : [{ id: peer.id, version: peer.version }], reason: "known dependency changed" }]; break
        case "user-wait": case "external-wait": commands = [{ type: "task.set", actor: owner, ...target, wait: { kind: action.operation === "user-wait" ? "user" : "external", reason: "explicit missing prerequisite" } }]; break
        case "resolve": commands = [{ type: "task.set", actor: task.wait?.kind === "user" ? "master" : owner, ...target, wait: null, ...(task.wait?.kind === "user" ? { resolution: { id: "ruling", rev: 1 } } : {}) }]; break
        case "clarify": commands = [{ type: "task.set", actor: owner, ...target, ...(task.wait ? { wait: { ...task.wait, reason: `Clarified missing input ${index}` } } : { note: "retained handoff" }) }]; break
        case "release": commands = [{ type: "task.release", actor: owner, ...target, note: "evidence saved", next: "continue from retained evidence" }]; break
        case "claim": commands = [{ type: "task.claim", actor: "master", ...target, owner: actor }]; break
        case "scope": commands = [{ type: "scope.set", actor: "master", at, rev: state.scope.rev, mode: ["report-only", "fix", "check-in"][action.choice] as "report-only" | "fix" | "check-in", source: "Explicit changed user instruction" }]; break
        case "authorize": commands = [{ type: "scope.authorize", actor: "master", ...target, scopeRev: state.scope.rev, executor: owner, inputs: task.inputs, source: "User selected this exact check-in" }]; break
        case "reserve": commands = [{ type: "dispatch.reserve", actor: owner, at, id: `child-${index}`, task: task.id, taskRev: task.rev, inspectAfter }]; break
        case "running": case "finished": case "stopped": if (dispatch) commands = [{ type: "dispatch.update", actor: dispatch.parent, at, id: dispatch.id, rev: dispatch.rev, state: action.operation, worker: { name: `child-${dispatch.id}`, pane: `pane-${dispatch.id}`, session: dispatch.id }, observation: `Observed ${action.operation}` }]; break
        case "cancel": commands = [{ type: "task.cancel", actor: "master", ...target, reason: "explicitly withdrawn outcome" }]; break
        case "reopen": commands = [{ type: "task.reopen", actor: "master", ...target, reason: "new evidence restored outcome" }]; break
        case "finish": {
          const id = `result-${index}`
          commands = [{ type: "record.save", actor: owner, at, id, rev: 0, kind: "result", title: task.outcome, content: "result and limits retained", inputs: task.inputs }, { type: "task.finish", actor: owner, ...target, result: { id, rev: 1 } }]
          break
        }
        case "revise-input": commands = [{ type: "record.save", actor: "A", at, id: "input", rev: state.records.filter((item) => item.id === "input").length, kind: "evidence", title: "new observation", content: `changed input ${index}` }]; break
        case "reconcile-input": commands = [{ type: "task.set", actor: owner, ...target, inputs: [{ id: "input", rev: state.records.filter((item) => item.id === "input").length }], reason: "rechecked changed evidence" }]; break
        case "take-checkout": commands = [{ type: "checkout.take", actor, at, rev: state.checkoutRev, purpose: "shared source edit" }]; break
        case "release-checkout": commands = [{ type: "checkout.release", actor: state.checkout?.holder ?? actor, at, rev: state.checkoutRev, reason: "candidate preserved and checkout released" }]; break
      }
      let after = state, ok = commands.length > 0
      for (const command of commands) { const result = transition(after, command); if (!result.ok) { ok = false; break }; after = result.state }
      if (ok) { state = after; accepted.add(action.operation) }
      assertResponsibility(state, index % 2 ? inspectAfter : at)
    }
  }), { numRuns: 180, seed: 9082026 })
  assert.deepEqual([...accepted].sort(), [...operations].sort(), "the generated suite must exercise successful transitions in every dimension")
})
