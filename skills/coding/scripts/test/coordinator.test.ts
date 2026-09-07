import assert from "node:assert/strict"
import { spawn, spawnSync } from "node:child_process"
import { once as eventOnce } from "node:events"
import { chmodSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { setTimeout as delay } from "node:timers/promises"
import { DatabaseSync } from "node:sqlite"
import { deliveryOutcome, read } from "../src/store.ts"

const HELPER = join(import.meta.dirname, "..", "ledger.ts")
function fixture(cold = false) {
  const directory = mkdtempSync(join(tmpdir(), "ledger-coordinate-"))
  const runtimePath = join(directory, "runtime.json")
  const callsPath = join(directory, "calls.jsonl")
  const executable = join(directory, "herdr")
  for (const seat of ["A", "B"]) writeFileSync(join(directory, `${seat}-notes.md`), "passes: 1 sweeps, 1 lenses, 1 probes, 1 diff reviews\nretrospective: fixture\n## Goal closure\nFixture scope complete.\n## Domain scenarios\nFixture lifecycle checked.\n")
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
if (runtime.mode === "denied") { console.error("sandbox denied runtime access"); process.exit(7); }
if (args[0] === "agent" && args[1] === "list") console.log(JSON.stringify({result:{agents:runtime.agents}}));
else if (args[0] === "agent" && args[1] === "prompt") {
  if (runtime.mode === "crash") { process.kill(process.ppid, "SIGKILL"); process.exit(0); }
  if (runtime.mode === "ambiguous") { console.error("accepted then connection lost"); process.exit(7); }
  const agent = runtime.agents.find(agent => agent.pane_id === args[2]);
  const accepted = () => console.log(JSON.stringify({result:{type:"agent_prompted",agent}}));
  if (runtime.mode === "hold") {
    fs.writeFileSync(${JSON.stringify(join(directory, "in-flight"))}, "reserved");
    const timer = setInterval(() => { if (fs.existsSync(${JSON.stringify(join(directory, "release"))})) { clearInterval(timer); accepted(); } }, 10);
  } else accepted();
} else { console.error("unexpected fake runtime command"); process.exit(9); }
`)
  chmodSync(executable, 0o755)
  const run = (actor: string, ...args: string[]) => {
    const pinned = join(directory, "bin", "ledger.ts")
    return spawnSync(process.execPath, ["--no-warnings", existsSync(pinned) ? pinned : HELPER, ...args], {
      encoding: "utf8", env: { ...process.env, PATH: `${directory}:${process.env.PATH}`, LEDGER_DIR: directory, LEDGER_ME: actor, LEDGER_NOTIFY: "herdr agent prompt", HERDR_ENV: "1" },
    })
  }
  const start = (...args: string[]) => spawn(process.execPath, ["--no-warnings", join(directory, "bin", "ledger.ts"), ...args], {
    stdio: "ignore", env: { ...process.env, PATH: `${directory}:${process.env.PATH}`, LEDGER_DIR: directory, LEDGER_ME: "master", HERDR_ENV: "1" },
  })
  const ok = (actor: string, ...args: string[]) => {
    const result = run(actor, ...args)
    assert.equal(result.status, 0, `${args.join(" ")}: ${result.stderr || result.stdout}`)
    return result.stdout
  }
  ok("master", "init", "--joint", "--names", "A=author B=arranger master=lead")
  for (const seat of ["A", "B"]) { ok(seat, "init", "--cold"); if (!cold) ok(seat, "import") }
  const calls = (): string[][] => existsSync(callsPath) ? readFileSync(callsPath, "utf8").trim().split("\n").map(line => JSON.parse(line)) : []
  const prompts = () => calls().filter(args => args[1] === "prompt")
  const bind = () => { for (const seat of ["A", "B", "master"]) ok("master", "coordinate", "bind", `seat=${seat}`, "reason=dispatched named fixture role") }
  const resume = () => ok("master", "coordinate", "resume", "reason=fixture work authorized")
  const once = () => ok("master", "coordinate", "once")
  const snapshot = () => read(join(directory, "ledger.db"))
  const issue = (claim: string) => ok("A", "issue", "add", "label=Bug", "certainty=2", `claim=${claim}`, "site=draft.ts")
  const question = (question: string) => {
    issue(`decision needed: ${question}`)
    const id = snapshot().state.rows.at(-1)!.id
    return ok("A", "question", "add", `issues=${id}`, `question=${question}`, "options=keep,delete", "recommendation=keep", "effect=saved draft", "cost=one handler")
  }
  return { directory, runtime, saveRuntime, run, start, ok, calls, prompts, bind, resume, once, snapshot, issue, question }
}

test("recording succeeds when runtime is denied and performs no runtime call", () => {
  const f = fixture()
  f.runtime.mode = "denied"; f.saveRuntime()
  f.question("keep draft on cancel?")
  assert.equal(f.snapshot().state.rows.length, 2)
  assert.ok(f.snapshot().deliveries.length > 0)
  assert.ok(f.snapshot().deliveries.every(item => deliveryOutcome(item) === "pending"))
  f.ok("master", "status")
  assert.deepEqual(f.calls(), [])
})

test("coordinator status waits for a concurrent state write without contacting runtime", async () => {
  const f = fixture()
  f.bind()
  const calls = f.calls()
  const database = new DatabaseSync(join(f.directory, "coordination.db"))
  database.exec("BEGIN EXCLUSIVE")
  const status = f.start("coordinate", "status")
  const exited = eventOnce(status, "exit")
  try {
    await delay(250)
    assert.equal(status.exitCode, null, "a short coordinator write must not make status fail with SQLITE_BUSY")
  } finally {
    database.exec("COMMIT")
    database.close()
  }
  assert.deepEqual(await exited, [0, null])
  assert.deepEqual(f.calls(), calls)
})

test("working suppresses; idle coalesces pending notices without changing domain state or looping", () => {
  const f = fixture()
  f.question("keep draft on timeout?")
  f.question("keep draft on cancel?")
  f.bind(); f.resume(); f.once()
  assert.equal(f.prompts().length, 0)
  const before = f.snapshot()
  assert.ok(before.deliveries.filter(item => item.to === "master").length >= 2)
  f.runtime.agents[2]!.agent_status = "idle"; f.saveRuntime(); f.once()
  assert.equal(f.prompts().length, 1)
  assert.equal(f.prompts()[0]![2], "pane-2")
  assert.match(f.prompts()[0]![3]!, /shared.*ledger/)
  const after = f.snapshot()
  assert.deepEqual(after.state, before.state)
  assert.deepEqual(after.events, before.events)
  assert.ok(after.deliveries.filter(item => item.to === "master").every(item => deliveryOutcome(item) === "accepted"))
  f.once(); f.once()
  assert.equal(f.prompts().length, 1)
  f.runtime.agents[2]!.agent_status = "working"; f.saveRuntime(); f.once()
  f.runtime.agents[2]!.agent_status = "idle"; f.saveRuntime(); f.once()
  assert.equal(f.prompts().length, 1)
  assert.match(f.ok("master", "coordinate", "status"), /stalled/)
})

test("paused start and persisted pause suppress wakes across fresh CLI processes", () => {
  const f = fixture()
  f.runtime.agents[0]!.agent_status = "idle"; f.saveRuntime()
  f.bind(); f.once()
  assert.match(f.ok("master", "coordinate", "status"), /paused/)
  assert.equal(f.prompts().length, 0)
  f.resume()
  f.ok("master", "coordinate", "pause", "reason=user stopped workload")
  f.once(); f.once()
  assert.equal(f.prompts().length, 0)
  assert.match(f.ok("master", "coordinate", "status"), /paused; user stopped workload/)
  for (const args of [["once"], ["watch"], ["resume", "reason=attempt"], ["pause", "reason=attempt"], ["bind", "seat=A", "reason=attempt"], ["retry", "seat=A", "checked=attempt"]]) {
    assert.equal(f.run("A", "coordinate", ...args).status, 1)
  }
  f.resume(); f.once()
  assert.equal(f.prompts().length, 1)
  f.runtime.agents[0]!.pane_id = "replacement-pane"; f.runtime.agents[0]!.agent_session.value = "third-session"; f.saveRuntime(); f.once()
  assert.equal(f.prompts().length, 1, "a completed wake does not authorize sending to its replacement")
  f.ok("master", "coordinate", "bind", "seat=A", "reason=master dispatched third session")
  f.resume(); f.once()
  assert.equal(f.prompts().length, 2, "an explicitly bound replacement can receive unchanged work")
})

test("roles require explicit binding and a replacement session cannot inherit it", () => {
  const f = fixture()
  f.runtime.agents[0]!.agent_status = "idle"; f.saveRuntime()
  // A resume may require all roles bound, or leave unbound roles suppressed.
  f.run("master", "coordinate", "resume", "reason=work authorized")
  f.once()
  assert.equal(f.prompts().length, 0)
  f.bind(); f.resume()
  f.runtime.agents[0]!.agent_session.value = "replacement-session"; f.saveRuntime(); f.once()
  assert.equal(f.prompts().length, 0)
  assert.match(f.ok("master", "coordinate", "status"), /changed|replaced/)
  f.ok("master", "coordinate", "bind", "seat=A", "reason=master dispatched replacement session")
  f.resume(); f.once()
  assert.equal(f.prompts().length, 1)
})

test("unknown, blocked, missing and denied runtime states suppress delivery", () => {
  const f = fixture()
  f.bind(); f.resume()
  for (const status of ["unknown", "blocked", "waiting-for-input"]) {
    f.runtime.agents[0]!.agent_status = status; f.saveRuntime(); f.once()
    assert.equal(f.prompts().length, 0, status)
  }
  f.runtime.agents.shift(); f.saveRuntime(); f.once()
  assert.match(f.ok("master", "coordinate", "status"), /missing/)
  f.runtime.mode = "denied"; f.saveRuntime(); f.once()
  assert.match(f.ok("master", "coordinate", "status"), /unknown/)
  assert.equal(f.prompts().length, 0)
})

test("no eligible work suppresses idle reviewers; subsequent completed work permits a new handoff and report wake", () => {
  const f = fixture()
  f.bind(); f.resume()
  f.runtime.agents[0]!.agent_status = "idle"; f.saveRuntime(); f.once()
  assert.equal(f.prompts().length, 1, "A initially owes a handoff")
  f.ok("A", "handoff"); f.ok("B", "handoff")
  f.runtime.agents[1]!.agent_status = "idle"; f.saveRuntime(); f.once()
  assert.equal(f.prompts().length, 1, "idle reviewers with no eligible work receive no wake")
  f.runtime.agents[2]!.agent_status = "idle"; f.saveRuntime(); f.once()
  assert.equal(f.prompts().length, 2, "the completed run wakes master for its report")
  f.ok("A", "coverage", "add", "kind=scenario", "target=late scoped check", "state=covered", "note=completed newly requested check")
  f.once()
  assert.equal(f.prompts().length, 3, "new completed work creates another A handoff obligation")
  assert.equal(f.prompts().at(-1)![2], "pane-0")
  f.ok("A", "handoff"); f.once()
  assert.equal(f.prompts().length, 4, "changed completed work creates a new master report obligation")
  assert.equal(f.prompts().at(-1)![2], "pane-2")
})

test("checkout release renews the waiting author's work even when no poll saw the intervening hold", () => {
  const f = fixture()
  f.ok("A", "proposed-fix", "add", "goal=preserve draft", "shape=save draft", "origin=user goal", "sites=draft.ts", "rulings=retain input", "test=save then resume", "cost=one handler")
  f.bind(); f.resume()
  f.runtime.agents[0]!.agent_status = "idle"; f.saveRuntime(); f.once()
  assert.equal(f.prompts().length, 1)
  f.ok("B", "checkout", "take", "purpose=independent draft investigation")
  f.ok("B", "checkout", "release")
  f.once()
  assert.equal(f.prompts().length, 2, "a checkout blocked and released between observations creates a new opportunity")
  assert.equal(f.prompts().at(-1)![2], "pane-0")
  f.once()
  assert.equal(f.prompts().length, 2, "the renewed opportunity still sends only once")
})

test("private cold work wakes without sending shared conclusions or consuming shared notices", () => {
  const f = fixture(true)
  f.issue("PRIVATE_A_CONCLUSION")
  f.ok("A", "import")
  f.question("SHARED_A_DECISION")
  f.ok("B", "coverage", "add", "kind=scenario", "target=private remaining scope")
  f.bind(); f.resume()
  f.runtime.agents[1]!.agent_status = "done"; f.saveRuntime()
  const before = f.snapshot()
  assert.ok(before.deliveries.length > 0)
  f.once()
  assert.equal(f.prompts().length, 1)
  assert.match(f.prompts()[0]![3]!, /private cold/)
  assert.doesNotMatch(f.prompts()[0]![3]!, /PRIVATE_A_CONCLUSION|SHARED_A_DECISION/)
  assert.deepEqual(f.snapshot(), before)
})

test("ambiguous transport remains held after restart and resume cannot erase uncertainty", () => {
  const f = fixture()
  f.question("keep pending draft?")
  f.bind(); f.resume()
  f.runtime.agents[2]!.agent_status = "idle"; f.runtime.mode = "ambiguous"; f.saveRuntime()
  const before = f.snapshot()
  assert.equal(f.run("master", "coordinate", "once").status, 2)
  assert.equal(f.prompts().length, 1)
  assert.match(f.ok("master", "coordinate", "status"), /paused[\s\S]*unconfirmed/)
  assert.ok(f.snapshot().deliveries.some(item => deliveryOutcome(item) === "unconfirmed"))
  f.runtime.mode = "accept"; f.saveRuntime()
  f.run("master", "coordinate", "resume", "reason=transport restored")
  assert.equal(f.run("master", "coordinate", "once").status, 2)
  assert.equal(f.run("master", "coordinate", "once").status, 2)
  assert.equal(f.prompts().length, 1)
  assert.deepEqual(f.snapshot().state, before.state)
  assert.deepEqual(f.snapshot().events, before.events)
  assert.equal(f.run("master", "coordinate", "retry", "seat=master", "checked=transport inspection complete").status, 1, "unconfirmed intent must be reconciled first")
  for (const notice of f.snapshot().deliveries.filter(item => deliveryOutcome(item) === "unconfirmed")) {
    f.ok("master", "delivery", "supersede", notice.id, `rev=${notice.updates.length}`, "reason=recipient confirmed old attempt did not arrive; coordinator will send current work")
  }
  f.ok("master", "coordinate", "retry", "seat=master", "checked=recipient confirms no receipt and transport is restored")
  f.once()
  assert.equal(f.prompts().length, 1, "checked retry does not implicitly clear pause")
  f.resume(); f.once()
  assert.equal(f.prompts().length, 2)
  assert.deepEqual(f.snapshot().state, before.state)
  assert.deepEqual(f.snapshot().events, before.events)
})

test("process death after prompt reservation leaves a durable uncertain attempt", () => {
  const f = fixture()
  f.bind(); f.resume()
  f.runtime.agents[0]!.agent_status = "idle"; f.runtime.mode = "crash"; f.saveRuntime()
  assert.equal(f.run("master", "coordinate", "once").signal, "SIGKILL")
  assert.equal(f.prompts().length, 1)
  assert.match(f.ok("master", "coordinate", "status"), /unconfirmed/)
  f.runtime.mode = "accept"; f.saveRuntime()
  f.run("master", "coordinate", "resume", "reason=inspected crashed watcher")
  f.run("master", "coordinate", "once")
  assert.equal(f.prompts().length, 1)
})

test("pause during an in-flight watch tick prevents subsequent sends and survives watcher shutdown", async () => {
  const f = fixture()
  f.bind(); f.resume()
  f.runtime.agents[0]!.agent_status = "idle"
  f.runtime.agents[1]!.agent_status = "idle"
  f.runtime.mode = "hold"; f.saveRuntime()
  const watcher = f.start("coordinate", "watch", "interval=250")
  const exited = eventOnce(watcher, "exit")
  let pauser: ReturnType<typeof f.start> | undefined
  let pauseExited: ReturnType<typeof eventOnce> | undefined
  try {
    const deadline = Date.now() + 5000
    while (!existsSync(join(f.directory, "in-flight")) && Date.now() < deadline) await delay(10)
    assert.equal(existsSync(join(f.directory, "in-flight")), true, "watcher reaches the fake transport")
    assert.equal(f.run("master", "coordinate", "once").status, 1, "a competing coordinator cannot acquire the watcher's work")
    pauser = f.start("coordinate", "pause", "reason=user stopped agents while wake was in flight")
    pauseExited = eventOnce(pauser, "exit")
    const pauseDeadline = Date.now() + 5000
    while (!/paused; user stopped agents/.test(f.ok("master", "coordinate", "status")) && Date.now() < pauseDeadline) await delay(10)
    assert.match(f.ok("master", "coordinate", "status"), /paused; user stopped agents/)
    assert.equal(pauser.exitCode, null, "pause waits for the already reserved send to drain")
    writeFileSync(join(f.directory, "release"), "continue")
    assert.deepEqual(await pauseExited, [0, null], "pause confirms the stop only after the in-flight tick drains")
    await delay(350)
    assert.equal(f.prompts().length, 1, "the in-flight wake may finish, but B must not be prompted")
  } finally {
    writeFileSync(join(f.directory, "release"), "continue")
    if (pauser && pauser.exitCode === null) pauser.kill("SIGTERM")
    if (pauseExited) await pauseExited
    watcher.kill("SIGTERM")
    await exited
  }
  assert.match(f.ok("master", "coordinate", "status"), /paused; user stopped agents/)
  f.runtime.mode = "accept"; f.saveRuntime(); f.once()
  assert.equal(f.prompts().length, 1)
})
