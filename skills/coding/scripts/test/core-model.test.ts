import assert from "node:assert/strict"
import { test } from "node:test"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { DatabaseSync } from "node:sqlite"
import { taskById, type Command } from "../src/protocol.ts"
import { activeDispatch, eligibility, workSignals } from "../src/work.ts"
import { create, mutate, read } from "../src/store.ts"
import { at, env, initial, apply, add, save, publish, rejected } from "./domain-fixture.ts"

test("ownership coordinates action, never peer authority; checkout release is separate", () => {
  let state = apply(initial(), add("work"))
  state = apply(state, save("argument"))
  state = apply(state, { type: "checkout.take", ...env(), rev: 0, purpose: "edit shared source" })
  state = publish(state, "work", "B")
  assert.equal(taskById(state, "work")!.owner, "A")
  assert.deepEqual(taskById(state, "work")!.conclusion!.agreedBy, ["B"])
  assert.equal(state.checkout?.holder, "A")
  rejected(state, { type: "checkout.take", ...env("B"), rev: 1, purpose: "timeout takeover" }, /held/)
  rejected(state, { type: "checkout.recover", ...env("master"), rev: 1, stopped: "", preserved: "patch" }, /writer stopped/)
  state = apply(state, { type: "checkout.recover", ...env("master"), rev: 1, stopped: "process exited", preserved: "patch and baseline" })
  assert.equal(state.checkout, null)
})

test("dispatch uncertainty blocks changes that would interfere; evidence and notes remain possible", () => {
  let state = apply(initial(), add("work")); state = apply(state, save("argument"))
  state = apply(state, { type: "dispatch.reserve", ...env(), id: "child", task: "work", taskRev: 1, inspectAfter: at })
  for (const command of [
    { type: "task.publish", ...env("B"), id: "work", rev: 1, result: { id: "argument", rev: 1 }, disposition: "done" },
    { type: "task.claim", ...env("master"), id: "work", rev: 1, owner: "B" },
    { type: "task.release", ...env(), id: "work", rev: 1, note: "retained", next: "continue" },
    { type: "task.set", ...env(), id: "work", rev: 1, outcome: "changed", reason: "new evidence" },
    { type: "task.set", ...env("B"), id: "work", rev: 1, wait: { kind: "user", reason: "new question" } },
    { type: "dispatch.reserve", ...env(), id: "duplicate", task: "work", taskRev: 1, inspectAfter: at }
  ] as Command[]) rejected(state, command, /active dispatch/)
  state = apply(state, { type: "task.set", ...env(), id: "work", rev: 1, note: "child may have launched" })
  state = apply(state, { type: "dispatch.update", ...env(), id: "child", rev: 1, state: "reserved", observation: "launch uncertain" })
  assert.ok(activeDispatch(state, "work"))
  state = apply(state, { type: "dispatch.update", ...env(), id: "child", rev: 2, state: "finished", worker: { name: "B", pane: "exact-pane", session: "exact-session" }, observation: "process completed; artifact retained" })
  assert.equal(state.tasks[0]!.conclusion, null)
  state = publish(state, "work", "B")
  assert.deepEqual(state.tasks[0]!.conclusion!.agreedBy, ["B"])
})

test("scope and exact check-in authorization gate execution, not reporting an impossible outcome", () => {
  let state = apply(initial(), { ...add("commit"), permission: "check-in" })
  state = apply(state, save("argument"))
  assert.equal(eligibility(state, state.tasks[0]!, "A", "start").allowed, false)
  state = apply(state, { type: "scope.set", ...env("master"), rev: 1, mode: "check-in", source: "user authorized selected check-in" })
  state = apply(state, { type: "scope.authorize", ...env("master"), id: "commit", rev: 1, scopeRev: 2, executor: "A", inputs: [], source: "user selected this candidate" })
  assert.equal(eligibility(state, state.tasks[0]!, "A", "start").allowed, true)
  state = apply(state, { type: "scope.set", ...env("master"), rev: 2, mode: "report-only", source: "user withdrew edit authority" })
  assert.ok(workSignals(state, "master").some((s) => s.key === "authority:commit"))
  state = publish(state, "commit", "B", "stopped")
  assert.equal(state.tasks[0]!.state, "stopped")
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

test("database setup failure closes its handle before returning to the caller", (context) => {
  const directory = mkdtempSync(join(tmpdir(), "coding-open-failure-")), path = join(directory, "ledger.db")
  const originalExec = DatabaseSync.prototype.exec
  const close = context.mock.method(DatabaseSync.prototype, "close")
  const exec = context.mock.method(DatabaseSync.prototype, "exec", function (this: DatabaseSync, sql: string) {
    if (sql === "PRAGMA busy_timeout=5000") throw new Error("injected setup failure")
    return originalExec.call(this, sql)
  })
  try {
    assert.throws(() => create(path, initial()), /injected setup failure/)
    assert.equal(close.mock.callCount(), 1)
    exec.mock.restore()
    create(path, initial())
    assert.equal(read(path).state.goal, initial().goal)
  } finally { rmSync(directory, { recursive: true, force: true }) }
})

test("old schema is rejected without changing original bytes", () => {
  const directory = mkdtempSync(join(tmpdir(), "coding-old-schema-")), path = join(directory, "ledger.db")
  try {
    const db = new DatabaseSync(path)
    db.exec("CREATE TABLE ledger(id INTEGER PRIMARY KEY,schema INTEGER,state TEXT); INSERT INTO ledger VALUES(1,10,'{}')"); db.close()
    const bytes = readFileSync(path)
    assert.throws(() => read(path), /pinned helper/)
    assert.throws(() => mutate(path, () => add("work")), /pinned helper/)
    assert.deepEqual(readFileSync(path), bytes)
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
