import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { deliveryOutcome, read } from "../src/store.ts"

const source = join(import.meta.dirname, "..", "ledger.ts")

// These tests retain the exact dispatch token; submission never fills it from current state.
function fixture(mode: "single" | "joint" = "single") {
  const directory = mkdtempSync(join(tmpdir(), "ledger-review-basis-"))
  const invoked = join(directory, "unexpected-notification")
  const notifier = join(directory, "notifier.cjs")
  writeFileSync(notifier, `require("node:fs").writeFileSync(${JSON.stringify(invoked)}, "called"); process.exit(7)`)
  const commands: unknown[] = []
  for (const name of ["validation.md", "validation-v2.md", "assessment.md"]) writeFileSync(join(directory, name), `retained review-basis fixture: ${name}\n`)
  const run = (actor: string, args: string[], expected = 0) => {
    const pinned = join(directory, "bin", "ledger.ts")
    const child = spawnSync(process.execPath, ["--no-warnings", existsSync(pinned) ? pinned : source, ...args], { encoding: "utf8", env: { ...process.env, LEDGER_DIR: directory, LEDGER_ME: actor, LEDGER_NOTIFY: `${process.execPath} ${notifier}` } })
    commands.push({ actor, args, code: child.status, out: child.stdout, err: child.stderr })
    writeFileSync(join(directory, "commands.json"), JSON.stringify(commands, null, 2))
    assert.equal(child.status, expected, `${directory}: ${actor} ${args.join(" ")}\n${child.stderr || child.stdout}`)
    assert.equal(existsSync(invoked), false, "ledger records and reads never execute LEDGER_NOTIFY")
    return child
  }
  const snapshot = () => read(join(directory, "ledger.db"))
  const row = (id: string) => snapshot().state.rows.find((item) => item.id === id)!
  const capture = (id: string, label: string) => {
    const basis = run(mode === "single" ? "B" : "reader", ["review-basis", id]).stdout.trim()
    assert.match(basis, /^sha256:[a-f0-9]{64}$/)
    writeFileSync(join(directory, `${label}.json`), JSON.stringify({ basis, state: snapshot().state }, null, 2))
    return basis
  }
  const review = (id: string, basis: string, expected = 0, conditions = "") => run(mode === "single" ? "B" : "reader", ["shelved-fix", "review", id, `rev=${row(id).rev}`, `basis=${basis}`, ...(conditions ? [`conditions=${conditions}`] : []), ...(mode === "joint" ? ["reader=retained-child", "assessment=assessment.md"] : [])], expected)
  run(mode === "single" ? "A" : "master", ["init", `--${mode}`, "--route", "write", ...(mode === "joint" ? ["--names", "A=writer B=arranger master=coordinator"] : [])])
  if (mode === "joint") for (const actor of ["A", "B"]) { run(actor, ["init", "--cold"]); run(actor, ["import"]) }
  for (const index of [1, 2]) run("A", ["issue", "add", "label=Bug", "certainty=3", "state=verified", `claim=proof ${index}`, "site=draft.ts", "trigger=restart", "cause=missing flush", "scope=unsent drafts", "frequency=each restart", "impact=lost work", "rank=2", "evidence=validation.md", ...(index === 2 ? ["parents=I-A-1"] : [])])
  if (mode === "joint") run("A", ["issue", "take", "I-A-2", "rev=1"])
  for (const index of [1, 2]) run("A", ["proposed-fix", "add", ...(index === 2 ? ["issues=I-A-2"] : ["goal=retain draft storage"]), "origin=user goal", "shape=save before restart", "sites=draft.ts", "rulings=retain unsent input", "test=save then restart", "cost=one persistence boundary"])
  run("A", ["checkout", "take", "purpose=save review inputs"])
  for (const index of [1, 2]) run("A", ["shelved-fix", "add", `fixes=P-A-${index}`, `artifact=candidate-${index}.patch`, "baseline=frozen-base", "validation=validation.md", ...(index === 2 ? ["dependencies=S-A-1@1"] : [])])
  run("A", ["checkout", "release"])
  return { directory, run, row, snapshot, capture, review }
}

test("in-flight CLI candidate assessments reject changed claims, proposals, rulings, proofs, and dependencies", () => {
  for (const change of ["claim", "proposal", "ruling", "proof", "dependency"] as const) {
    const f = fixture()
    const supplied = f.capture("S-A-2", "reader-input")
    const original = f.row("S-A-2")
    if (change === "claim" || change === "proof") f.run("A", ["issue", "set", change === "claim" ? "I-A-2" : "I-A-1", "rev=1", "claim=all stored drafts are affected", "scope=sent and unsent drafts"])
    if (change === "proposal") f.run("A", ["proposed-fix", "set", "P-A-2", "rev=1", "shape=flush sent and unsent drafts"])
    if (change === "ruling") {
      f.run("A", ["question", "add", "issues=I-A-2", "question=retain at sign-out?", "options=retain,delete", "recommendation=retain", "effect=privacy versus continuation", "cost=one lifecycle choice"])
      f.run("master", ["question", "answer", "Q-A-1", "rev=1", "answer=delete at sign-out"])
    }
    if (change === "dependency") {
      f.run("A", ["checkout", "take", "purpose=revise prerequisite"])
      f.run("A", ["shelved-fix", "set", "S-A-1", "rev=1", "artifact=storage-v2.patch", "validation=validation-v2.md"])
      f.run("A", ["checkout", "release"])
    }
    const beforeSubmission = f.snapshot()
    assert.match(f.review("S-A-2", supplied, 1).stderr, /review inputs changed.*reassess/)
    assert.deepEqual(f.snapshot(), beforeSubmission, "an obsolete verdict changes no state or history")
    assert.equal(f.row("S-A-2").rev, original.rev, "review invalidation is not a candidate revision")
    if (change === "dependency") {
      f.run("A", ["checkout", "take", "purpose=refresh dependent inputs"])
      f.run("A", ["shelved-fix", "set", "S-A-2", "rev=1", "dependencies=S-A-1@2", "validation=validation-v2.md"])
      f.run("A", ["checkout", "release"])
    }
    const reassessed = f.capture("S-A-2", "reassessed-input")
    assert.notEqual(reassessed, supplied)
    f.review("S-A-2", reassessed)
    const candidate = f.row("S-A-2")
    assert.equal(candidate.kind, "Shelved fix")
    if (candidate.kind === "Shelved fix" && original.kind === "Shelved fix" && change !== "dependency") assert.equal(candidate.validationDigest, original.validationDigest, "claim-only changes do not fabricate validation")
    assert.ok(f.snapshot().events.at(-1)?.note.includes(`basis ${reassessed}`), "the accepted basis is retained in the timeline")
  }
})

test("a basis survives ownership-only takeover, unrelated work, review marks, and unchanged-input follow-up", () => {
  const f = fixture("joint")
  const supplied = f.capture("S-A-2", "reader-input")
  f.run("A", ["proposed-fix", "release", "P-A-2", "rev=1"])
  f.run("B", ["proposed-fix", "take", "P-A-2", "rev=1"])
  f.run("A", ["coverage", "add", "kind=scenario", "target=unrelated export", "state=covered", "note=checked separately"])
  assert.equal(f.capture("S-A-2", "handoff-input"), supplied)
  const proposalBasis = f.capture("P-A-2", "proposal-input")
  f.run("reader", ["proposed-fix", "mark", "P-A-2", "rev=1", `basis=${proposalBasis}`, "reader=proposal-child", "assessment=assessment.md"])
  assert.equal(f.capture("S-A-2", "after-proposal-mark"), supplied, "a proposal mark changes no material input")
  f.review("S-A-2", supplied, 0, "confirm cancellation preserves the saved draft")
  assert.equal(f.capture("S-A-2", "condition-input"), supplied)
  f.run("B", ["shelved-fix", "request-review", "S-A-2", "rev=1", "reason=retained observation settles cancellation without input changes"])
  f.review("S-A-2", supplied)
  assert.equal(f.capture("S-A-2", "reviewed-input"), supplied)
})

test("issue and proposal assessments bind parent proofs; changed pending inputs notify the same arranger", () => {
  const f = fixture("joint")
  const issueBasis = f.capture("I-A-2", "issue-input")
  const proposalBasis = f.capture("P-A-2", "proposal-input")
  const candidateBasis = f.capture("S-A-2", "candidate-input")
  const previousIntents = f.snapshot().deliveries.length
  f.run("A", ["issue", "set", "I-A-1", "rev=1", "scope=every persisted draft"])
  const notifications = f.snapshot().deliveries.slice(previousIntents)
  assert.equal(notifications.length, 1)
  const notification = notifications[0]!
  assert.equal(notification.to, "B")
  assert.equal(notification.address, "arranger")
  assert.equal(deliveryOutcome(notification), "pending")
  assert.match(notification.message, /fresh assessments for you to arrange or update: S-A-2@1 basis=sha256:/)
  assert.match(notification.message, /Give changed inputs and their basis to that child for reassessment; do not start a duplicate reader/)
  const reader = ["reader=retained-child", "assessment=assessment.md"]
  for (const [noun, verb, id, basis] of [["issue", "agree", "I-A-2", issueBasis], ["proposed-fix", "mark", "P-A-2", proposalBasis], ["proposed-fix", "reject", "P-A-2", proposalBasis]]) {
    assert.match(f.run("reader", [noun!, verb!, id!, "rev=1", `basis=${basis}`, ...reader, ...(verb === "reject" ? ["reason=old conclusion"] : [])], 1).stderr, /review inputs changed/)
  }
  const current = f.capture("S-A-2", "changed-input")
  assert.notEqual(current, candidateBasis)
  const status = f.run("B", ["status"]).stdout
  assert.ok(status.includes(current))
  assert.match(status, /existing child.*reassessment; do not start a duplicate reader/)
  f.review("S-A-2", current)
})

test("review basis is a read-only explicit CLI input, never filled from the submission's current state", () => {
  const f = fixture()
  const before = f.snapshot()
  const supplied = f.capture("S-A-2", "reader-input")
  assert.deepEqual(f.snapshot(), before)
  assert.match(f.run("B", ["shelved-fix", "review", "S-A-2", "rev=1"], 1).stderr, /missing basis/)
  assert.match(f.run("B", ["shelved-fix", "review", "S-A-2", "rev=1", "basis=obsolete"], 1).stderr, /review inputs changed/)
  f.run("B", ["review-basis", "S-A-2", "basis=ignored"], 1)
  f.run("B", ["review-basis", "Q-A-1"], 1)
  f.review("S-A-2", supplied)
})
