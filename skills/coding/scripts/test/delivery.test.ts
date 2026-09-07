import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { deliveryOutcome, mutate, read } from "../src/store.ts"
import { reviewBasis } from "../src/protocol.ts"

const HELPER = join(import.meta.dirname, "..", "ledger.ts")
function fixture(cold = false, declared: string[] = []) {
  const directory = mkdtempSync(join(tmpdir(), "ledger-delivery-"))
  const path = join(directory, "ledger.db")
  const notifier = join(directory, "notifier.cjs")
  for (const seat of ["A", "B"]) writeFileSync(join(directory, `${seat}-notes.md`), "passes: 1 sweeps, 1 lenses, 1 probes, 1 diff reviews\nretrospective: fixture\n")
  writeFileSync(notifier, `require("node:fs").appendFileSync(${JSON.stringify(join(directory, "unexpected-notification"))}, "called"); process.exit(7)`)
  const run = (actor: string, args: string[]) => {
    const pinned = join(directory, "bin", "ledger.ts")
    return spawnSync(process.execPath, ["--no-warnings", existsSync(pinned) ? pinned : HELPER, ...args], {
      encoding: "utf8", env: { ...process.env, LEDGER_DIR: directory, LEDGER_ME: actor, LEDGER_NOTIFY: `${process.execPath} ${notifier}` },
    })
  }
  const ok = (actor: string, args: string[]) => {
    const result = run(actor, args)
    assert.equal(result.status, 0, result.stderr || result.stdout)
    return result
  }
  ok("master", ["init", "--joint", "--route", "write", "--names", "A=author B=arranger master=lead", ...declared])
  if (!cold) for (const seat of ["A", "B"]) { ok(seat, ["init", "--cold"]); ok(seat, ["import"]) }
  const noTransport = () => assert.equal(existsSync(join(directory, "unexpected-notification")), false)
  return { directory, path, run, ok, noTransport }
}

test("notification intent and domain changes commit together; refused batches keep neither", () => {
  const f = fixture()
  const before = read(f.path)
  const saved = mutate(f.path, () => ({ type: "handoff", actor: "A", at: "2026-09-06T00:00:00Z" }))
  assert.equal(saved.notifications.length, 1)
  assert.equal(deliveryOutcome(saved.notifications[0]!), "pending")
  assert.equal(read(f.path).state.handedOff.A, true)
  assert.match(f.ok("master", ["status"]).stdout, /1 notification intents queued/)
  assert.match(f.ok("master", ["delivery", "show", "D-1"]).stdout, /D-1 rev=1: pending; sender A; recipient B/)
  f.ok("master", ["report"])
  assert.match(readFileSync(join(f.directory, "report.md"), "utf8"), /1 notification intents queued/)
  const pending = read(f.path)
  assert.throws(() => mutate(f.path, () => [
    { type: "handoff", actor: "B", at: "2026-09-06T00:00:01Z" },
    { type: "handoff", actor: "master", at: "2026-09-06T00:00:01Z" },
  ]), /reviewer|A or B/)
  assert.deepEqual(read(f.path), pending)
  f.ok("master", ["delivery", "accept", saved.notifications[0]!.id, "rev=1", "checked=recipient confirmed receipt through the coordinator"])
  assert.equal(read(f.path).events.length, before.events.length + 1, "reconciliation never repeats the domain mutation")
  assert.deepEqual(read(f.path).state, pending.state)
  f.noTransport()
})

test("legacy show, accept and supersede preserve history; only master reconciles and retry is removed", () => {
  const f = fixture()
  f.ok("A", ["handoff"])
  const pending = read(f.path)
  const delivery = pending.deliveries[0]!
  assert.equal(deliveryOutcome(delivery), "pending")
  assert.match(f.ok("master", ["delivery", "show", delivery.id]).stdout, /pending/)
  for (const actor of ["A", "B", "reader"]) {
    assert.equal(f.run(actor, ["delivery", "accept", delivery.id, "rev=1", "checked=recipient checked"]).status, 1)
    assert.equal(f.run(actor, ["delivery", "supersede", delivery.id, "rev=1", "reason=obsolete"]).status, 1)
  }
  assert.equal(f.run("master", ["delivery", "retry", delivery.id, "rev=1", "checked=transport checked"]).status, 1)
  assert.deepEqual(read(f.path), pending, "refused reconciliation changes nothing")
  f.ok("master", ["delivery", "accept", delivery.id, "rev=1", "checked=recipient runtime confirms receipt"])
  assert.equal(deliveryOutcome(read(f.path).deliveries[0]!), "accepted")
  assert.equal(f.run("master", ["delivery", "accept", delivery.id, "rev=1", "checked=stale observation"]).status, 1)
  f.ok("B", ["handoff"])
  const obsolete = read(f.path).deliveries.at(-1)!
  assert.equal(f.run("master", ["delivery", "supersede", obsolete.id, "rev=1"]).status, 1)
  f.ok("master", ["delivery", "supersede", obsolete.id, "rev=1", "reason=recipient already completed the affected work"])
  assert.equal(deliveryOutcome(read(f.path).deliveries.at(-1)!), "superseded")
  assert.equal(read(f.path).deliveries[0]!.updates.length, 2)
  f.noTransport()
})

test("a fresh assessment commits once with pending intent and its recorded arranger", () => {
  const f = fixture()
  for (const file of ["validation.md", "assessment.md"]) writeFileSync(join(f.directory, file), `retained fixture ${file}\n`)
  f.ok("A", ["proposed-fix", "add", "goal=preserve draft", "shape=save draft", "origin=user goal", "sites=draft.ts", "rulings=retain input", "test=save then resume", "cost=one handler"])
  f.ok("A", ["checkout", "take", "purpose=save candidate"])
  f.ok("A", ["shelved-fix", "add", "fixes=P-A-1", "artifact=candidate.patch", "baseline=frozen base", "validation=validation.md"])
  f.ok("A", ["checkout", "release"])
  f.ok("A", ["handoff"])
  f.ok("B", ["handoff"])
  const before = read(f.path)
  f.ok("reader", ["shelved-fix", "review", "S-A-1", "rev=1", "reader=fresh-child", "assessment=assessment.md", `basis=${reviewBasis(before.state, "S-A-1")}`])
  const saved = read(f.path)
  const notice = saved.deliveries.at(-1)!
  assert.equal(notice.sender, "reader")
  assert.equal(notice.successor, "B")
  assert.equal(deliveryOutcome(notice), "pending")
  assert.equal(saved.state.rows.find(row => row.kind === "Shelved fix")!.state, "reviewed")
  assert.equal(saved.events.length, before.events.length + 1)
  f.ok("master", ["delivery", "accept", notice.id, "rev=1", "checked=master observed exact wake receipt"])
  assert.deepEqual(read(f.path).state, saved.state)
  assert.deepEqual(read(f.path).events, saved.events)
  f.noTransport()
})

test("cold import requires finished discovery but leaves unresolved claims available for joint work", () => {
  const f = fixture(true, ["--scenarios", "retry,cancel", "--clusters", "persistence"])
  f.ok("A", ["init", "--cold"])
  assert.equal(f.run("A", ["import"]).status, 1)
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
  f.noTransport()
})
