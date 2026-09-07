import assert from "node:assert/strict"
import { test } from "node:test"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { DatabaseSync } from "node:sqlite"
import fc from "fast-check"
import { completedResultCurrent, initialState, latestAssessment, recordByRef, taskById, transition, type Command, type State } from "../src/protocol.ts"
import { activeDispatch, eligibility, taskCurrent, workSignals } from "../src/work.ts"
import { create, mutate, read } from "../src/store.ts"

const at = "2026-09-07T00:00:00.000Z"
const env = (actor = "A") => ({ actor, at })
const initial = () => initialState({ goal: "Deliver the explicit outcome", names: { master: "manager", A: "alice", B: "bob" }, scope: "fix", source: "user request", at })
function apply(state: State, command: Command): State {
  const result = transition(state, command)
  assert.equal(result.ok, true, result.ok ? "" : result.error)
  return result.ok ? result.state : state
}
const add = (id: string, actor = "A"): Command => ({ type: "task.add", ...env(actor), id, title: id, outcome: `Deliver ${id}`, next: `Work on ${id}` })
const save = (id: string, actor = "A", rev = 0): Extract<Command, { type: "record.save" }> => ({ type: "record.save", ...env(actor), id, rev, kind: "evidence", title: id, content: `retained ${id} version ${rev + 1}` })
function rejected(state: State, command: Command, pattern: RegExp): void {
  const before = JSON.stringify(state), result = transition(state, command)
  assert.equal(result.ok, false)
  if (!result.ok) assert.match(result.error, pattern)
  assert.equal(JSON.stringify(state), before)
}

test("unfinished ownership release is immediate; task and checkout ownership are separate", () => {
  let state = apply(initial(), add("work"))
  state = apply(state, { type: "checkout.take", ...env(), rev: 0, purpose: "edit shared source" })
  state = apply(state, { type: "task.release", ...env(), id: "work", rev: 1, note: "hypothesis and evidence retained", next: "check alternate cause" })
  assert.equal(taskById(state, "work")?.owner, null)
  assert.equal(state.checkout?.holder, "A")
  assert.equal(workSignals(state, "B").length, 0)
  assert.ok(workSignals(state, "master").some((signal) => signal.key === "unassigned:work"))
  state = apply(state, { type: "task.claim", ...env("B"), id: "work", rev: 2 })
  assert.equal(state.checkout?.holder, "A")
  rejected(state, { type: "task.finish", ...env(), id: "work", rev: 2, result: { id: "none", rev: 1 } }, /rev/)
  rejected(state, { type: "checkout.take", ...env("B"), rev: 1, purpose: "take after timeout" }, /held by A/)
  rejected(state, { type: "checkout.recover", ...env("master"), rev: 1, stopped: "", preserved: "patch saved" }, /writer stopped/)
  state = apply(state, { type: "checkout.recover", ...env("master"), rev: 1, stopped: "process exited; inspected", preserved: "patch and baseline saved" })
  assert.equal(state.checkout, null)
})

test("cancelled or revised prerequisites require owner reconciliation; notes stay possible", () => {
  let state = apply(initial(), add("base"))
  state = apply(state, { ...add("dependent"), requires: [{ id: "base", version: 1 }] } as Command)
  state = apply(state, save("result"))
  state = apply(state, { type: "task.finish", ...env(), id: "base", rev: 1, result: { id: "result", rev: 1 } })
  assert.equal(eligibility(state, taskById(state, "dependent")!, "A", "start").allowed, true)
  state = apply(state, { type: "task.cancel", ...env(), id: "base", rev: 2, reason: "result disproved" })
  assert.equal(taskById(state, "dependent")?.state, "open")
  assert.match(taskCurrent(state, taskById(state, "dependent")!).join(" "), /cancelled/)
  assert.ok(workSignals(state, "A").some((signal) => signal.key === "reconcile:dependent"))
  state = apply(state, { type: "task.set", ...env(), id: "dependent", rev: 1, note: "retaining uncertainty", next: "choose replacement" })
  assert.equal(taskById(state, "dependent")?.version, 1)
  rejected(state, { type: "task.start", ...env(), id: "dependent", rev: 2 }, /cancelled/)
  rejected(state, { type: "task.set", ...env(), id: "dependent", rev: 2, requires: [], reason: "" }, /reason/)
  state = apply(state, { type: "task.set", ...env(), id: "dependent", rev: 2, requires: [], reason: "different evidence supports outcome" })
  assert.equal(eligibility(state, taskById(state, "dependent")!, "A", "start").allowed, true)
})

test("cycle rejection leaves both dependency sets unchanged", () => {
  let state = apply(initial(), add("one"))
  state = apply(state, { ...add("two"), requires: [{ id: "one", version: 1 }] } as Command)
  rejected(state, { type: "task.set", ...env(), id: "one", rev: 1, requires: [{ id: "two", version: 1 }], reason: "cycle" }, /cycle/)
})

test("a result explicitly on old inputs cannot finish a revised task; retraction invalidates dependents", () => {
  let state = apply(initial(), save("input"))
  state = apply(state, { ...add("work"), inputs: [{ id: "input", rev: 1 }] } as Command)
  state = apply(state, save("input", "A", 1))
  state = apply(state, { type: "task.set", ...env(), id: "work", rev: 1, inputs: [{ id: "input", rev: 2 }], reason: "input corrected" })
  state = apply(state, { ...save("result"), inputs: [{ id: "input", rev: 1 }] })
  rejected(state, { type: "task.finish", ...env(), id: "work", rev: 2, result: { id: "result", rev: 1 } }, /inputs/)
  state = apply(state, { ...save("result", "A", 1), inputs: [{ id: "input", rev: 2 }] })
  state = apply(state, { type: "task.finish", ...env(), id: "work", rev: 2, result: { id: "result", rev: 2 } })
  assert.equal(completedResultCurrent(state, taskById(state, "work")!), true)
  state = apply(state, { ...add("dependent"), requires: [{ id: "work", version: 2 }] } as Command)
  state = apply(state, { ...save("result", "A", 2), content: "Earlier result withdrawn", inputs: [{ id: "input", rev: 2 }] })
  assert.equal(completedResultCurrent(state, taskById(state, "work")!), false)
  assert.equal(eligibility(state, taskById(state, "dependent")!, "A", "start").allowed, false)
})

test("transitive evidence changes invalidate applicability without erasing bytes", () => {
  let state = apply(initial(), save("premise"))
  state = apply(state, { ...save("candidate"), inputs: [{ id: "premise", rev: 1 }] })
  state = apply(state, { ...save("review", "B"), assessment: { subject: { id: "candidate", rev: 1 }, verdict: "clean", conditions: "" } })
  assert.equal(latestAssessment(state, "candidate")?.applicable, true)
  state = apply(state, save("premise", "A", 1))
  assert.equal(latestAssessment(state, "candidate")?.applicable, false)
  assert.equal(recordByRef(state, { id: "premise", rev: 1 })?.content, "retained premise version 1")
})

test("historical independent review finishes its promised snapshot; adverse assessment never falls back", () => {
  let state = apply(initial(), save("candidate"))
  state = apply(state, { ...add("review", "B"), review: { subject: { id: "candidate", rev: 1 } }, inputs: [{ id: "candidate", rev: 1 }] } as Command)
  state = apply(state, save("candidate", "A", 1))
  const assessment = { subject: { id: "candidate", rev: 1 }, verdict: "clean" as const, conditions: "" }
  state = apply(state, { ...save("assessment", "B"), inputs: [{ id: "candidate", rev: 1 }], assessment })
  state = apply(state, { type: "task.finish", ...env("B"), id: "review", rev: 1, result: { id: "assessment", rev: 1 } })
  assert.equal(taskById(state, "review")?.state, "done")
  assert.equal(completedResultCurrent(state, taskById(state, "review")!), false)
  assert.equal(taskCurrent(state, taskById(state, "review")!).filter((reason) => reason.includes("candidate@1 is historical")).length, 1)
  assert.deepEqual(latestAssessment(state, "candidate")?.reasons, ["candidate@1 is historical"])
  state = apply(state, { ...save("assessment", "B", 1), inputs: [{ id: "candidate", rev: 2 }], assessment: { subject: { id: "candidate", rev: 2 }, verdict: "clean", conditions: "" } })
  state = apply(state, { ...save("adverse", "B"), inputs: [{ id: "candidate", rev: 1 }], assessment: { ...assessment, verdict: "conditions", conditions: "old snapshot has a counterexample" } })
  assert.equal(latestAssessment(state, "candidate")?.record.assessment?.verdict, "conditions")
  assert.equal(latestAssessment(state, "candidate")?.applicable, false)
})

test("dispatch reservation survives uncertainty and ownership transfer; child result stays attributable", () => {
  let state = apply(initial(), save("candidate"))
  state = apply(state, { ...add("review"), review: { subject: { id: "candidate", rev: 1 } } } as Command)
  state = apply(state, { type: "dispatch.reserve", ...env(), id: "child", task: "review", taskRev: 1, inspectAfter: at })
  rejected(state, { type: "task.claim", ...env("master"), id: "review", rev: 1, owner: "B" }, /active dispatch/)
  rejected(state, { type: "dispatch.reserve", ...env(), id: "second", task: "review", taskRev: 1, inspectAfter: at }, /active dispatch/)
  state = apply(state, { type: "dispatch.update", ...env(), id: "child", rev: 1, state: "reserved", observation: "launch response missing; must inspect" })
  assert.equal(activeDispatch(state, "review")?.id, "child")
  rejected(state, { type: "record.save", ...env(), id: "assessment", rev: 0, kind: "assessment", title: "assessment", content: "clean", assessment: { subject: { id: "candidate", rev: 1 }, verdict: "clean", conditions: "", dispatch: "child" } }, /finished dispatch/)
  state = apply(state, { type: "dispatch.update", ...env(), id: "child", rev: 2, state: "finished", worker: { name: "fresh-reader", pane: "pane-child", session: "child-session" }, observation: "child exited; retained assessment file" })
  assert.equal(taskById(state, "review")?.state, "open")
  state = apply(state, { ...save("assessment"), assessment: { subject: { id: "candidate", rev: 1 }, verdict: "clean", conditions: "", dispatch: "child" } })
  assert.deepEqual(recordByRef(state, { id: "assessment", rev: 1 })?.authors, ["fresh-reader"])
  state = apply(state, { type: "task.finish", ...env(), id: "review", rev: 1, result: { id: "assessment", rev: 1 } })
  assert.equal(taskById(state, "review")?.state, "done")
})

test("direct self review and child alias of subject author both refuse", () => {
  let state = apply(initial(), save("candidate"))
  const assessment = { subject: { id: "candidate", rev: 1 }, verdict: "clean" as const, conditions: "" }
  rejected(state, { ...save("self"), assessment }, /independent/)
  state = apply(state, { ...add("review"), review: { subject: assessment.subject } } as Command)
  state = apply(state, { type: "dispatch.reserve", ...env(), id: "child", task: "review", taskRev: 1, inspectAfter: at })
  state = apply(state, { type: "dispatch.update", ...env(), id: "child", rev: 1, state: "finished", worker: { name: "alice", pane: "different-pane", session: "different-session" }, observation: "finished" })
  rejected(state, { ...save("self"), assessment: { ...assessment, dispatch: "child" } }, /independent/)
})

test("old child execution cannot attest changed review inputs or a different task version", () => {
  let state = apply(initial(), save("candidate"))
  state = apply(state, { ...add("review"), review: { subject: { id: "candidate", rev: 1 } } } as Command)
  state = apply(state, { type: "task.start", ...env(), id: "review", rev: 1 })
  state = apply(state, { type: "dispatch.reserve", ...env(), id: "child", task: "review", taskRev: 2, inspectAfter: at })
  state = apply(state, { type: "dispatch.update", ...env(), id: "child", rev: 1, state: "finished", worker: { name: "fresh-reader", pane: "pane", session: "session" }, observation: "assessment returned" })
  state = apply(state, save("candidate", "A", 1))
  rejected(state, { ...save("bad-assessment"), assessment: { subject: { id: "candidate", rev: 2 }, verdict: "clean", conditions: "", dispatch: "child" } }, /pinned subject/)
  state = apply(state, { ...save("assessment"), assessment: { subject: { id: "candidate", rev: 1 }, verdict: "clean", conditions: "", dispatch: "child" } })
  state = apply(state, { type: "task.set", ...env(), id: "review", rev: 2, outcome: "An expanded assessment promise", reason: "new required checks" })
  rejected(state, { type: "task.finish", ...env(), id: "review", rev: 3, result: { id: "assessment", rev: 1 } }, /task version/)
})

test("historical-review exemption never grants write or check-in permission", () => {
  const state = apply(initial(), save("candidate"))
  for (const permission of ["write", "check-in"] as const) rejected(state, { ...add(`review-${permission}`), permission, review: { subject: { id: "candidate", rev: 1 } } } as Command, /read permission/)
})

test("completed historical assessments stay historical without becoming mandatory work again", () => {
  let state = apply(initial(), save("candidate"))
  state = apply(state, { ...add("old-review", "B"), review: { subject: { id: "candidate", rev: 1 } } } as Command)
  state = apply(state, { ...save("old-assessment", "B"), assessment: { subject: { id: "candidate", rev: 1 }, verdict: "clean", conditions: "" } })
  state = apply(state, { type: "task.finish", ...env("B"), id: "old-review", rev: 1, result: { id: "old-assessment", rev: 1 } })
  state = apply(state, save("candidate", "A", 1))
  state = apply(state, { ...add("new-review", "B"), review: { subject: { id: "candidate", rev: 2 } } } as Command)
  state = apply(state, { ...save("new-assessment", "B"), assessment: { subject: { id: "candidate", rev: 2 }, verdict: "clean", conditions: "" } })
  state = apply(state, { type: "task.finish", ...env("B"), id: "new-review", rev: 1, result: { id: "new-assessment", rev: 1 } })
  assert.equal(taskById(state, "old-review")?.state, "done")
  assert.equal(completedResultCurrent(state, taskById(state, "old-review")!), false)
  assert.equal(completedResultCurrent(state, taskById(state, "new-review")!), true)
  assert.deepEqual(workSignals(state, "B"), [])
  assert.deepEqual(workSignals(state, "master").map((signal) => signal.key), ["run-results-ready"])
  state = apply(state, { ...add("consumer"), requires: [{ id: "old-review", version: 1 }] } as Command)
  assert.equal(eligibility(state, taskById(state, "consumer")!, "A", "start").allowed, false)
  assert.deepEqual(workSignals(state, "A").map((signal) => signal.key), ["reconcile:consumer"])
  assert.deepEqual(workSignals(state, "master").map((signal) => signal.key), ["reconcile:consumer"])
  assert.deepEqual(workSignals(state, "B"), [])
})

test("checkout without unfinished holder work reaches master without inferring the writer stopped", () => {
  let state = apply(initial(), { type: "checkout.take", ...env(), rev: 0, purpose: "shared source edit" })
  assert.ok(workSignals(state, "master").some((signal) => signal.key === "checkout"))
  assert.equal(state.checkout?.holder, "A")
  rejected(state, { type: "checkout.take", ...env("B"), rev: 1, purpose: "take apparently abandoned checkout" }, /held by A/)
  state = apply(state, add("editing"))
  assert.equal(workSignals(state, "master").some((signal) => signal.key === "checkout"), false)
  state = apply(state, { type: "task.cancel", ...env(), id: "editing", rev: 1, reason: "scope withdrawn; source still needs preservation" })
  assert.ok(workSignals(state, "master").some((signal) => signal.key === "checkout"))
  assert.equal(state.checkout?.holder, "A")
  state = apply(state, { type: "checkout.release", ...env(), rev: 1, reason: "patch saved and edits cleaned up" })
  assert.equal(workSignals(state, "master").some((signal) => signal.key === "checkout"), false)
})

test("terminal results invite a master report only after checkout and execution obligations settle", () => {
  let state = initial()
  assert.deepEqual(workSignals(state, "master"), [])
  state = apply(state, add("one"))
  state = apply(state, add("two", "B"))
  state = apply(state, save("result"))
  state = apply(state, { type: "task.finish", ...env(), id: "one", rev: 1, result: { id: "result", rev: 1 } })
  assert.equal(workSignals(state, "master").some((signal) => signal.key === "run-results-ready"), false)
  state = apply(state, { type: "checkout.take", ...env("B"), rev: 0, purpose: "preserve candidate" })
  state = apply(state, { type: "task.cancel", ...env("B"), id: "two", rev: 1, reason: "user withdrew this outcome" })
  assert.equal(workSignals(state, "master").some((signal) => signal.key === "run-results-ready"), false)
  state = apply(state, { type: "checkout.release", ...env("B"), rev: 1, reason: "candidate retained" })
  const ready = workSignals(state, "master").find((signal) => signal.key === "run-results-ready")
  assert.ok(ready)
  assert.match(ready.reason, /report/)
  state = apply(state, { type: "task.set", ...env(), id: "one", rev: 2, note: "presentation-only result note" })
  assert.equal(workSignals(state, "master").find((signal) => signal.key === "run-results-ready")?.basis, ready.basis)
  state = apply(state, { type: "task.reopen", ...env("B"), id: "two", rev: 2, reason: "new user request" })
  assert.equal(workSignals(state, "master").some((signal) => signal.key === "run-results-ready"), false)
})

test("user wait and narrowed scope stay visible while unrelated work proceeds", () => {
  let state = apply(initial(), { ...add("question"), wait: { kind: "user", reason: "choose compatibility promise" } } as Command)
  state = apply(state, add("unrelated"))
  assert.ok(workSignals(state, "A").some((signal) => signal.key === "task:unrelated"))
  assert.ok(workSignals(state, "master").some((signal) => signal.key === "wait:question"))
  rejected(state, { type: "task.set", ...env(), id: "question", rev: 1, wait: null, note: "I infer the answer" }, /master/)
  state = apply(state, { ...save("compatibility-ruling", "master"), kind: "ruling", content: "User chose compatibility in current message" })
  state = apply(state, { type: "task.set", ...env("master"), id: "question", rev: 1, wait: null, resolution: { id: "compatibility-ruling", rev: 1 } })
  state = apply(state, { type: "scope.set", ...env("master"), rev: 1, mode: "check-in", source: "User authorized selected check-in" })
  state = apply(state, { ...add("commit"), permission: "check-in" } as Command)
  state = apply(state, { type: "scope.authorize", ...env("master"), id: "commit", rev: 1, scopeRev: 2, executor: "A", inputs: [], source: "Commit this selected result" })
  assert.equal(eligibility(state, taskById(state, "commit")!, "A", "start").allowed, true)
  state = apply(state, { type: "scope.set", ...env("master"), rev: 2, mode: "report-only", source: "User: stop edits, report only" })
  assert.equal(taskById(state, "commit")?.state, "open")
  assert.equal(eligibility(state, taskById(state, "commit")!, "A", "start").allowed, false)
  assert.ok(workSignals(state, "master").some((signal) => signal.key === "authority:commit"))
})

test("SQLite batches reject stale writes without partial records, events, or delivery versions", () => {
  const directory = mkdtempSync(join(tmpdir(), "coding-core-")), path = join(directory, "ledger.db")
  try {
    create(path, initial()); mutate(path, () => add("work"))
    const before = read(path)
    assert.throws(() => mutate(path, () => [save("orphan"), { type: "task.start", ...env(), id: "work", rev: 0 }]), /rev/)
    assert.deepEqual(read(path), before)
    mutate(path, () => ({ type: "task.set", ...env(), id: "work", rev: 1, note: "idle with same next action" }))
    assert.deepEqual(read(path).workVersions, before.workVersions)
    mutate(path, () => ({ type: "task.set", ...env(), id: "work", rev: 2, wait: { kind: "external", reason: "build service down" } }))
    mutate(path, () => ({ type: "task.set", ...env(), id: "work", rev: 3, wait: null }))
    assert.notEqual(read(path).workVersions.A?.["task:work"], before.workVersions.A?.["task:work"])
  } finally { rmSync(directory, { recursive: true, force: true }) }
})

test("old schema is rejected without changing original bytes", () => {
  const directory = mkdtempSync(join(tmpdir(), "coding-old-schema-")), path = join(directory, "ledger.db")
  try {
    const db = new DatabaseSync(path)
    db.exec("CREATE TABLE ledger(id INTEGER PRIMARY KEY,schema INTEGER,state TEXT); INSERT INTO ledger VALUES(1,9,'{}')"); db.close()
    const bytes = readFileSync(path)
    assert.throws(() => read(path), /pinned helper/)
    assert.throws(() => mutate(path, () => add("work")), /pinned helper/)
    assert.deepEqual(readFileSync(path), bytes)
  } finally { rmSync(directory, { recursive: true, force: true }) }
})

test("generated ownership/wait/scope interleavings agree with offered start and finish eligibility", () => {
  fc.assert(fc.property(fc.array(fc.constantFrom("release", "claimA", "claimB", "wait", "resume", "scope", "note"), { maxLength: 35 }), (actions) => {
    let state = apply(initial(), add("work")); state = apply(state, save("result"))
    for (const action of actions) {
      const task = taskById(state, "work")!
      let command: Command
      if (action === "release") command = { type: "task.release", ...env("master"), id: task.id, rev: task.rev, note: "saved handoff", next: "continue" }
      else if (action === "claimA" || action === "claimB") command = { type: "task.claim", ...env("master"), id: task.id, rev: task.rev, owner: action === "claimA" ? "A" : "B" }
      else if (action === "scope") command = { type: "scope.set", ...env("master"), rev: state.scope.rev, mode: state.scope.mode === "fix" ? "report-only" : "fix", source: "explicit user change" }
      else command = { type: "task.set", ...env("master"), id: task.id, rev: task.rev, ...(action === "wait" ? { wait: { kind: "external" as const, reason: "dependency service" } } : action === "resume" ? { wait: null } : { note: "handoff state" }) }
      const result = transition(state, command)
      if (result.ok) state = result.state
      for (const actor of ["A", "B", "master"]) {
        const current = taskById(state, "work")!
        assert.equal(transition(state, { type: "task.start", ...env(actor), id: current.id, rev: current.rev }).ok, eligibility(state, current, actor, "start").allowed)
        assert.equal(transition(state, { type: "task.finish", ...env(actor), id: current.id, rev: current.rev, result: { id: "result", rev: 1 } }).ok, eligibility(state, current, actor, "finish").allowed)
      }
    }
  }), { numRuns: 100 })
})
