import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { existsSync, mkdtempSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { spawnSync } from "node:child_process"
import { DatabaseSync } from "node:sqlite"
import test from "node:test"
import { activityCommand } from "../src/activity.ts"
import { buildInsights, readRuntimeAudit, renderInsights, type RuntimeAudit } from "../src/insights.ts"
import { initialState, type Command } from "../src/protocol.ts"
import { create, mutate, read } from "../src/store.ts"
const at = (minute: number) => new Date(Date.UTC(2026, 0, 1, 0, minute)).toISOString()
const absent: RuntimeAudit = { available: false, entries: [], lastObservation: null }
function fixture() {
  const directory = mkdtempSync(join(tmpdir(), "coding-insights-")), path = join(directory, "ledger.db")
  create(path, initialState({ goal: "timing", source: "fixture", scope: "fix", names: { master: "lead", A: "one", B: "two" }, at: at(0) }))
  const command = (input: Command) => mutate(path, () => input)
  const snapshot = () => read(path)
  const taskRev = (id: string) => snapshot().state.tasks.find((task) => task.id === id)!.rev
  const add = (id: string, minute = 0, actor = "A") => command({ type: "task.add", actor, at: at(minute), id, title: id, outcome: "explain", next: "inspect" })
  const wait = (id: string, minute: number, kind: "checkout" | "user" | "external") => command({ type: "task.set", actor: "A", at: at(minute), id, rev: taskRev(id), wait: { kind, reason: "recorded request" } })
  const take = (actor: string, minute: number) => command({ type: "checkout.take", actor, at: at(minute), rev: snapshot().state.checkoutRev, purpose: "preserve candidate" })
  const release = (actor: string, minute: number) => command({ type: "checkout.release", actor, at: at(minute), rev: snapshot().state.checkoutRev, reason: "finished" })
  const publish = (id: string, minute: number, rev = 0) => {
    command({ type: "record.save", actor: "A", at: at(minute), id: id + "-result", rev, kind: "conclusion", title: "result", content: "fixture" })
    command({ type: "task.publish", actor: "A", at: at(minute), id, rev: taskRev(id), disposition: "done", result: { id: id + "-result", rev: rev + 1 } })
  }
  const cli = (...args: string[]) => spawnSync(process.execPath, ["--no-warnings", resolve("ledger.ts"), ...args], { encoding: "utf8", env: { ...process.env, LEDGER_DIR: directory, LEDGER_ME: "A", HERDR_ENV: "0" } })
  return { directory, path, command, snapshot, taskRev, add, wait, take, release, publish, cli }
}

test("checkout requests across tasks are unioned and end at acquisition, not stale wait clearing", () => {
  const f = fixture(); f.add("first"); f.add("second"); f.take("B", 1)
  f.wait("first", 2, "checkout"); f.wait("second", 3, "checkout"); f.release("B", 4); f.take("A", 5)
  f.release("A", 8)
  f.command({ type: "task.set", actor: "A", at: at(9), id: "first", rev: f.taskRev("first"), wait: null })
  const report = buildInsights(f.snapshot(), absent, { until: at(10) })
  const a = report.actors.find((actor) => actor.actor === "A")!
  assert.equal(a.checkoutWaitMs, 3 * 60_000, "2–5 minutes, not 2–5 plus 3–5")
  assert.equal(a.checkoutMs, 3 * 60_000)
  assert.equal(report.spans.filter((span) => span.kind === "checkout-wait").length, 2)
  assert.ok(report.spans.filter((span) => span.kind === "checkout-wait").every((span) => span.endedAt === at(5)))
  assert.equal(a.declaredActivityMs, null)
  assert.equal(a.runtime?.unobservedMs, 10 * 60_000)
})

test("cutoffs preserve pending peer agreement and republishing resets only response latency", () => {
  const f = fixture(); f.add("claim"); f.publish("claim", 2)
  f.command({ type: "task.reopen", actor: "B", at: at(4), id: "claim", rev: f.taskRev("claim"), reason: "missing control" })
  f.publish("claim", 7, 1)
  f.command({ type: "task.agree", actor: "B", at: at(10), id: "claim", rev: f.taskRev("claim") })
  const early = buildInsights(f.snapshot(), absent, { until: at(8) })
  assert.equal(early.tasks[0]!.agreement, "awaiting peer")
  assert.equal(early.tasks[0]!.convergenceMs, null)
  assert.equal(early.tasks[0]!.publications, 2)
  assert.equal(early.tasks[0]!.reopenings, 1)
  const late = buildInsights(f.snapshot(), absent, { from: at(6), until: at(11) })
  assert.equal(late.tasks[0]!.convergenceMs, 8 * 60_000, "first publication 2 to final agreement 10")
  assert.equal(late.peerResponses[0]!.elapsedMs, 3 * 60_000)
  assert.equal(late.tasks[0]!.publications, 1, "counts are scoped to selected window")
  f.publish("claim", 12, 2)
  assert.equal(buildInsights(f.snapshot(), absent).tasks[0]!.agreement, "awaiting peer", "old assent does not survive new publication")
})

test("open user waits and checkout holds clip at the requested window without claiming completion", () => {
  const f = fixture(); f.add("decision"); f.wait("decision", 3, "user"); f.take("B", 4)
  const report = buildInsights(f.snapshot(), absent, { from: at(5), until: at(8) })
  assert.equal(report.spans.length, 2)
  assert.ok(report.spans.every((span) => span.open && span.durationMs === 3 * 60_000))
  assert.equal(report.tasks[0]!.agreement, "open")
  assert.throws(() => buildInsights(f.snapshot(), absent, { from: at(8), until: at(5) }), /until/)
  assert.throws(() => buildInsights(f.snapshot(), absent, { until: "yesterday" }), /ISO/)
})

test("declared activities retain revisions, expose interrupted intervals, and never duplicate totals", () => {
  const f = fixture(); f.add("claim")
  const mark = (event: "start" | "stop", id: string, minute: number, phase?: string) => f.command(activityCommand(f.snapshot().state, "B", at(minute), event, id, phase, event === "start" ? "claim" : undefined))
  mark("start", "read", 1, "self-review"); mark("start", "peer", 2, "peer-review"); mark("stop", "read", 4)
  mark("start", "read", 5, "validate")
  const report = buildInsights(f.snapshot(), absent, { until: at(6) })
  const b = report.actors.find((actor) => actor.actor === "B")!
  assert.equal(b.declaredActivityMs, 5 * 60_000, "union 1–6; phases overlap")
  assert.equal(b.phasesMs["self-review"], 3 * 60_000)
  assert.equal(report.spans.filter((span) => span.kind === "activity" && span.open).length, 2)
  assert.deepEqual(f.snapshot().state.records.filter((record) => record.id === "activity:B:read").map((record) => record.rev), [1, 2, 3])
  assert.equal(f.snapshot().state.tasks[0]!.rev, 1)
  assert.equal(f.snapshot().state.checkout, null)
  assert.throws(() => activityCommand(f.snapshot().state, "B", at(7), "start", "read", "implement"), /already started/)
  assert.throws(() => activityCommand(f.snapshot().state, "A", at(7), "stop", "read"), /no open start/)
  assert.throws(() => activityCommand(f.snapshot().state, "A", at(7), "start", "x", "made-up"), /phase/)
  assert.throws(() => activityCommand(f.snapshot().state, "A", at(7), "start", "x", "wait", "missing"), /missing task/)
})

test("malformed and unmatched manual markers are visible without invented elapsed time", () => {
  const f = fixture()
  for (const [i, content] of ["garbage", JSON.stringify({ activity: "x", event: "stop", phase: "self-review", task: null })].entries()) {
    f.command({ type: "record.save", actor: "A", at: at(i + 1), id: "manual" + i, rev: 0, kind: "activity", title: "manual", content })
  }
  const report = buildInsights(f.snapshot(), absent)
  assert.equal(report.diagnostics.length, 2)
  assert.equal(report.spans.length, 0)
  assert.equal(report.actors[1]!.declaredActivityMs, null)
})

test("runtime samples are not labor; missing tails and absent audit remain unobserved", () => {
  const f = fixture()
  const audit: RuntimeAudit = { available: true, lastObservation: at(7), entries: [
    { at: at(2), observations: { A: { at: at(2), status: "working" } }, attempts: [{ id: "wake", seat: "A", at: at(2), outcome: "unconfirmed" }] },
    { at: at(3), observations: { A: { at: at(2), status: "working" } }, attempts: [{ id: "wake", seat: "A", at: at(2), outcome: "accepted" }] },
    { at: at(5), observations: { A: { at: at(5), status: "done" } } },
  ] }
  const report = buildInsights(f.snapshot(), audit, { until: at(10) })
  const a = report.actors.find((actor) => actor.actor === "A")!
  assert.deepEqual(a.runtime, { statesMs: { working: 3 * 60_000, done: 2 * 60_000 }, unobservedMs: 5 * 60_000 })
  assert.deepEqual(a.wakes, { accepted: 1 })
  const early = buildInsights(f.snapshot(), audit, { until: at(2) })
  assert.deepEqual(early.actors.find((actor) => actor.actor === "A")!.wakes, { unconfirmed: 1 })
  assert.match(renderInsights(report), /Missing self-review markers/)
})

test("actual insights CLI is read-only, works without runtime, and validates its options", () => {
  const f = fixture(); f.add("plain"); f.publish("plain", 1)
  const hash = () => createHash("sha256").update(readFileSync(f.path)).digest("hex")
  const before = hash()
  const output = f.cli("insights", "format=json", "until=" + at(2))
  assert.equal(output.status, 0, output.stderr)
  assert.equal(JSON.parse(output.stdout).runtimeAuditAvailable, false)
  assert.equal(hash(), before)
  assert.equal(existsSync(join(f.directory, "coordination.db")), false)
  assert.equal(f.cli("insights", "format=xml").status, 1)
  assert.equal(f.cli("insights", "extra").status, 1)
  assert.equal(f.cli("activity", "start", "mine", "phase=self-review", "task=plain").status, 0)
  assert.equal(f.cli("activity", "stop", "mine").status, 0)
  assert.equal(f.cli("activity", "stop", "mine").status, 1)
})

test("optional coordinator audit opens read-only and supplies its observation boundary", () => {
  const f = fixture(), path = join(f.directory, "coordination.db")
  const db = new DatabaseSync(path)
  db.exec("CREATE TABLE control(id INTEGER,value TEXT); CREATE TABLE audit(seq INTEGER,at TEXT,detail TEXT)")
  db.prepare("INSERT INTO control VALUES(1,?)").run(JSON.stringify({ lastObservation: at(5) }))
  db.prepare("INSERT INTO audit VALUES(1,?,?)").run(at(3), JSON.stringify({ observations: { B: { at: at(3), status: "working" } } }))
  db.close()
  const before = readFileSync(path)
  const audit = readRuntimeAudit(f.directory)
  assert.equal(audit.lastObservation, at(5)); assert.equal(audit.entries.length, 1)
  assert.deepEqual(readFileSync(path), before)
})


test("master-created tasks retain default owner and waits in local runs", () => {
  const f = fixture(); f.add("owner-default", 0, "master")
  f.command({ type: "task.set", actor: "master", at: at(1), id: "owner-default", rev: f.taskRev("owner-default"), wait: { kind: "external", reason: "provider pending" } })
  const report = buildInsights(f.snapshot(), absent, { until: at(4) })
  assert.equal(report.tasks[0]!.owner, "master")
  assert.equal(report.actors.find((actor) => actor.actor === "master")!.externalWaitMs, 3 * 60_000)
})
