import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { spawnSync } from "node:child_process"
import { DatabaseSync } from "node:sqlite"
import test from "node:test"
import { read } from "../src/store.ts"

const source = resolve("ledger.ts")
function fixture(scope = "fix") {
  const directory = mkdtempSync(join(tmpdir(), "coding-task-cli-"))
  const cli = (actor: string, args: readonly string[], expected = 0) => {
    const result = spawnSync(process.execPath, ["--no-warnings", source, ...args], {
      env: { ...process.env, LEDGER_DIR: directory, LEDGER_ME: actor, HERDR_ENV: "0" }, encoding: "utf8",
    })
    assert.equal(result.status, expected, result.stdout + result.stderr)
    return result.stdout + result.stderr
  }
  cli("master", ["init", "goal=fixture outcomes", "source=user requested fixture", "scope=" + scope, 'names={"master":"master","A":"alice","B":"bob"}'])
  const snapshot = () => read(join(directory, "ledger.db"))
  return { directory, cli, snapshot }
}
const add = (id: string, ...extra: string[]) => ["task", "add", id, "title=" + id, "outcome=retain useful result", "next=inspect evidence", ...extra]

test("checkout wait uses current availability without clearing real external or user waits", () => {
  const { cli, snapshot } = fixture()
  cli("B", ["checkout", "take", "rev=0", "purpose=shared build"])
  cli("A", add("write-batch", "permission=write", "wait=checkout", "waitReason=apply the reviewed change"))
  cli("A", add("external-result", "wait=external", "waitReason=await the actual provider result"))
  cli("A", add("user-choice", "wait=user", "waitReason=change the product promise"))
  cli("A", add("independent-read"))
  assert.match(cli("A", ["status", "write-batch"]), /waiting on checkout/)
  assert.match(cli("A", ["task", "start", "write-batch", "rev=1"], 1), /waiting on checkout/)
  cli("A", ["task", "start", "independent-read", "rev=1"])
  cli("B", ["checkout", "release", "rev=1", "reason=build finished and inputs retained"])
  const status = cli("A", ["status"])
  assert.match(status, /task:write-batch/)
  assert.doesNotMatch(status, /waiting on checkout/)
  assert.match(status, /waiting on external/)
  assert.match(status, /waiting on user/)
  assert.equal(snapshot().state.checkout, null)
  cli("A", ["task", "start", "write-batch", "rev=1"])
  assert.match(cli("A", ["task", "start", "external-result", "rev=1"], 1), /waiting on external/)
  assert.match(cli("A", ["task", "start", "user-choice", "rev=1"], 1), /waiting on user/)
})

test("mutation receipts return current identifiers without dumping unrelated investigation state", () => {
  const { cli } = fixture()
  cli("A", add("unrelated"))
  const added = cli("B", add("current"))
  assert.match(added, /current @1/)
  assert.doesNotMatch(added, /unrelated|Attention for|Investigation:/)
  const recorded = cli("B", ["record", "save", "observations", "rev=0", "kind=evidence", "title=Current evidence", "content=retained observation"])
  assert.match(recorded, /observations@1/)
  const published = cli("B", ["task", "publish", "current", "rev=1", "disposition=done", "result=observations@1"])
  assert.match(published, /current @2/)
  assert.match(published, /observations@1/)
  assert.doesNotMatch(published, /unrelated|Attention for|Investigation:/)
  assert.match(cli("B", ["status"]), /unrelated/)
})

test("resumed owner publishes a version comparison and peer agreement reaches master", () => {
  const { cli, snapshot } = fixture()
  cli("A", add("compare"))
  cli("A", ["task", "start", "compare", "rev=1"])
  cli("A", ["task", "release", "compare", "rev=2", "note=baseline retained", "next=compare candidate"])
  cli("B", ["task", "claim", "compare", "rev=3"])
  assert.equal(snapshot().state.tasks[0]!.started, false)
  cli("B", ["task", "start", "compare", "rev=4"])
  cli("A", ["record", "save", "measurement", "rev=0", "kind=evidence", "title=baseline", "content=fixture baseline 10 seconds"])
  cli("B", ["record", "save", "measurement", "rev=1", "kind=evidence", "title=candidate", "content=fixture candidate 1 second"])
  const before = snapshot()
  assert.match(cli("B", ["record", "save", "duplicate", "rev=0", "kind=validation", "title=comparison", "content=invalid repeated ref", "inputs=measurement@1,measurement@1"], 1), /references must be unique/)
  assert.deepEqual(snapshot(), before)
  cli("B", ["record", "save", "comparison", "rev=0", "kind=validation", "title=comparison", "content=fixture observations show improvement", "inputs=measurement@1,measurement@2"])
  cli("B", ["task", "publish", "compare", "rev=5", "disposition=done", "result=comparison@1"])
  assert.deepEqual(snapshot().state.tasks[0]!.conclusion!.agreedBy, ["B"])
  cli("master", ["task", "ack", "compare", "rev=6"])
  assert.deepEqual(snapshot().state.tasks[0]!.conclusion!.agreedBy, ["B"])
  cli("A", ["task", "agree", "compare", "rev=6"])
  const state = snapshot().state
  assert.deepEqual(state.records.at(-1)!.inputs, [{ id: "measurement", rev: 1 }, { id: "measurement", rev: 2 }])
  assert.deepEqual(state.tasks[0]!.conclusion!.agreedBy, ["B", "A"])
  assert.ok(state.tasks[0]!.attention > state.tasks[0]!.acknowledged)
  assert.match(cli("master", ["status"]), /run-results-ready/)
})

test("dispatch lookup recovers exact execution identity without mutation or runtime access", () => {
  const { cli, snapshot } = fixture()
  cli("A", add("reader"))
  cli("A", ["record", "save", "reader", "rev=0", "kind=evidence", "title=same id", "content=distinct namespace"])
  cli("A", ["dispatch", "reserve", "reader", "task=reader", "taskRev=1", "inspectAfter=2099-01-01T00:00:00Z"])
  const reserved = JSON.parse(cli("A", ["dispatch", "show", "reader"]))
  assert.equal(reserved.rev, 1)
  assert.equal(reserved.worker, null)
  const worker = { name: "fresh-child", pane: "exact-pane", session: "exact-session" }
  cli("A", ["dispatch", "update", "reader", `rev=${reserved.rev}`, "state=running", "observation=spawn confirmed", "worker=" + JSON.stringify(worker)])
  const before = snapshot()
  const execution = JSON.parse(cli("A", ["dispatch", "show", "reader"]))
  assert.equal(execution.rev, 2)
  assert.deepEqual(execution.worker, worker)
  assert.equal(execution.observations.at(-1).detail, "spawn confirmed")
  assert.match(cli("master", ["report"]), /\| Dispatch \| Rev \|/)
  assert.match(cli("A", ["dispatch", "show", "missing"], 1), /no dispatch missing/)
  assert.match(cli("A", ["dispatch", "show", "reader", "rev=1"], 1), /exactly one id/)
  assert.match(cli("A", ["dispatch", "show"], 1), /exactly one id/)
  assert.match(cli("unknown", ["dispatch", "show", "reader"], 1), /unknown actor/)
  assert.deepEqual(snapshot(), before)
  cli("A", ["dispatch", "update", "reader", `rev=${execution.rev}`, "state=finished", "observation=read identity and confirmed completion"])
  assert.equal(snapshot().state.dispatches[0]!.state, "finished")
})

test("non-pane child handles remain inspectable without weakening identity or ownership", () => {
  const { cli, snapshot } = fixture()
  cli("A", add("local-reader"))
  cli("A", ["dispatch", "reserve", "local-child", "task=local-reader", "taskRev=1", "inspectAfter=2099-01-01T00:00:00Z"])
  const worker = { name: "/root/independent-reader", pane: null, session: null }
  cli("A", ["dispatch", "update", "local-child", "rev=1", "state=running", "observation=runtime returned child handle", "worker=" + JSON.stringify(worker)])
  assert.deepEqual(JSON.parse(cli("A", ["dispatch", "show", "local-child"])).worker, worker)
  const before = snapshot()
  for (const invalid of [{ ...worker, name: "" }, { ...worker, pane: "" }, { name: worker.name, session: null }]) {
    cli("A", ["dispatch", "update", "local-child", "rev=2", "state=running", "observation=invalid identity", "worker=" + JSON.stringify(invalid)], 1)
  }
  assert.match(cli("A", ["dispatch", "update", "local-child", "rev=2", "state=running", "observation=different execution", "worker=" + JSON.stringify({ ...worker, name: "/root/replacement" })], 1), /identity cannot change/)
  assert.match(cli("B", ["dispatch", "update", "local-child", "rev=2", "state=finished", "observation=not the parent"], 1), /only dispatch parent or master/)
  assert.match(cli("master", ["task", "claim", "local-reader", "rev=1", "owner=B"], 1), /active dispatch/)
  assert.deepEqual(snapshot(), before)
  cli("A", ["dispatch", "update", "local-child", "rev=2", "state=finished", "observation=returned result confirmed through the same runtime"])
  assert.deepEqual(snapshot().state.dispatches[0]!.worker, worker)
  assert.equal(snapshot().state.tasks[0]!.state, "open")
})

test("actual CLI retains and publishes a file atomically using pinned helper", () => {
  const { directory, cli, snapshot } = fixture()
  assert.equal(existsSync(join(directory, "bin", "test")), false)
  assert.equal(existsSync(join(directory, "bin", "node_modules")), false)
  cli("A", add("investigate"))
  const output = cli("A", ["task", "publish", "investigate", "rev=1", "disposition=done", "file=" + source])
  assert.match(output, /Task investigate @2: done/)
  const record = snapshot().state.records[0]!
  assert.deepEqual(readFileSync(join(directory, record.path)), readFileSync(source))
  assert.equal(snapshot().state.tasks[0]!.conclusion?.record.id, record.id)
  const pinned = spawnSync(process.execPath, ["--no-warnings", join(directory, "bin/ledger.ts"), "report"], { env: { ...process.env, LEDGER_DIR: directory, LEDGER_ME: "A" }, encoding: "utf8" })
  assert.equal(pinned.status, 0, pinned.stderr)
  assert.match(pinned.stdout, /not a machine proof of correctness/)
})

test("stale file publication rolls back record and events; original task stays open", () => {
  const { cli, snapshot } = fixture()
  cli("A", add("one"))
  const before = snapshot()
  assert.match(cli("A", ["task", "publish", "one", "rev=0", "disposition=done", "file=" + source], 1), /read rev 0/)
  assert.deepEqual(snapshot(), before)
})

test("release precedes successor claim and preserves evidence without acknowledgment", () => {
  const { cli, snapshot } = fixture()
  cli("A", add("one"))
  cli("A", ["record", "save", "candidate", "rev=0", "kind=candidate", "title=saved shape", "file=" + source])
  cli("A", ["task", "release", "one", "rev=1", "note=candidate retained", "next=validate candidate"])
  assert.equal(snapshot().state.tasks[0]!.owner, null)
  assert.match(cli("A", ["status"]), /unassigned/)
  cli("B", ["task", "claim", "one", "rev=2"])
  assert.equal(snapshot().state.tasks[0]!.owner, "B")
  assert.equal(snapshot().state.records.length, 1)
})

test("user wait leaves independent work available and only master can resolve", () => {
  const { cli, snapshot } = fixture()
  cli("A", add("choice", "wait=user", "waitReason=feature behavior decision"))
  cli("A", add("independent"))
  const beforeRuling = snapshot()
  assert.match(cli("master", ["task", "set", "choice", "rev=1", "wait=none", "note=user chose current capture"], 1), /exact retained ruling/)
  assert.match(cli("master", ["task", "set", "choice", "rev=1", "wait=none", "resolution=user chose current capture"], 1), /expected id@positive-revision/)
  assert.deepEqual(snapshot(), beforeRuling)
  cli("master", ["record", "save", "choice-ruling", "rev=0", "kind=ruling", "title=User choice", "content=User chose current capture in message"])
  assert.match(cli("A", ["task", "set", "choice", "rev=1", "wait=none", "resolution=choice-ruling@1"], 1), /only master/)
  cli("A", ["task", "start", "independent", "rev=1"])
  cli("master", ["task", "set", "choice", "rev=1", "wait=none", "resolution=choice-ruling@1"])
  assert.equal(snapshot().state.tasks[0]!.wait, null)
  assert.deepEqual(snapshot().state.tasks[0]!.inputs, [{ id: "choice-ruling", rev: 1 }])
  assert.equal(snapshot().state.tasks[0]!.version, 2)
})

test("review conditions stay ordinary evidence; material republication resets peer assent", () => {
  const { cli, snapshot } = fixture()
  cli("A", ["record", "save", "candidate", "rev=0", "kind=candidate", "title=patch", "file=" + source])
  cli("B", add("review", "inputs=candidate@1"))
  cli("B", ["record", "save", "assessment", "rev=0", "kind=assessment", "title=conditions", "content=distinguish field and executed addresses", "inputs=candidate@1"])
  assert.equal(snapshot().state.tasks[0]!.conclusion, null, "saving an assessment is not a conclusion")
  cli("B", ["task", "publish", "review", "rev=1", "disposition=stopped", "result=assessment@1"])
  cli("A", ["task", "agree", "review", "rev=2"])
  cli("A", ["record", "save", "candidate", "rev=1", "kind=candidate", "title=corrected comment", "content=corrected patch"])
  cli("B", ["record", "save", "assessment", "rev=1", "kind=assessment", "title=corrected evidence", "content=executed and field addresses now distinguished", "inputs=candidate@2"])
  cli("B", ["task", "publish", "review", "rev=3", "disposition=done", "result=assessment@2"])
  assert.deepEqual(snapshot().state.tasks[0]!.conclusion!.agreedBy, ["B"])
  assert.match(cli("master", ["report"]), /awaiting A/)
  assert.equal(snapshot().state.records.filter((record) => record.id === "assessment").length, 2)
})

test("child execution supplies retained evidence but does not substitute peer assent", () => {
  const { cli, snapshot } = fixture()
  cli("A", ["record", "save", "candidate", "rev=0", "kind=candidate", "title=patch", "content=implementation"])
  cli("A", add("fresh", "inputs=candidate@1"))
  cli("A", ["dispatch", "reserve", "reader", "task=fresh", "taskRev=1", "inspectAfter=2099-01-01T00:00:00Z"])
  cli("A", ["dispatch", "update", "reader", "rev=1", "state=finished", "observation=child returned assessment", 'worker={"name":"fresh-child","pane":"test-pane","session":"test-session"}'])
  cli("A", ["record", "save", "assessment", "rev=0", "kind=assessment", "title=child report", "content=fresh-child checked candidate@1; evidence in child transcript", "inputs=candidate@1"])
  cli("A", ["task", "publish", "fresh", "rev=1", "disposition=done", "result=assessment@1"])
  assert.equal(snapshot().state.dispatches[0]!.worker!.name, "fresh-child")
  assert.deepEqual(snapshot().state.tasks[0]!.conclusion!.agreedBy, ["A"])
  assert.match(cli("B", ["status"]), /agree:fresh/)
})

test("scope narrowing retains implementation as blocked work and restoration needs no extra authorization", () => {
  const { cli } = fixture()
  cli("A", ["record", "save", "candidate", "rev=0", "kind=candidate", "title=patch", "content=implementation"])
  cli("A", add("fix", "permission=write", "inputs=candidate@1"))
  cli("master", ["scope", "set", "rev=1", "mode=report-only", "source=user paused implementation"])
  assert.match(cli("A", ["task", "start", "fix", "rev=1"], 1), /scope/)
  assert.match(cli("master", ["status"]), /fix/)
  cli("master", ["scope", "set", "rev=2", "mode=fix", "source=user resumed implementation"])
  cli("A", ["task", "start", "fix", "rev=1"])
})

test("ordinary invalid options have no mutation and old schema refuses without migration", () => {
  const { cli, directory, snapshot } = fixture()
  const before = snapshot()
  assert.match(cli("A", add("one", "typo=value"), 1), /invalid or duplicate/)
  assert.deepEqual(snapshot(), before)
  const database = new DatabaseSync(join(directory, "ledger.db"))
  database.exec("UPDATE ledger SET schema=10")
  database.close()
  assert.match(cli("master", ["status"], 1), /pinned helper/)
})

test("report retains cancellation reason and checkout; invalid show and claim refuse", () => {
  const { cli, snapshot } = fixture()
  cli("A", add("one"))
  cli("A", ["task", "publish", "one", "rev=1", "disposition=done", "file=" + source])
  cli("A", ["record", "save", "drop", "rev=0", "kind=conclusion", "title=user decision", "content=user dropped this result"])
  cli("A", ["task", "publish", "one", "rev=2", "disposition=cancelled", "result=drop@1"])
  cli("A", ["checkout", "take", "rev=0", "purpose=preserve pending candidate"])
  const report = cli("master", ["report"])
  assert.match(report, /user dropped this result/)
  assert.match(report, /Checkout: A — preserve pending candidate/)
  assert.match(cli("A", ["show", "one", "rev=999"], 1), /no record revision/)
  cli("A", add("two"))
  const before = snapshot()
  assert.match(cli("A", ["task", "claim", "two", "rev=1", "owner=none"], 1), /use task release/)
  assert.deepEqual(snapshot(), before)
})

test("status renders nested replacements and shared children without duplicating investigation", () => {
  const { cli, snapshot } = fixture()
  for (const id of ["root", "left", "right", "shared"]) cli("A", add(id))
  const replace = (id: string, children: string) => {
    cli("A", ["record", "save", id + "-argument", "rev=0", "kind=conclusion", "title=replacement", "content=These continuing issues account for the original concern; no successful fix is implied"])
    cli("A", ["task", "publish", id, "rev=1", "disposition=replaced", "result=" + id + "-argument@1", "children=" + children])
    cli("B", ["task", "agree", id, "rev=2"])
  }
  replace("root", "left,right")
  replace("left", "shared")
  replace("right", "shared")
  const before = snapshot()
  const status = cli("A", ["status", "root"])
  assert.match(status, /^- root @3: root — replaced; agreed by A, B/m)
  assert.match(status, /^  - left @3:/m)
  assert.match(status, /^    - shared @1: shared — assigned/m)
  assert.match(status, /^  - right @3:/m)
  assert.match(status, /^    - ↳ shared — shared issue; shown above/m)
  assert.equal((status.match(/shared @1:/g) ?? []).length, 1)
  assert.match(status, /1 open, 3 published conclusions, 3 agreed/)
  assert.match(status, /Replaced is not fixed/)
  assert.doesNotMatch(status, /all conclusions and replacements have investigator agreement/)
  assert.match(cli("A", ["status", "missing"], 1), /no task missing/)
  assert.deepEqual(snapshot(), before, "nested inspection is read-only")
})

test("retention writes exactly the bytes hashed even when source changes between read and save", () => {
  const { directory, snapshot } = fixture()
  const evidence = join(directory, "mutable.txt")
  writeFileSync(evidence, "first observation")
  const injection = `import fs from 'node:fs'; import {syncBuiltinESMExports} from 'node:module';
const original = fs.readFileSync;
fs.readFileSync = function(path, ...args) {
 const bytes = original.call(this, path, ...args);
 if (path === process.env.RACE_SOURCE) fs.writeFileSync(path, 'later observation');
 return bytes;
}; syncBuiltinESMExports();`
  const result = spawnSync(process.execPath, ["--no-warnings", "--import", "data:text/javascript," + encodeURIComponent(injection), source, "record", "save", "evidence", "rev=0", "kind=evidence", "title=observation", "file=" + evidence], { env: { ...process.env, LEDGER_DIR: directory, LEDGER_ME: "A", RACE_SOURCE: evidence }, encoding: "utf8" })
  assert.equal(result.status, 0, result.stderr)
  const record = snapshot().state.records[0]!
  const manifest = JSON.parse(record.content) as { sha256: string }
  const bytes = readFileSync(join(directory, record.path))
  assert.equal(bytes.toString(), "first observation")
  assert.equal(createHash("sha256").update(bytes).digest("hex"), manifest.sha256)
})
