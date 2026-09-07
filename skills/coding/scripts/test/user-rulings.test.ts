import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { initialState, taskById, transition, type Command, type RecordRef, type State } from "../src/protocol.ts"
import { create, mutate, read } from "../src/store.ts"
import { eligibility, workSignals } from "../src/work.ts"

const at = "2026-09-08T00:00:00.000Z"
const initial = () => initialState({ goal: "Resolve user choices without losing their known dependents", names: { master: "manager", A: "alice", B: "bob" }, scope: "fix", source: "User requested implementation", at })
function apply(state: State, command: Command): State {
  const result = transition(state, command)
  assert.ok(result.ok, result.ok ? "" : result.error)
  return result.state
}
function record(id: string, actor = "master", kind = "ruling", rev = 0, inputs: readonly RecordRef[] = []): Command {
  return { type: "record.save", actor, at, id, rev, kind, title: id, content: `Retained user instruction/source ${id} revision ${rev + 1}`, inputs }
}
function waiting(state: State, inputs: readonly RecordRef[] = []): State {
  state = apply(state, { type: "task.add", actor: "A", at, id: "choice", title: "Choose format", outcome: "Implement the chosen format", next: "Implement after decision", inputs, wait: { kind: "user", reason: "Which format should we retain?" } })
  return apply(state, { type: "task.add", actor: "B", at, id: "consumer", title: "Consume chosen format", outcome: "Use chosen format", next: "Integrate chosen format", requires: [{ id: "choice", version: 1 }] })
}

test("user-wait resolution retains exact ruling and invalidates the explicitly linked dependent", () => {
  let state = apply(initial(), record("evidence", "A", "evidence"))
  state = apply(state, record("decision"))
  state = waiting(state, [{ id: "evidence", rev: 1 }, { id: "decision", rev: 1 }])
  state = apply(state, record("decision", "master", "ruling", 1))
  state = apply(state, { type: "task.set", actor: "master", at, id: "choice", rev: 1, wait: null, resolution: { id: "decision", rev: 2 } })
  const choice = taskById(state, "choice")!
  assert.equal(choice.wait, null)
  assert.equal(choice.version, 2)
  assert.deepEqual(choice.inputs, [{ id: "evidence", rev: 1 }, { id: "decision", rev: 2 }])
  assert.equal(eligibility(state, taskById(state, "consumer")!, "B", "start").allowed, false)
  assert.ok(workSignals(state, "B").some((signal) => signal.key === "reconcile:consumer"))
  assert.deepEqual(taskById(state, "consumer")!.requires, [{ id: "choice", version: 1 }])
})

test("prelinked ruling still advances material version when the user wait is resolved to an external wait", () => {
  let state = waiting(apply(initial(), record("decision")), [{ id: "decision", rev: 1 }])
  state = apply(state, { type: "task.set", actor: "master", at, id: "choice", rev: 1, wait: { kind: "external", reason: "Wait for selected provider account" }, resolution: { id: "decision", rev: 1 } })
  assert.equal(taskById(state, "choice")!.version, 2)
  assert.deepEqual(taskById(state, "choice")!.inputs, [{ id: "decision", rev: 1 }])
  assert.equal(taskById(state, "choice")!.wait?.kind, "external")
  assert.ok(workSignals(state, "B").some((signal) => signal.key === "reconcile:consumer"))
})

test("missing, guessed, non-ruling, worker-authored and historical resolutions refuse atomically", () => {
  let state = apply(initial(), record("current"))
  state = apply(state, record("evidence", "master", "evidence"))
  state = apply(state, record("worker-ruling", "A"))
  state = apply(state, record("old"))
  state = apply(state, record("old", "master", "ruling", 1))
  state = apply(state, record("premise", "A", "evidence"))
  state = apply(state, record("stale-premise-ruling", "master", "ruling", 0, [{ id: "premise", rev: 1 }]))
  state = apply(state, record("premise", "A", "evidence", 1))
  state = waiting(state)
  const directory = mkdtempSync(join(tmpdir(), "coding-ruling-")), path = join(directory, "ledger.db")
  try {
    create(path, state)
    const before = read(path)
    const cases: readonly { actor: string; resolution?: unknown; message: RegExp }[] = [
      { actor: "master", message: /exact retained ruling/ },
      { actor: "master", resolution: "User chose this", message: /exact retained ruling/ },
      { actor: "master", resolution: { id: "missing", rev: 1 }, message: /missing ruling/ },
      { actor: "master", resolution: { id: "evidence", rev: 1 }, message: /ruling recorded by master/ },
      { actor: "master", resolution: { id: "worker-ruling", rev: 1 }, message: /ruling recorded by master/ },
      { actor: "master", resolution: { id: "old", rev: 1 }, message: /historical/ },
      { actor: "master", resolution: { id: "stale-premise-ruling", rev: 1 }, message: /historical/ },
      { actor: "A", resolution: { id: "current", rev: 1 }, message: /only master/ },
    ]
    for (const { actor, resolution, message } of cases) {
      const command = { type: "task.set", actor, at, id: "choice", rev: 1, wait: null, note: "Free text cannot substitute for the ruling", ...(resolution === undefined ? {} : { resolution }) } as Command
      assert.throws(() => mutate(path, () => [record("would-be-partial-write"), command]), message)
      assert.deepEqual(read(path), before)
    }
  } finally { rmSync(directory, { recursive: true, force: true }) }
})

test("question clarification and ordinary external wait resolution do not manufacture a user ruling", () => {
  let state = waiting(initial())
  state = apply(state, { type: "task.set", actor: "A", at, id: "choice", rev: 1, wait: { kind: "user", reason: "Choose JSON or CSV for old clients" } })
  assert.equal(taskById(state, "choice")!.version, 1)
  assert.equal(taskById(state, "choice")!.wait?.kind, "user")
  state = apply(state, { type: "task.add", actor: "A", at, id: "build", title: "Build", outcome: "Validate code", next: "Run build", wait: { kind: "external", reason: "Build service offline" } })
  state = apply(state, { type: "task.set", actor: "A", at, id: "build", rev: 1, wait: null, note: "Service recovered" })
  assert.equal(taskById(state, "build")!.version, 1)
  assert.deepEqual(taskById(state, "build")!.inputs, [])
  assert.equal(eligibility(state, taskById(state, "build")!, "A", "start").allowed, true)
})
