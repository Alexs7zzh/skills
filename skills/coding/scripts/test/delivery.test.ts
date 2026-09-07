import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { deliveryOutcome, mutate, read, unsettled } from "../src/store.ts"
import { reviewBasis } from "../src/protocol.ts"

const HELPER = join(import.meta.dirname, "..", "ledger.ts")

function fixture(options: { declared?: string[]; cold?: boolean } = {}) {
  const directory = mkdtempSync(join(tmpdir(), "ledger-delivery-"))
  const path = join(directory, "ledger.db")
  const notifier = join(directory, "notifier.cjs")
  writeFileSync(notifier, `
const fs = require("node:fs");
const path = require("node:path");
const mode = process.env.TEST_DELIVERY_MODE;
const entry = { to: process.argv[2], message: process.argv[3], accepted: mode !== "fail" && mode !== "crash" };
fs.appendFileSync(path.join(process.env.LEDGER_DIR, "received.jsonl"), JSON.stringify(entry) + "\\n");
if (mode === "crash" || mode === "accepted-crash") { process.kill(process.ppid, "SIGKILL"); process.exit(0); }
if (mode === "fail") { console.error("recipient unavailable before acceptance"); process.exit(7); }
`)
  for (const file of ["validation.md", "assessment.md"]) writeFileSync(join(directory, file), `retained fixture ${file}\n`)
  for (const seat of ["A", "B"]) writeFileSync(join(directory, `${seat}-notes.md`), "passes: 1 sweeps, 1 lenses, 1 probes, 1 diff reviews\nretrospective: fixture\n")
  const run = (actor: string, args: string[], mode = "accept") => {
    const pinned = join(directory, "bin", "ledger.ts")
    if (args[0] === "shelved-fix" && args[1] === "review" && !args.some((arg) => arg.startsWith("basis="))) args = [...args, `basis=${reviewBasis(read(path).state, args[2]!)}`]
    return spawnSync(process.execPath, ["--no-warnings", existsSync(pinned) ? pinned : HELPER, ...args], {
      encoding: "utf8",
      env: { ...process.env, LEDGER_DIR: directory, LEDGER_ME: actor, LEDGER_NOTIFY: mode === "print" ? "print" : `${process.execPath} ${notifier}`, TEST_DELIVERY_MODE: mode },
    })
  }
  const ok = (actor: string, args: string[], mode = "accept") => {
    const result = run(actor, args, mode)
    assert.equal(result.status, 0, result.stderr || result.stdout)
    return result
  }
  ok("master", ["init", "--joint", "--route", "write", "--names", "A=author B=arranger master=lead", ...options.declared ?? []])
  if (!options.cold) for (const seat of ["A", "B"]) { ok(seat, ["init", "--cold"]); ok(seat, ["import"]) }
  const received = () => existsSync(join(directory, "received.jsonl"))
    ? readFileSync(join(directory, "received.jsonl"), "utf8").trim().split("\n").map((line) => JSON.parse(line) as { to: string; message: string; accepted: boolean })
    : []
  const candidate = () => {
    ok("A", ["proposed-fix", "add", "goal=preserve draft", "shape=save draft", "origin=user goal", "sites=draft.ts", "rulings=retain input", "test=save then resume", "cost=one handler"])
    ok("A", ["checkout", "take", "purpose=save candidate"])
    ok("A", ["shelved-fix", "add", "fixes=P-A-1", "artifact=candidate.patch", "baseline=frozen base", "validation=validation.md"])
    ok("A", ["checkout", "release"])
    ok("A", ["handoff"])
    ok("B", ["handoff"])
  }
  const review = ["shelved-fix", "review", "S-A-1", "rev=1", "reader=fresh-child", "assessment=assessment.md"]
  return { directory, path, run, ok, received, candidate, review }
}

test("notification intent and domain changes commit together; refused batches keep neither", () => {
  const f = fixture()
  const before = read(f.path)
  const saved = mutate(f.path, () => ({ type: "handoff", actor: "A", at: "2026-09-06T00:00:00Z" }))
  assert.equal(saved.notifications.length, 1)
  assert.equal(deliveryOutcome(saved.notifications[0]!), "pending")
  assert.equal(read(f.path).state.handedOff.A, true)
  assert.match(f.ok("master", ["status"]).stdout, /Unsettled delivery[\s\S]*D-1 rev=1: pending; sender A; recipient B/)
  f.ok("master", ["report"])
  assert.match(readFileSync(join(f.directory, "report.md"), "utf8"), /Unsettled delivery[\s\S]*D-1 rev=1: pending/)
  assert.equal(f.received().length, 0, "reading status does not retry a notification")
  const pending = read(f.path)
  assert.throws(() => mutate(f.path, () => [
    { type: "handoff", actor: "B", at: "2026-09-06T00:00:01Z" },
    { type: "handoff", actor: "master", at: "2026-09-06T00:00:01Z" },
  ]), /reviewer|A or B/)
  assert.deepEqual(read(f.path), pending, "the refused batch rolls back its completion notification and handoff")
  const id = saved.notifications[0]!.id
  f.ok("A", ["delivery", "retry", id, "rev=1", "checked=recipient has not received the notice; transport available"])
  assert.equal(f.received().length, 1)
  assert.equal(read(f.path).events.length, before.events.length + 1, "delivery never repeats the domain mutation")
})

test("accepted, intentional print, and ordinary failure persist distinct delivery histories", () => {
  for (const mode of ["accept", "print", "fail"]) {
    const f = fixture()
    const result = f.run("A", ["handoff"], mode)
    assert.equal(result.status, mode === "fail" ? 2 : 0, result.stderr)
    const delivery = read(f.path).deliveries[0]!
    assert.equal(delivery.sender, "A")
    assert.equal(delivery.successor, "master")
    assert.equal(delivery.to, "B")
    assert.equal(delivery.address, "arranger")
    assert.match(delivery.message, new RegExp(`Run directory: ${JSON.stringify(f.directory)}`))
    assert.match(delivery.message, /Delivery id: D-1; sender seat: A/)
    assert.equal(deliveryOutcome(delivery), mode === "accept" ? "accepted" : mode === "print" ? "printed" : "unconfirmed")
    assert.equal(unsettled(delivery), mode === "fail")
    if (mode === "fail") {
      assert.match(result.stderr, /mutation was saved; do not repeat/)
      assert.match(delivery.updates.at(-1)!.note, /exit 7; diagnostic:/)
      assert.match(f.ok("master", ["status"]).stdout, /Unsettled delivery/)
    } else {
      assert.doesNotMatch(f.ok("master", ["status"]).stdout, /Unsettled delivery/)
      const retry = f.run("master", ["delivery", "retry", delivery.id, `rev=${delivery.updates.length}`, "checked=attempting to repeat"])
      assert.equal(retry.status, 1)
      assert.match(retry.stderr, /do not repeat a settled notification/)
      assert.equal(f.received().length, mode === "accept" ? 1 : 0)
    }
  }
})

test("process loss after a committed assessment preserves its notice for the recorded arranger", () => {
  const f = fixture()
  f.candidate()
  const before = read(f.path)
  const failed = f.run("reader", f.review, "crash")
  assert.equal(failed.signal, "SIGKILL")
  const saved = read(f.path)
  const delivery = saved.deliveries.at(-1)!
  assert.equal(delivery.sender, "reader")
  assert.equal(delivery.successor, "B", "the arranger is retained when intent is created")
  assert.equal(deliveryOutcome(delivery), "unconfirmed")
  assert.equal(saved.state.rows.find((row) => row.kind === "Shelved fix")!.state, "reviewed")
  assert.equal(saved.events.length, before.events.length + 1)
  assert.match(f.ok("master", ["status"]).stdout, /Unsettled delivery[\s\S]*sender reader; recipient master/)
  const unauthorized = f.run("A", ["delivery", "accept", delivery.id, `rev=${delivery.updates.length}`, "checked=recipient checked"])
  assert.equal(unauthorized.status, 1)
  assert.match(unauthorized.stderr, /reconciled by sender reader, successor B, or master/)
  const attempts = f.received().length
  f.ok("B", ["delivery", "retry", delivery.id, `rev=${delivery.updates.length}`, "checked=child stopped; lead has not received the completion; transport restored"])
  const after = read(f.path)
  assert.equal(deliveryOutcome(after.deliveries.at(-1)!), "accepted")
  assert.equal(f.received().length, attempts + 1)
  assert.equal(f.received().at(-1)!.message, delivery.message)
  assert.deepEqual(after.state, saved.state)
  assert.deepEqual(after.events, saved.events)
  const stale = f.run("B", ["delivery", "retry", delivery.id, `rev=${delivery.updates.length}`, "checked=old observation"])
  assert.equal(stale.status, 1)
  assert.equal(f.received().length, attempts + 1)
})

test("acceptance observed after interruption settles without retrying; obsolete work can be superseded", () => {
  const f = fixture()
  f.candidate()
  assert.equal(f.run("reader", f.review, "accepted-crash").signal, "SIGKILL")
  const delivery = read(f.path).deliveries.at(-1)!
  assert.equal(f.received().at(-1)!.accepted, true)
  const count = f.received().length
  f.ok("master", ["delivery", "accept", delivery.id, `rev=${delivery.updates.length}`, "checked=lead runtime confirms this exact message was accepted"])
  assert.equal(f.received().length, count)
  assert.equal(deliveryOutcome(read(f.path).deliveries.at(-1)!), "accepted")

  const g = fixture()
  assert.equal(g.run("A", ["handoff"], "fail").status, 2)
  const pending = read(g.path).deliveries[0]!
  const absentReason = g.run("master", ["delivery", "supersede", pending.id, `rev=${pending.updates.length}`])
  assert.equal(absentReason.status, 1)
  g.ok("master", ["delivery", "supersede", pending.id, `rev=${pending.updates.length}`, "reason=recipient completed its remaining work through the parent handoff"])
  assert.equal(deliveryOutcome(read(g.path).deliveries[0]!), "superseded")
  assert.equal(g.received().length, 1)
  assert.doesNotMatch(g.ok("master", ["status"]).stdout, /Unsettled delivery/)
})

test("cold import requires finished discovery but leaves unresolved claims available for joint work", () => {
  const f = fixture({ cold: true, declared: ["--scenarios", "retry,cancel", "--clusters", "persistence"] })
  f.ok("A", ["init", "--cold"])
  const missing = f.run("A", ["import"])
  assert.equal(missing.status, 1)
  assert.equal(read(f.path).state.imported.A, false)
  f.ok("A", ["coverage", "add", "kind=scenario", "target=retry", "state=covered", "note=checked retry path"])
  f.ok("A", ["coverage", "add", "kind=scenario", "target=cancel", "state=gap", "note=target runtime unavailable"])
  f.ok("A", ["issue", "add", "label=Bug", "certainty=2", "claim=possible lost draft", "site=save.ts", "clusters=persistence"])
  f.ok("A", ["coverage", "add", "kind=scenario", "target=extra-sweep"])
  assert.equal(f.run("A", ["import"]).status, 1, "an extra open sweep must finish too")
  f.ok("A", ["coverage", "set", "C-A-3", "rev=1", "state=covered", "note=extra sweep finished"])
  f.ok("A", ["import"])
  assert.equal(read(f.path).state.imported.A, true)
  assert.equal(read(f.path).state.rows.find((row) => row.kind === "Issue")!.state, "new")
})
