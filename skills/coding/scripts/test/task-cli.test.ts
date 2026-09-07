import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs"
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

test("actual CLI retains a file and completes atomically using pinned helper", () => {
  const { directory, cli, snapshot } = fixture()
  cli("A", add("investigate"))
  const output = cli("A", ["task", "finish", "investigate", "rev=1", "file=" + source])
  assert.match(output, /0 open, 1 done/)
  const record = snapshot().state.records[0]!
  assert.deepEqual(readFileSync(join(directory, record.path)), readFileSync(source))
  assert.equal(snapshot().state.tasks[0]!.result?.id, record.id)
  const pinned = spawnSync(process.execPath, ["--no-warnings", join(directory, "bin/ledger.ts"), "report"], { env: { ...process.env, LEDGER_DIR: directory, LEDGER_ME: "A" }, encoding: "utf8" })
  assert.equal(pinned.status, 0, pinned.stderr)
  assert.match(pinned.stdout, /not a claim that all findings are resolved/)
})

test("stale file finish rolls back record and events; original task stays open", () => {
  const { cli, snapshot } = fixture()
  cli("A", add("one"))
  const before = snapshot()
  assert.match(cli("A", ["task", "finish", "one", "rev=0", "file=" + source], 1), /read rev 0/)
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

test("review conditions are retained, new candidate makes old assessment historical", () => {
  const { cli, snapshot } = fixture()
  cli("A", ["record", "save", "candidate", "rev=0", "kind=candidate", "title=patch", "file=" + source])
  cli("B", add("review", "review=candidate@1", "inputs=candidate@1"))
  cli("B", ["task", "finish", "review", "rev=1", "file=" + source, "verdict=conditions", "conditions=distinguish field and executed addresses"])
  assert.match(cli("master", ["report"]), /conditions/)
  cli("A", ["record", "save", "candidate", "rev=1", "kind=candidate", "title=corrected comment", "content=corrected patch"])
  assert.match(cli("master", ["report"]), /historical/)
  assert.equal(snapshot().state.tasks[0]!.state, "done")
})

test("same-parent fresh execution is distinct from artifact authorship", () => {
  const { cli, snapshot } = fixture()
  cli("A", ["record", "save", "candidate", "rev=0", "kind=candidate", "title=patch", "content=implementation"])
  cli("A", add("fresh", "review=candidate@1", "inputs=candidate@1"))
  cli("A", ["dispatch", "reserve", "reader", "task=fresh", "taskRev=1", "inspectAfter=2099-01-01T00:00:00Z"])
  cli("A", ["dispatch", "update", "reader", "rev=1", "state=finished", "observation=child returned assessment", 'worker={"name":"fresh-child","pane":"test-pane","session":"test-session"}'])
  cli("A", ["task", "finish", "fresh", "rev=1", "file=" + source, "verdict=clean", "dispatch=reader"])
  assert.deepEqual(snapshot().state.records.at(-1)!.authors, ["fresh-child"])
})

test("scope narrowing retains authorized check-in as blocked work", () => {
  const { cli } = fixture("check-in")
  cli("A", ["record", "save", "candidate", "rev=0", "kind=candidate", "title=patch", "content=implementation"])
  cli("A", add("commit", "permission=check-in", "inputs=candidate@1"))
  cli("master", ["scope", "authorize", "commit", "rev=1", "scopeRev=1", "executor=A", "inputs=candidate@1", "source=user selected exact patch"])
  cli("master", ["scope", "set", "rev=1", "mode=report-only", "source=user paused implementation"])
  assert.match(cli("A", ["task", "start", "commit", "rev=1"], 1), /scope/)
  assert.match(cli("master", ["status"]), /commit/)
})

test("ordinary invalid options have no mutation and old schema refuses without migration", () => {
  const { cli, directory, snapshot } = fixture()
  const before = snapshot()
  assert.match(cli("A", add("one", "typo=value"), 1), /invalid or duplicate/)
  assert.deepEqual(snapshot(), before)
  const database = new DatabaseSync(join(directory, "ledger.db"))
  database.exec("UPDATE ledger SET schema=9")
  database.close()
  assert.match(cli("master", ["status"], 1), /pinned helper/)
})

test("report retains cancellation reason and checkout; invalid show and claim refuse", () => {
  const { cli, snapshot } = fixture()
  cli("A", add("one"))
  cli("A", ["task", "finish", "one", "rev=1", "file=" + source])
  cli("A", ["task", "cancel", "one", "rev=2", "reason=user dropped this result"])
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
