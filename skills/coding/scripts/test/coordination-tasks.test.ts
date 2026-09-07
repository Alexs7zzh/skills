import assert from "node:assert/strict"
import { spawn, spawnSync } from "node:child_process"
import { once as eventOnce } from "node:events"
import { chmodSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import { test } from "node:test"
import { setTimeout as delay } from "node:timers/promises"
import { DatabaseSync } from "node:sqlite"
import { create, mutate, read } from "../src/store.ts"
import { initialState, type Command } from "../src/protocol.ts"

const AT = "2026-01-01T00:00:00.000Z"
const PAST = "2000-01-01T00:00:00.000Z"
const FUTURE = "2999-01-01T00:00:00.000Z"

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), "coding-coordinate-tasks-"))
  const ledger = join(directory, "ledger.db")
  const runtimePath = join(directory, "runtime.json")
  const callsPath = join(directory, "calls.jsonl")
  const executable = join(directory, "herdr")
  const entry = join(directory, "coordinate.mjs")
  const runtime = {
    mode: "accept",
    agents: ["author", "arranger", "lead"].map((name, index) => ({ name, pane_id: `pane-${index}`, agent_session: { agent: "codex", kind: "id", source: "herdr:codex", value: `session-${index}` }, agent_status: "working" })),
  }
  const saveRuntime = () => writeFileSync(runtimePath, JSON.stringify(runtime))
  saveRuntime()
  writeFileSync(executable, `#!${process.execPath}
const fs = require("node:fs");
const args = process.argv.slice(2);
const runtime = JSON.parse(fs.readFileSync(${JSON.stringify(runtimePath)}, "utf8"));
fs.appendFileSync(${JSON.stringify(callsPath)}, JSON.stringify(args) + "\\n");
if (runtime.mode === "denied") { console.error("fake runtime denied"); process.exit(7); }
if (args[0] === "agent" && args[1] === "list") console.log(JSON.stringify({result:{agents:runtime.agents}}));
else if (args[0] === "agent" && args[1] === "prompt") {
  if (runtime.mode === "crash") { process.kill(process.ppid, "SIGKILL"); process.exit(0); }
  if (runtime.mode === "ambiguous") { console.error("accepted then connection lost"); process.exit(7); }
  const agent = runtime.agents.find(agent => agent.pane_id === args[2]);
  const accepted = () => console.log(JSON.stringify({result:{type:"agent_prompted",agent:runtime.mode === "rebound" ? {...agent, agent_session:{...agent.agent_session,value:"replaced-during-prompt"}} : agent}}));
  if (runtime.mode === "hold") {
    fs.writeFileSync(${JSON.stringify(join(directory, "in-flight"))}, "reserved");
    const timer = setInterval(() => { if (fs.existsSync(${JSON.stringify(join(directory, "release"))})) { clearInterval(timer); accepted(); } }, 10);
  } else accepted();
} else { console.error("unexpected fake runtime command"); process.exit(9); }
`)
  chmodSync(executable, 0o755)
  writeFileSync(entry, `import { coordinate } from ${JSON.stringify(pathToFileURL(join(import.meta.dirname, "../src/coordinator.ts")).href)};
try { process.exitCode = await coordinate(${JSON.stringify(directory)}, process.argv.slice(2)); }
catch (error) { console.error(error.message); process.exitCode = 1; }
`)
  const environment = (actor: string) => ({ ...process.env, PATH: `${directory}:${process.env.PATH}`, LEDGER_ME: actor })
  const run = (actor: string, ...args: string[]) => spawnSync(process.execPath, ["--no-warnings", entry, ...args], { encoding: "utf8", env: environment(actor) })
  const start = (...args: string[]) => spawn(process.execPath, ["--no-warnings", entry, ...args], { stdio: "ignore", env: environment("master") })
  const ok = (...args: string[]) => {
    const result = run("master", ...args)
    assert.equal(result.status, 0, `${args.join(" ")}: ${result.stderr || result.stdout}`)
    return result.stdout
  }
  const snapshot = () => read(ledger)
  const command = (cmd: Command) => mutate(ledger, () => cmd)
  const calls = (): string[][] => existsSync(callsPath) ? readFileSync(callsPath, "utf8").trim().split("\n").map((line) => JSON.parse(line)) : []
  const prompts = () => calls().filter((args) => args[1] === "prompt")
  const bind = () => { for (const seat of ["Alice", "Bob", "master"]) ok("bind", `seat=${seat}`, "reason=fixture named runtime binding") }
  const resume = () => ok("resume", "reason=fixture work authorized")
  const once = () => ok("once")
  const idle = (...indexes: number[]) => { for (const index of indexes) runtime.agents[index]!.agent_status = "idle"; saveRuntime() }
  const state = initialState({ goal: "Coordinate explicit work", names: { Alice: "author", Bob: "arranger", master: "lead" }, scope: "fix", source: "fixture user request" })
  create(ledger, state, { at: AT, actor: "master", command: "init", row: "", note: "isolated fake runtime fixture" })
  const add = (id: string, owner: string | null = "Alice", permission: "read" | "write" = "read") => command({ type: "task.add", actor: "master", at: AT, id, title: id, outcome: `retained result for ${id}`, next: `inspect ${id}`, owner, permission })
  const task = (id: string) => snapshot().state.tasks.find((item) => item.id === id)!
  const deliver = (id: string) => {
    const assigned = task(id)
    assert.ok(assigned.owner)
    const result = `${id}-result`
    command({ type: "record.save", actor: assigned.owner, at: AT, id: result, rev: 0, kind: "evidence", title: `Result of ${id}`, content: "Fixture observation and its limitation retained", inputs: assigned.inputs })
    command({ type: "task.finish", actor: assigned.owner, at: AT, id, rev: assigned.rev, result: { id: result, rev: 1 } })
  }
  const reserve = (id = "child-check", inspectAfter = PAST) => {
    add("read-candidate", "Bob")
    command({ type: "dispatch.reserve", actor: "Bob", at: AT, id, task: "read-candidate", taskRev: task("read-candidate").rev, inspectAfter })
  }
  const updateDispatch = (state: "reserved" | "running" | "finished" | "stopped", inspectAfter = PAST) => {
    const dispatch = snapshot().state.dispatches[0]!
    command({ type: "dispatch.update", actor: "Bob", at: AT, id: dispatch.id, rev: dispatch.rev, state, inspectAfter, observation: `fake runtime observed child ${state}`, ...(state === "running" ? { worker: { name: "fresh-reader", pane: "child-pane", session: "child-session" } } : {}) })
  }
  return { directory, ledger, runtime, saveRuntime, run, start, ok, calls, prompts, bind, resume, once, idle, snapshot, command, add, task, deliver, reserve, updateDispatch }
}

function ageLatestAttempt(directory: string) {
  const db = new DatabaseSync(join(directory, "coordination.db"))
  try {
    db.exec("UPDATE control SET value=json_set(value, '$.attempts[#-1].at', '2000-01-01T00:00:00.000Z')")
  } finally { db.close() }
}

test("empty work and optional coordination status neither create obligations nor contact runtime", () => {
  const f = fixture()
  const before = f.snapshot()
  assert.match(f.ok("status"), /paused/)
  assert.equal(existsSync(join(f.directory, "coordination.db")), false)
  assert.deepEqual(f.calls(), [])
  f.bind(); f.resume(); f.idle(0, 1, 2)
  f.once(); f.once()
  assert.deepEqual(f.prompts(), [])
  assert.deepEqual(f.snapshot(), before)
})

test("invalid commands and non-master controls do not contact runtime or create coordination state", () => {
  const f = fixture()
  for (const args of [["resume"], ["once", "unknown=value"], ["bind", "seat=missing", "reason=test"], ["retry", "seat=Alice"], ["watch", "interval=1"]]) {
    assert.equal(f.run("master", ...args).status, 1)
  }
  for (const args of [["once"], ["watch"], ["resume", "reason=test"], ["pause", "reason=test"], ["bind", "seat=Alice", "reason=test"], ["retry", "seat=Alice", "checked=test"]]) {
    assert.equal(f.run("Alice", ...args).status, 1)
  }
  assert.equal(existsSync(join(f.directory, "coordination.db")), false)
  assert.deepEqual(f.calls(), [])
})

test("coordinator status tolerates a concurrent state transaction without contacting runtime", async () => {
  const f = fixture()
  f.bind()
  const calls = f.calls()
  const database = new DatabaseSync(join(f.directory, "coordination.db"))
  database.exec("BEGIN EXCLUSIVE")
  const status = f.start("status")
  const exited = eventOnce(status, "exit")
  try {
    await delay(200)
    assert.equal(status.exitCode, null)
  } finally {
    database.exec("COMMIT")
    database.close()
  }
  assert.deepEqual(await exited, [0, null])
  assert.deepEqual(f.calls(), calls)
})

test("only explicitly assigned eligible work wakes a worker, and busy workers pull without interruption", () => {
  const f = fixture()
  f.add("inspect-export")
  f.bind(); f.resume(); f.once()
  assert.deepEqual(f.prompts(), [])
  const before = f.snapshot()
  f.idle(0, 1, 2); f.once(); f.once()
  assert.equal(f.prompts().length, 1)
  assert.equal(f.prompts()[0]![2], "pane-0")
  assert.match(f.prompts()[0]![3]!, /recipient actor: Alice/)
  assert.deepEqual(f.snapshot(), before, "observation and delivery do not change domain facts")
})

test("optional unassigned work reaches master attention without waking every idle worker", () => {
  const f = fixture()
  f.add("possible-cleanup", null)
  f.bind(); f.resume(); f.idle(0, 1, 2); f.once(); f.once()
  assert.equal(f.prompts().length, 1)
  assert.equal(f.prompts()[0]![2], "pane-2")
  assert.match(f.prompts()[0]![3]!, /unassigned|owner/i)
  assert.equal(f.task("possible-cleanup").owner, null)
  f.command({ type: "task.set", actor: "master", at: AT, id: "possible-cleanup", rev: f.task("possible-cleanup").rev, note: "Evidence pointer retained for whoever claims this" })
  f.once()
  assert.equal(f.prompts().length, 1, "note-only bookkeeping does not renew optional-work attention")
})

test("notes do not complete work or renew its wake; explicit release changes who needs attention", () => {
  const f = fixture()
  f.add("inspect-export")
  f.bind(); f.resume(); f.idle(0, 1, 2); f.once()
  f.command({ type: "task.set", actor: "Alice", at: AT, id: "inspect-export", rev: f.task("inspect-export").rev, note: "I am idle; evidence is retained" })
  f.once()
  assert.equal(f.prompts().length, 1)
  assert.equal(f.task("inspect-export").state, "open")
  f.command({ type: "task.release", actor: "Alice", at: AT, id: "inspect-export", rev: f.task("inspect-export").rev, note: "Available for another owner", next: "Continue export inspection" })
  f.once()
  assert.equal(f.prompts().length, 2)
  assert.equal(f.prompts().at(-1)![2], "pane-2")
  assert.equal(f.task("inspect-export").owner, null)
})

test("an external wait resolved between observations renews eligible assigned work once", () => {
  const f = fixture()
  f.add("fix-export", "Alice", "write")
  f.bind(); f.resume(); f.idle(0); f.once()
  assert.equal(f.prompts().length, 1)
  f.command({ type: "task.set", actor: "Alice", at: AT, id: "fix-export", rev: f.task("fix-export").rev, wait: { kind: "external", reason: "Waiting for test service" } })
  f.command({ type: "task.set", actor: "Alice", at: AT, id: "fix-export", rev: f.task("fix-export").rev, wait: null })
  f.once(); f.once()
  assert.equal(f.prompts().length, 2)
  assert.equal(f.prompts().at(-1)![2], "pane-0")
})

test("checkout ownership does not assign or interrupt independent reading work", () => {
  const f = fixture()
  f.add("inspect-export")
  f.add("edit-other", "Bob", "write")
  f.bind(); f.resume(); f.idle(0, 2); f.once()
  assert.equal(f.prompts().length, 1)
  f.command({ type: "checkout.take", actor: "Bob", at: AT, rev: f.snapshot().state.checkoutRev, purpose: "Independent edit" })
  f.once()
  assert.equal(f.prompts().length, 1)
  assert.equal(f.snapshot().state.checkout?.holder, "Bob")
  assert.equal(f.task("inspect-export").owner, "Alice")
  f.command({ type: "checkout.release", actor: "Bob", at: AT, rev: f.snapshot().state.checkoutRev, reason: "Independent edit retained" })
  f.once()
  assert.equal(f.prompts().length, 1)
})

test("a user wait reaches master while its owner can do unrelated work", () => {
  const f = fixture()
  f.add("decide-export"); f.add("inspect-import")
  f.command({ type: "task.set", actor: "Alice", at: AT, id: "decide-export", rev: f.task("decide-export").rev, wait: { kind: "user", reason: "User must choose retained export format" } })
  f.bind(); f.resume(); f.idle(0, 1, 2); f.once(); f.once()
  assert.deepEqual(f.prompts().map((args) => args[2]).sort(), ["pane-0", "pane-2"])
  assert.match(f.prompts().find((args) => args[2] === "pane-0")![3]!, /inspect-import/)
  assert.match(f.prompts().find((args) => args[2] === "pane-2")![3]!, /retained export format/)
  assert.equal(f.task("decide-export").owner, "Alice")
})

test("external waits stay recorded without waking idle workers to poll", () => {
  const f = fixture()
  f.add("inspect-export")
  f.command({ type: "task.set", actor: "Alice", at: AT, id: "inspect-export", rev: f.task("inspect-export").rev, wait: { kind: "external", reason: "Build service is unavailable" } })
  f.bind(); f.resume(); f.idle(0, 1, 2); f.once(); f.once()
  assert.equal(f.prompts().length, 1, "master gets the retained wait once for reporting")
  assert.equal(f.prompts()[0]![2], "pane-2")
  assert.equal(f.task("inspect-export").owner, "Alice")
  assert.match(f.task("inspect-export").wait!.reason, /Build service/)
})

test("narrowed scope suspends the write commitment and brings its reconciliation to master", () => {
  const f = fixture()
  f.add("fix-export", "Alice", "write")
  f.command({ type: "scope.set", actor: "master", at: AT, rev: f.snapshot().state.scope.rev, mode: "report-only", source: "User: report findings, do not change code" })
  f.bind(); f.resume(); f.idle(0, 1, 2); f.once(); f.once()
  assert.equal(f.prompts().length, 1)
  assert.equal(f.prompts()[0]![2], "pane-2")
  assert.match(f.prompts()[0]![3]!, /scope|report-only/)
  assert.equal(f.task("fix-export").state, "open")
  assert.equal(f.task("fix-export").owner, "Alice")
})

test("overdue child inspection wakes its original parent once and keeps uncertain launch reserved", () => {
  const f = fixture()
  f.reserve()
  f.bind(); f.resume(); f.idle(0, 1, 2); f.once(); f.once()
  assert.equal(f.prompts().length, 1)
  assert.equal(f.prompts()[0]![2], "pane-1")
  assert.match(f.prompts()[0]![3]!, /unconfirmed launch.*child-check.*owned by Bob.*not proof of death or permission to replace/)
  assert.equal(f.snapshot().state.dispatches[0]!.state, "reserved")
  f.updateDispatch("running")
  f.once()
  assert.equal(f.prompts().length, 2, "a retained inspection update has its own identity")
  assert.equal(f.snapshot().state.dispatches.length, 1)
})

test("a healthy child suppresses only its task; its parent can receive unrelated work", () => {
  const f = fixture()
  f.reserve("child-check", FUTURE)
  f.updateDispatch("running", FUTURE)
  f.add("other-investigation", "Bob")
  f.bind(); f.resume(); f.idle(0, 1, 2); f.once()
  assert.equal(f.prompts().length, 1)
  assert.equal(f.prompts()[0]![2], "pane-1")
  assert.match(f.prompts()[0]![3]!, /other-investigation/)
  assert.doesNotMatch(f.prompts()[0]![3]!, /inspect child/)
})

test("a stopped child without a result returns work to its parent without replacing the child", () => {
  const f = fixture()
  f.reserve("child-check", FUTURE)
  f.updateDispatch("running", FUTURE)
  f.updateDispatch("stopped")
  f.bind(); f.resume(); f.idle(0, 1, 2); f.once()
  assert.equal(f.prompts().length, 1)
  assert.equal(f.prompts()[0]![2], "pane-1")
  assert.doesNotMatch(f.prompts()[0]![3]!, /inspect child/)
  assert.equal(f.task("read-candidate").state, "open")
  assert.equal(f.snapshot().state.dispatches.length, 1)
  assert.equal(f.snapshot().state.dispatches[0]!.state, "stopped")
})

test("an unavailable parent escalates a due child inspection to master, without replacing anyone", () => {
  const f = fixture()
  f.reserve()
  f.bind(); f.resume()
  f.runtime.agents[1]!.agent_status = "blocked"; f.idle(2)
  f.once(); f.once()
  assert.equal(f.prompts().length, 1)
  assert.equal(f.prompts()[0]![2], "pane-2")
  assert.match(f.prompts()[0]![3]!, /Bob: blocked/)
  assert.equal(f.snapshot().state.dispatches[0]!.parent, "Bob")
  assert.equal(f.snapshot().state.dispatches.length, 1)
})

test("inspecting a child before master becomes idle clears its obsolete runtime alert", () => {
  const f = fixture()
  f.reserve()
  f.bind(); f.resume()
  f.runtime.agents[1]!.agent_status = "blocked"; f.saveRuntime(); f.once()
  assert.equal(f.prompts().length, 0)
  f.updateDispatch("running", FUTURE)
  f.idle(2); f.once()
  assert.equal(f.prompts().length, 0)
  assert.doesNotMatch(f.ok("status"), /master attention required/)
})

test("accepted without observed activity gets a policy inspection, never an automatic resend", () => {
  const f = fixture()
  f.add("inspect-export")
  f.bind(); f.resume(); f.idle(0, 2); f.once(); f.once()
  assert.equal(f.prompts().length, 1, "acceptance by itself is not an immediate failure")
  ageLatestAttempt(f.directory)
  f.once(); f.once()
  assert.equal(f.prompts().length, 2)
  assert.equal(f.prompts()[1]![2], "pane-2")
  assert.match(f.prompts()[1]![3]!, /no observed activity.*one-minute policy checkpoint.*not evidence of death/)
  assert.equal(f.prompts().filter((args) => args[2] === "pane-0").length, 1)
  assert.equal(f.task("inspect-export").state, "open")
})

test("an activity inspection waits for an idle master and vanishes if the worker resumes", () => {
  const f = fixture()
  f.add("inspect-export")
  f.bind(); f.resume(); f.idle(0); f.once()
  ageLatestAttempt(f.directory)
  f.once()
  assert.equal(f.prompts().length, 1)
  f.runtime.agents[0]!.agent_status = "working"; f.idle(2); f.once()
  assert.equal(f.prompts().length, 1)
  assert.doesNotMatch(f.ok("status"), /master attention required/)
})

test("accepted activity followed by idle with unchanged work escalates only once", () => {
  const f = fixture()
  f.add("inspect-export")
  f.bind(); f.resume(); f.idle(0); f.once()
  f.runtime.agents[0]!.agent_status = "working"; f.saveRuntime(); f.once()
  f.idle(0, 2); f.once(); f.once()
  assert.equal(f.prompts().length, 2)
  assert.match(f.prompts()[1]![3]!, /Alice: stalled/)
  f.command({ type: "task.cancel", actor: "Alice", at: AT, id: "inspect-export", rev: f.task("inspect-export").rev, reason: "User cancelled this work" })
  f.once()
  assert.equal(f.prompts().length, 3, "terminal cancellation gives master a final reporting prompt")
  assert.equal(f.prompts().at(-1)![2], "pane-2")
  assert.doesNotMatch(f.ok("status"), /master attention required/)
})

test("the last terminal result wakes idle master once and subsequent notes do not repeat it", () => {
  const f = fixture()
  f.add("inspect-export"); f.add("inspect-import", "Bob")
  f.bind(); f.resume(); f.idle(2); f.once()
  assert.equal(f.prompts().length, 0)
  f.deliver("inspect-export"); f.once()
  assert.equal(f.prompts().length, 0, "one delivered result does not imply all recorded work is terminal")
  f.deliver("inspect-import"); f.idle(0, 1, 2); f.once(); f.once()
  assert.equal(f.prompts().length, 1)
  assert.equal(f.prompts()[0]![2], "pane-2")
  assert.match(f.prompts()[0]![3]!, /result|report/)
  f.command({ type: "task.set", actor: "Alice", at: AT, id: "inspect-export", rev: f.task("inspect-export").rev, note: "More context for the retained result" })
  f.once(); f.once()
  assert.equal(f.prompts().length, 1)
  assert.ok(f.snapshot().state.tasks.every((task) => task.state === "done"))
})

test("terminal results with a held checkout request release before the final reporting wake", () => {
  const f = fixture()
  f.add("inspect-export"); f.add("inspect-import", "Bob")
  f.command({ type: "checkout.take", actor: "Bob", at: AT, rev: f.snapshot().state.checkoutRev, purpose: "Inspect temporary candidate" })
  f.deliver("inspect-export"); f.deliver("inspect-import")
  f.bind(); f.resume(); f.idle(0, 1, 2); f.once(); f.once()
  assert.equal(f.prompts().length, 1)
  assert.equal(f.prompts()[0]![2], "pane-2")
  assert.match(f.prompts()[0]![3]!, /checkout still held/)
  f.command({ type: "checkout.release", actor: "Bob", at: AT, rev: f.snapshot().state.checkoutRev, reason: "Candidate retained and temporary work cleaned up" })
  f.once(); f.once()
  assert.equal(f.prompts().length, 2)
  assert.equal(f.prompts()[1]![2], "pane-2")
  assert.match(f.prompts()[1]![3]!, /result|report/)
  assert.doesNotMatch(f.prompts()[1]![3]!, /checkout still held/)
})

test("an active child and then its missing result prevent a premature final reporting wake", () => {
  const f = fixture()
  f.add("inspect-export"); f.reserve("child-check", FUTURE)
  f.updateDispatch("running", FUTURE)
  f.deliver("inspect-export")
  f.bind(); f.resume(); f.idle(0, 1, 2); f.once()
  assert.equal(f.prompts().length, 0)
  f.updateDispatch("finished")
  f.once()
  assert.equal(f.prompts().length, 1)
  assert.equal(f.prompts()[0]![2], "pane-1", "child exit returns the still-missing result to its parent")
  f.deliver("read-candidate"); f.once(); f.once()
  assert.equal(f.prompts().length, 2)
  assert.equal(f.prompts()[1]![2], "pane-2")
  assert.match(f.prompts()[1]![3]!, /result|report/)
})

test("paused state survives fresh processes and suppresses owned tasks and overdue inspections", () => {
  const f = fixture()
  f.add("inspect-export"); f.reserve()
  f.bind(); f.idle(0, 1, 2); f.once()
  assert.equal(f.prompts().length, 0)
  f.resume(); f.ok("pause", "reason=user stopped work"); f.once(); f.once()
  assert.equal(f.prompts().length, 0)
  assert.match(f.ok("status"), /paused; user stopped work/)
  f.resume(); f.once()
  assert.deepEqual(f.prompts().map((args) => args[2]).sort(), ["pane-0", "pane-1"])
})

test("runtime bindings require the exact pane and session, including the send acknowledgement", () => {
  for (const replacement of ["pane", "session"]) {
    const f = fixture()
    f.add("inspect-export")
    f.idle(0); f.resume(); f.once()
    assert.equal(f.prompts().length, 0)
    f.bind()
    if (replacement === "pane") f.runtime.agents[0]!.pane_id = "replacement-pane"
    else f.runtime.agents[0]!.agent_session.value = "replacement-session"
    f.saveRuntime(); f.once()
    assert.equal(f.prompts().length, 0, replacement)
    assert.match(f.ok("status"), /Alice:.*changed/)
    f.ok("bind", "seat=Alice", "reason=inspected replacement worker")
    f.runtime.mode = "rebound"; f.saveRuntime()
    assert.equal(f.run("master", "once").status, 2)
    assert.equal(f.prompts().length, 1)
    assert.match(f.ok("status"), /unconfirmed wake Alice/)
  }
})

test("ambiguous send survives restart and a checked retry retains its outcome and durable pause", () => {
  const f = fixture()
  f.add("inspect-export")
  f.bind(); f.resume(); f.idle(0)
  const before = f.snapshot()
  f.runtime.mode = "ambiguous"; f.saveRuntime()
  assert.equal(f.run("master", "once").status, 2)
  f.runtime.mode = "accept"; f.saveRuntime()
  assert.equal(f.run("master", "resume", "reason=transport restored").status, 1)
  assert.equal(f.run("master", "once").status, 2)
  assert.equal(f.prompts().length, 1)
  f.ok("retry", "seat=Alice", "checked=recipient confirmed no receipt and transport was inspected")
  assert.match(f.ok("status"), /last wake: unconfirmed/)
  f.once()
  assert.equal(f.prompts().length, 1, "retry permission does not clear the durable pause")
  f.resume(); f.once()
  assert.equal(f.prompts().length, 2)
  assert.deepEqual(f.snapshot(), before)
})

test("process death after wake reservation preserves uncertainty for inspection", () => {
  const f = fixture()
  f.add("inspect-export")
  f.bind(); f.resume(); f.idle(0)
  f.runtime.mode = "crash"; f.saveRuntime()
  assert.equal(f.run("master", "once").signal, "SIGKILL")
  assert.equal(f.prompts().length, 1)
  assert.match(f.ok("status"), /unconfirmed/)
  f.runtime.mode = "accept"; f.saveRuntime()
  assert.equal(f.run("master", "resume", "reason=inspected stopped watcher").status, 1)
  f.run("master", "once")
  assert.equal(f.prompts().length, 1)
})

test("runtime loss suppresses delivery while record mutations remain available", () => {
  const f = fixture()
  f.add("inspect-export")
  f.bind(); f.resume(); f.idle(0)
  f.runtime.mode = "denied"; f.saveRuntime(); f.once()
  assert.match(f.ok("status"), /unknown/)
  assert.deepEqual(f.prompts(), [])
  const calls = f.calls()
  f.add("continue-recording", "Bob")
  assert.deepEqual(f.calls(), calls)
  assert.equal(f.snapshot().state.tasks.length, 2)
})

test("pause during a send drains it, prevents later sends and excludes a competing watcher", async () => {
  const f = fixture()
  f.add("inspect-export"); f.add("inspect-import", "Bob")
  f.bind(); f.resume(); f.idle(0, 1)
  f.runtime.mode = "hold"; f.saveRuntime()
  const watcher = f.start("watch", "interval=250")
  const exited = eventOnce(watcher, "exit")
  let pauser: ReturnType<typeof f.start> | undefined
  let pauseExited: ReturnType<typeof eventOnce> | undefined
  try {
    const deadline = Date.now() + 5000
    while (!existsSync(join(f.directory, "in-flight")) && Date.now() < deadline) await delay(10)
    assert.equal(existsSync(join(f.directory, "in-flight")), true)
    assert.equal(f.run("master", "once").status, 1)
    assert.equal(f.run("master", "watch", "interval=250").status, 1)
    pauser = f.start("pause", "reason=user stopped agents during send")
    pauseExited = eventOnce(pauser, "exit")
    const pauseDeadline = Date.now() + 5000
    while (!/paused; user stopped agents/.test(f.ok("status")) && Date.now() < pauseDeadline) await delay(10)
    assert.match(f.ok("status"), /paused; user stopped agents/)
    assert.equal(pauser.exitCode, null, "pause does not claim stop before the in-flight send drains")
    writeFileSync(join(f.directory, "release"), "continue")
    assert.deepEqual(await pauseExited, [0, null])
    await delay(350)
    assert.equal(f.prompts().length, 1)
  } finally {
    writeFileSync(join(f.directory, "release"), "continue")
    if (pauser && pauser.exitCode === null) pauser.kill("SIGTERM")
    if (pauseExited) await pauseExited
    watcher.kill("SIGTERM")
    await exited
  }
  assert.match(f.ok("status"), /paused; user stopped agents/)
})
