import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { DatabaseSync } from "node:sqlite"
import { reviewBasis, rowsOf } from "../src/protocol.ts"
import { read } from "../src/store.ts"

const LEDGER = join(import.meta.dirname, "..", "ledger.ts")

interface Run {
  readonly code: number
  readonly out: string
  readonly err: string
}

function runner(directory: string, notifier = "print") {
  return (actor: "A" | "B" | "master" | "reader", ...args: string[]): Run => {
    const script = existsSync(join(directory, "bin", "ledger.ts")) ? join(directory, "bin", "ledger.ts") : LEDGER
    if (["issue agree", "proposed-fix mark", "proposed-fix reject", "shelved-fix review"].includes(args.slice(0, 2).join(" ")) && !args.some((arg) => arg.startsWith("basis="))) {
      args.push(`basis=${reviewBasis(read(join(directory, "ledger.db")).state, args[2]!)}`)
    }
    const child = spawnSync(process.execPath, ["--no-warnings", script, ...args], {
      encoding: "utf8",
      env: { ...process.env, LEDGER_DIR: directory, LEDGER_ME: actor, LEDGER_NOTIFY: notifier },
    })
    return { code: child.status ?? -1, out: child.stdout, err: child.stderr }
  }
}

function expectOk(run: Run, pattern?: RegExp): Run {
  assert.equal(run.code, 0, `expected success, got: ${run.err || run.out}`)
  if (pattern) assert.match(run.out, pattern)
  return run
}

function expectRefused(run: Run, pattern: RegExp): void {
  assert.equal(run.code, 1, `expected refusal, got: ${run.out}`)
  assert.match(run.err, pattern)
}

function fresh(): string {
  const directory = mkdtempSync(join(tmpdir(), "ledger-"))
  for (const name of ["probe.log", "red.log", "green.log", "build.log", "test.log", "validation.md"]) writeFileSync(join(directory, name), name)
  return directory
}

function deliveryFixture() {
  const directory = fresh()
  const ledger = runner(directory)
  expectOk(ledger("master", "init", "--joint", "--route", "write", "--names", "A=author B=reviewer master=lead"))
  for (const seat of ["A", "B"] as const) {
    expectOk(ledger(seat, "init", "--cold"))
    expectOk(ledger(seat, "import"))
  }
  expectOk(ledger("A", "proposed-fix", "add", "goal=retain user state", "origin=requirement", "shape=save state", "sites=save.ts", "rulings=preserve state", "test=round trip", "cost=one handler"))
  expectOk(ledger("A", "checkout", "take", "purpose=save candidate"))
  return {
    directory,
    save: ["shelved-fix", "add", "fixes=P-A-1", "artifact=candidate.patch", "baseline=base", "validation=validation.md"],
    notifier(source: string): string {
      const path = join(directory, "notifier.cjs")
      writeFileSync(path, source)
      return `${process.execPath} ${path}`
    },
  }
}

test("released donor can hand off before successor pickup through the pinned CLI", () => {
  const f = deliveryFixture()
  for (const seat of ["A", "B"]) writeFileSync(join(f.directory, `${seat}-notes.md`), "passes: handoff fixture\nretrospective: preserve candidate while testing donor release\n")
  const ledger = runner(f.directory)
  expectOk(ledger("A", ...f.save))
  expectOk(ledger("A", "checkout", "release"))
  const before = read(join(f.directory, "ledger.db")).state
  const shelf = rowsOf(before, "Shelved fix")[0]!
  const basis = reviewBasis(before, shelf.id)
  expectOk(ledger("A", "proposed-fix", "release", "P-A-1", "rev=1"))
  expectOk(ledger("A", "handoff"), /A handed off/)
  const released = read(join(f.directory, "ledger.db")).state
  assert.equal(released.handedOff.A, true)
  assert.deepEqual(rowsOf(released, "Shelved fix")[0], shelf)
  assert.equal(reviewBasis(released, shelf.id), basis)
  expectRefused(ledger("B", "handoff"), /ready work remains: P-A-1/)
  expectOk(ledger("B", "proposed-fix", "take", "P-A-1", "rev=1"))
  const taken = read(join(f.directory, "ledger.db")).state
  assert.equal(taken.handedOff.A, true, "pickup does not wake the donor without new work")
  assert.deepEqual(rowsOf(taken, "Shelved fix")[0], shelf)
  assert.equal(reviewBasis(taken, shelf.id), basis)
  assert.equal(rowsOf(taken, "Proposed fix")[0]?.owner, "B")
})

test("CLI rejects ignored init inputs before creating a run", () => {
  for (const args of [
    ["--single", "--how_far", "report-only"],
    ["--single", "--how-far", "report-only", "--how-far", "fix"],
    ["--single=false"],
    ["--single", "route=write"],
    ["extra", "--single"],
  ]) {
    const directory = fresh()
    expectRefused(runner(directory)("A", "init", ...args), /unknown flag|given twice|switch|unknown field|unexpected arguments/)
    assert.equal(existsSync(join(directory, "ledger.db")), false)
  }
  const directory = fresh()
  expectOk(runner(directory)("A", "init", "--single", "--how-far", "report-only"))
  assert.equal(read(join(directory, "ledger.db")).state.howFar, "report-only")
})

test("CLI never turns an unsupported conditions option into a clean review", () => {
  const fixture = deliveryFixture()
  const ledger = runner(fixture.directory)
  expectOk(ledger("A", ...fixture.save))
  const before = read(join(fixture.directory, "ledger.db"))
  expectRefused(ledger("reader", "shelved-fix", "review", "S-A-1", "rev=1", "--conditions", "preserve user data"), /unknown flag --conditions/)
  expectRefused(ledger("A", "checkout", "release", "unexpected-target"), /unexpected arguments/)
  expectRefused(ledger("master", "status", "unexpected-target"), /unexpected arguments/)
  expectRefused(ledger("master", "report", "conditions=ignored"), /unknown field/)
  assert.deepEqual(read(join(fixture.directory, "ledger.db")), before)
  writeFileSync(join(fixture.directory, "assessment.md"), "Fixture assessment: preserve user data.")
  expectOk(ledger("reader", "shelved-fix", "review", "S-A-1", "rev=1", "conditions=preserve user data", "reader=fresh-check", "assessment=assessment.md"))
  assert.equal(rowsOf(read(join(fixture.directory, "ledger.db")).state, "Shelved fix")[0]?.state, "conditions")
})

test("joint names are distinct nonempty addresses and cold init inherits settings", () => {
  for (const names of ["A=same B=same master=lead", "A=lead B=reviewer master=lead", "A= B=reviewer master=lead", "A=author A=second B=reviewer master=lead"]) {
    const directory = fresh()
    expectRefused(runner(directory)("master", "init", "--joint", "--names", names), /distinct|nonempty|twice/)
    assert.equal(existsSync(join(directory, "ledger.db")), false)
  }
  const directory = fresh()
  const ledger = runner(directory)
  expectOk(ledger("master", "init", "--joint", "--names", "A=author B=reviewer master=lead"))
  expectRefused(ledger("A", "init", "--cold", "--how-far", "report-only"), /inherits/)
  assert.equal(existsSync(join(directory, "cold-A.db")), false)
  expectOk(ledger("A", "init", "--cold"))
})

test("notification failure is distinct from a refused mutation and retains transport diagnostics", () => {
  const fixture = deliveryFixture()
  const command = fixture.notifier('console.error("socket: Operation not permitted"); process.exit(7)')
  const result = runner(fixture.directory, command)("A", ...fixture.save)
  assert.equal(result.code, 2)
  assert.match(result.err, /delivery not confirmed to reviewer.*exit 7/)
  assert.match(result.err, /socket: Operation not permitted/)
  assert.match(result.err, /mutation was saved; do not repeat/)
  assert.match(result.out, /message for reviewer: Run directory:/)
  assert.match(result.out, /recipient seat: B\nfresh assessments for you to arrange or update: S-A-1@1 basis=sha256:/)
  assert.doesNotMatch(result.out, /delivery accepted/)
  const diagnostics = readdirSync(join(fixture.directory, "delivery"))
  assert.equal(diagnostics.length, 1)
  const diagnostic = JSON.parse(readFileSync(join(fixture.directory, "delivery", diagnostics[0]!), "utf8"))
  assert.equal(diagnostic.to, "reviewer")
  assert.equal(diagnostic.status, 7)
  assert.match(diagnostic.stderr, /Operation not permitted/)
  assert.match(diagnostic.message, /S-A-1/)
  const saved = read(join(fixture.directory, "ledger.db"))
  assert.equal(rowsOf(saved.state, "Shelved fix").length, 1)
  assert.equal(saved.events.filter((event) => event.command === "shelved-fix.add").length, 1)
  expectOk(runner(fixture.directory, command)("B", "status"), /only you arrange these fresh contexts/)
})

test("notification outcomes cover success, intentional print, missing executable and signal", () => {
  for (const mode of ["success", "print", "", "missing", "signal"] as const) {
    const fixture = deliveryFixture()
    const received = join(fixture.directory, "received.json")
    const command = mode === "success"
      ? fixture.notifier(`require("node:fs").writeFileSync(${JSON.stringify(received)}, JSON.stringify(process.argv.slice(2)))`)
      : mode === "signal" ? fixture.notifier('console.log("provider stopped"); process.kill(process.pid, "SIGTERM")')
      : mode === "missing" ? join(fixture.directory, "absent-notifier") : mode
    const result = runner(fixture.directory, command)("A", ...fixture.save)
    if (mode === "success") {
      expectOk(result, /delivery accepted to reviewer/)
      assert.equal(result.err, "")
      const args = JSON.parse(readFileSync(received, "utf8"))
      assert.equal(args[0], "reviewer")
      assert.equal(args[1].split("\n")[0], `Run directory: ${JSON.stringify(fixture.directory)}; recipient seat: B`)
      assert.match(args[1], /\nfresh assessments for you to arrange or update: S-A-1@1 basis=sha256:[a-f0-9]{64}\..*Next:/)
      assert.equal(args.length, 2)
      assert.doesNotMatch(result.out, /message for reviewer:/)
    } else if (mode === "print" || mode === "") {
      expectOk(result, /delivery disabled by LEDGER_NOTIFY/)
      assert.match(result.out, /recipient seat: B\nfresh assessments for you to arrange or update: S-A-1@1 basis=sha256:/)
      assert.equal(result.err, "")
      assert.equal(existsSync(join(fixture.directory, "delivery")), false)
    } else {
      assert.equal(result.code, 2)
      assert.match(result.err, mode === "missing" ? /ENOENT/ : /SIGTERM/)
      if (mode === "signal") assert.match(result.err, /provider stopped/)
      assert.equal(rowsOf(read(join(fixture.directory, "ledger.db")).state, "Shelved fix").length, 1)
    }
  }
})

test("failed question delivery still records the open decision for the master", () => {
  const fixture = deliveryFixture()
  const command = fixture.notifier('console.error("recipient blocked"); process.exit(1)')
  const result = runner(fixture.directory, command)("A", "question", "add", "fix=P-A-1", "question=keep saved state?", "options=keep,delete", "recommendation=keep", "effect=persistence", "cost=one handler")
  assert.equal(result.code, 2)
  assert.match(result.err, /delivery not confirmed to lead/)
  assert.match(result.err, /recipient blocked/)
  assert.match(result.out, /recipient seat: master\nquestion: Q-A-1/)
  const questions = rowsOf(read(join(fixture.directory, "ledger.db")).state, "Question")
  assert.equal(questions.length, 1)
  assert.equal(questions[0]?.state, "open")
})

test("a single quick review: pinned script, refusals with reasons, fresh diff review, report on disk", () => {
  const directory = fresh()
  const ledger = runner(directory)
  expectRefused(ledger("B", "init", "--single"), /seat A/)
  expectOk(ledger("A", "init", "--single", "--route", "review", "--hunks", "a.ts:1-9"), /pinned script/)
  assert.ok(existsSync(join(directory, "bin", "ledger.ts")))
  assert.ok(existsSync(join(directory, "bin", "src", "protocol.ts")))
  expectRefused(ledger("A", "init", "--single"), /already exists/)

  expectOk(ledger("A", "status"), /cover hunk a.ts:1-9/)
  expectOk(ledger("A", "coverage", "add", "kind=hunk", "target=a.ts:1-9", "state=covered", "note=read every line"))
  expectRefused(ledger("A", "issue", "add", "label=Bug", "certainty=2", "claim=x", "site=a.ts:3", "bogus=1"), /unknown field bogus=/)
  expectOk(ledger("A", "issue", "add", "label=Bug", "certainty=2", "claim=off by one", "site=a.ts:3"), /I-A-1: Bug new/)
  expectRefused(ledger("A", "issue", "verify", "I-A-1", "rev=1", "certainty=4", "evidence=probe.log"), /needs trigger, cause, scope, frequency, impact, rank/)
  expectRefused(ledger("A", "issue", "verify", "I-A-1", "rev=1", "certainty=4", "evidence=missing.log"), /log does not exist/)
  expectOk(ledger("A", "issue", "set", "I-A-1", "rev=1", "trigger=one item", "cause=<=", "scope=all", "frequency=each save", "impact=crash", "rank=1"))
  expectRefused(ledger("A", "issue", "verify", "I-A-1", "rev=1", "certainty=4", "evidence=probe.log"), /read it again/)
  expectOk(ledger("A", "issue", "verify", "I-A-1", "rev=2", "certainty=4", "evidence=probe.log"), /verified at step 4/)
  expectOk(ledger("A", "status"), /proposed-fix add issues=I-A-1/)

  expectOk(ledger("A", "proposed-fix", "add", "issues=I-A-1", "origin=attention-miss", "shape=fix the bound", "sites=a.ts:3", "rulings=none", "test=a.test.ts", "cost=one line"))
  expectRefused(ledger("A", "shelved-fix", "add", "fixes=P-A-1", "artifact=stash@0", "baseline=base-sha + user.patch", "validation=validation.md"), /take the checkout/)
  expectOk(ledger("A", "checkout", "take", "purpose=fix I-A-1"))
  expectOk(ledger("A", "checkout", "baseline", "build=build.log", "test=test.log"))
  expectOk(ledger("A", "shelved-fix", "add", "fixes=P-A-1", "artifact=stash@0", "baseline=base-sha + user.patch", "validation=validation.md"), /S-A-1: shelved P-A-1/)
  expectOk(ledger("A", "checkout", "release"), /dispatch a fresh subagent as B/)
  expectOk(ledger("B", "status"), /shelved-fix review S-A-1 rev=1/)
  expectRefused(ledger("A", "shelved-fix", "review", "S-A-1", "rev=1"), /nobody marks their own work/)
  expectOk(ledger("B", "shelved-fix", "review", "S-A-1", "rev=1"), /reviewed clean by B/)
  expectOk(ledger("A", "status"), /next for A: "\$LEDGER_DIR\/bin\/ledger.ts" report/)

  const report = expectOk(ledger("A", "report"), /Ready to report/)
  assert.match(report.out, /\| 1 \| I-A-1 \| Bug \| verified \| 4 \|/)
  assert.match(report.out, /S-A-1 reviewed/)
  assert.ok(existsSync(join(directory, "report.md")))
  assert.match(readFileSync(join(directory, "report.md"), "utf8"), /^# Review report/)
  const timeline = expectOk(ledger("A", "timeline", "B"), /shelved-fix.review/)
  assert.match(timeline.out, /\| B \| [\d:.]+ \| [\dhms .]+ \| working: S-A-1 \|/, "B's segment names the diff review it had ready")
  const row = expectOk(ledger("A", "timeline", "I-A-1"), /edited: trigger=one item; cause=<=; scope=all; frequency=each save; impact=crash; rank=1; marks cleared/)
  assert.doesNotMatch(row.out, /Where the time went/, "a row's timeline is the argument on that row alone")
  expectRefused(ledger("A", "timeline", "I-A-9"), /no events on I-A-9/)

  const saved = rowsOf(read(join(directory, "ledger.db")).state, "Shelved fix")[0]!
  expectOk(ledger("A", "issue", "set", "I-A-1", "rev=3", "claim=the final item exceeds the bound"))
  expectOk(ledger("B", "status"), /shelved-fix review S-A-1 rev=1/)
  const reopened = rowsOf(read(join(directory, "ledger.db")).state, "Shelved fix")[0]!
  assert.deepEqual(reopened, { ...saved, state: "shelved", review: null, updated: reopened.updated })
  expectOk(ledger("B", "shelved-fix", "review", "S-A-1", "rev=1"), /reviewed clean by B/)
  const resumed = read(join(directory, "ledger.db"))
  assert.equal(rowsOf(resumed.state, "Shelved fix")[0]?.validationDigest, saved.validationDigest)
  assert.equal(resumed.events.filter((event) => event.command.startsWith("shelved-fix.") && event.command !== "shelved-fix.review").length, 1, "re-review needs no new shelve or validation snapshot")
  expectOk(ledger("A", "report"), /Ready to report/)
})

test("a two-reviewer run: cold passes, import, messages, notes at handoff, master report and check-in", () => {
  const directory = fresh()
  const ledger = runner(directory)
  expectRefused(ledger("master", "init", "--joint"), /--names/)
  expectOk(ledger("master", "init", "--joint", "--names", "A=opus-reviewer B=codex-reviewer master=lead", "--hunks", "x.ts"))
  expectRefused(ledger("A", "issue", "add", "label=Bug", "certainty=2", "claim=c", "site=s"), /import your cold pass/)

  expectOk(ledger("A", "init", "--cold"), /cold database for A/)
  expectOk(ledger("B", "init", "--cold"))
  expectOk(ledger("A", "coverage", "add", "kind=hunk", "target=x.ts", "state=covered", "note=swept"))
  expectOk(ledger("A", "issue", "add", "label=Bug", "certainty=4", "claim=race", "site=x.ts:9", "trigger=two writers", "cause=no owner", "scope=all", "frequency=rare", "impact=corrupt save", "rank=1", "state=verified", "evidence=probe.log"))
  expectRefused(ledger("A", "checkout", "take", "purpose=probe"), /read-only/)
  expectOk(ledger("B", "issue", "add", "label=Nit", "certainty=2", "claim=name", "site=x.ts:1"))
  expectOk(ledger("B", "coverage", "add", "kind=hunk", "target=x.ts", "state=covered", "note=swept independently"))
  expectOk(ledger("A", "status"), /import this cold pass into the shared database/)
  expectOk(ledger("A", "import"), /imported 2 rows from A/)
  expectOk(ledger("B", "import"), /imported 2 rows from B/)
  expectOk(ledger("B", "status"))

  expectOk(ledger("B", "issue", "agree", "I-A-1", "rev=1"))
  expectOk(ledger("A", "issue", "take", "I-A-1", "rev=1"))
  expectOk(ledger("A", "proposed-fix", "add", "issues=I-A-1", "origin=design-absence", "shape=one owner per save", "sites=x.ts:9,y.ts:2", "rulings=none", "test=x.test.ts", "cost=two files"))
  expectOk(ledger("B", "proposed-fix", "mark", "P-A-1", "rev=1"))
  expectOk(ledger("A", "checkout", "take", "purpose=fix I-A-1"))
  expectRefused(ledger("B", "checkout", "take", "purpose=probe"), /held by A/)
  expectOk(ledger("A", "shelved-fix", "add", "fixes=P-A-1", "artifact=cs 15", "baseline=base-sha + user.patch", "validation=validation.md"), /recipient seat: B\nfresh assessments for you to arrange or update: S-A-1@1 basis=sha256:/)
  expectRefused(ledger("A", "handoff"), /release the checkout/)
  expectOk(ledger("A", "checkout", "release"))
  expectRefused(ledger("A", "handoff"), /A-notes.md/)
  writeFileSync(join(directory, "A-notes.md"), "passes: 1 sweeps, 2 lenses, 1 probes, 0 diff reviews\nretrospective: rule 3 found it\n\n## Goal closure\n\nok\n\n## Domain scenarios\n\nok\n")
  expectRefused(ledger("A", "handoff"), /skipped:/)
  writeFileSync(join(directory, "A-notes.md"), "passes: 1 sweeps, 2 lenses, 1 probes, 0 diff reviews\nskipped: diff reviews, none of mine were shelved by B\nretrospective: rule 3 found it\n\n## Goal closure\n\nok\n\n## Domain scenarios\n\nok\n")
  expectOk(ledger("A", "handoff"), /recipient seat: B\nA handed off.*Pending fresh assessments arranged by you: S-A-1@1/)
  expectRefused(ledger("B", "shelved-fix", "review", "S-A-1", "rev=1"), /require a fresh context with LEDGER_ME=reader/)
  expectRefused(ledger("B", "shelved-fix", "review", "S-A-1", "rev=1", "conditions=check recovery"), /require a fresh context with LEDGER_ME=reader/)
  writeFileSync(join(directory, "B-notes.md"), "passes: 1 sweeps, 1 lenses, 1 probes, 1 diff reviews\nretrospective: nothing new\n\n## Goal closure\n\nok\n\n## Domain scenarios\n\nok\n")
  expectOk(ledger("B", "handoff"), /only you arrange these fresh contexts/)
  writeFileSync(join(directory, "assessment.md"), "Fresh reader checked candidate, claims, and validation against the frozen input.\n")
  expectOk(ledger("reader", "shelved-fix", "review", "S-A-1", "rev=1", "reader=candidate-check", "assessment=assessment.md"), /recipient seat: master\nboth reviewers handed off with nothing ready/)

  expectRefused(ledger("A", "report"), /master prints/)
  const report = expectOk(ledger("master", "report"), /Two reviewers, opus-reviewer \(A\) and codex-reviewer \(B\)/)
  assert.match(report.out, /Notes from opus-reviewer \(A\)/)
  assert.match(report.out, /rule 3 found it/)
  expectOk(ledger("master", "check-in", "approve", "shelves=S-A-1", "approval=user said go", "executor=A"), /recipient seat: A\nready for you: K-M-1/)
  expectOk(ledger("A", "check-in", "record", "K-M-1", "rev=1", "changeset=cs 16"), /checked in as cs 16/)
  const final = expectOk(ledger("master", "report"), /\| K-M-1 \| S-A-1 \| A \| checked in \| cs 16 \|/)
  assert.match(final.out, /### Where the time went/)
  assert.match(final.out, /\| A \| [\d:.]+ \| [\dhms .]+ \| checkout: fix I-A-1 \|/)
  assert.match(final.out, /\| B \| [\d:.]+ \| [\dhms .]+ \| idle: handed off; waiting on A \|/, "B's wait on A's check-in is on the record")
  assert.match(final.out, /\| master \| [\d:.]+ \| [\dhms .]+ \| idle: waiting on the reviewers \|/)
  const timeline = expectOk(ledger("master", "timeline"), /### What each agent was doing or waiting on/)
  assert.match(timeline.out, /\| A \| [\d:.]+ \| [\dhms .]+ \| cold pass \|/)
})

test("a database from another schema is refused rather than migrated", () => {
  const directory = fresh()
  const ledger = runner(directory)
  const database = new DatabaseSync(join(directory, "ledger.db"))
  database.exec("CREATE TABLE ledger (id INTEGER PRIMARY KEY, schema INTEGER NOT NULL, state TEXT NOT NULL)")
  database.exec("INSERT INTO ledger VALUES (1, 2, '{}')")
  database.close()
  expectRefused(ledger("A", "status"), /schema 2; this script is schema 7/)
})

test("the pinned CLI continues released work and retains a fresh non-writing reader's own assessment", () => {
  const directory = fresh()
  const ledger = runner(directory)
  expectOk(ledger("master", "init", "--joint", "--route", "write", "--names", "A=first-author B=next-author master=lead"))
  for (const seat of ["A", "B"] as const) {
    expectOk(ledger(seat, "init", "--cold"))
    expectOk(ledger(seat, "import"))
  }
  expectOk(ledger("A", "issue", "add", "label=Bug", "certainty=4", "claim=empty input loses saved state", "site=save.ts", "trigger=empty input", "cause=missing branch", "scope=save", "frequency=every empty save", "impact=lost state", "rank=2", "state=verified", "evidence=probe.log"))
  expectOk(ledger("A", "issue", "take", "I-A-1", "rev=1"))
  expectOk(ledger("A", "proposed-fix", "add", "issues=I-A-1", "origin=missing branch", "shape=keep saved state", "sites=save.ts", "rulings=retain saved state", "test=save empty input", "cost=one handler"))
  expectOk(ledger("A", "checkout", "take", "purpose=initial candidate"))
  expectOk(ledger("A", "shelved-fix", "add", "fixes=P-A-1", "artifact=saved-v1.patch", "baseline=frozen-base + user.patch", "validation=validation.md"))
  expectRefused(ledger("A", "proposed-fix", "release", "P-A-1", "rev=1"), /release the checkout/)
  expectRefused(ledger("B", "proposed-fix", "take", "P-A-1", "rev=1"), /owned by A/)
  expectOk(ledger("A", "checkout", "release"))
  const before = read(join(directory, "ledger.db"))
  const shelf = rowsOf(before.state, "Shelved fix")[0]!
  expectOk(ledger("A", "issue", "take", "I-A-1", "rev=1"))
  expectOk(ledger("A", "issue", "release", "I-A-1", "rev=1"))
  expectOk(ledger("B", "issue", "take", "I-A-1", "rev=1"))
  expectRefused(ledger("B", "proposed-fix", "set", "P-A-1", "rev=1", "shape=include empty input"), /take its released proposal/)
  expectRefused(ledger("B", "proposed-fix", "release", "P-A-1", "rev=1"), /only its owner/)
  expectOk(ledger("A", "proposed-fix", "release", "P-A-1", "rev=1"))
  expectOk(ledger("B", "status"), /proposed-fix take P-A-1 rev=1/)
  expectOk(ledger("B", "proposed-fix", "take", "P-A-1", "rev=1"))
  const taken = read(join(directory, "ledger.db"))
  assert.deepEqual(rowsOf(taken.state, "Shelved fix")[0], shelf)
  assert.equal(rowsOf(taken.state, "Proposed fix")[0]?.owner, "B")
  assert.deepEqual(rowsOf(taken.state, "Proposed fix")[0]?.contributors, ["A"])
  expectRefused(ledger("A", "shelved-fix", "review", shelf.id, "rev=1"), /own work/)
  expectRefused(ledger("B", "shelved-fix", "review", shelf.id, "rev=1"), /require a fresh context with LEDGER_ME=reader/)
  writeFileSync(join(directory, "assessment-v1.md"), "Fresh reader checked the first candidate.\n")
  expectOk(ledger("reader", "shelved-fix", "review", shelf.id, "rev=1", "reader=initial-check", "assessment=assessment-v1.md"), /reviewed clean by reader/)
  expectOk(ledger("B", "proposed-fix", "set", "P-A-1", "rev=1", "shape=include empty input"))
  expectOk(ledger("B", "checkout", "take", "purpose=continue retained candidate"))
  writeFileSync(join(directory, "validation-v2.md"), "Continued candidate: saved-v2.patch; empty input now covered; frozen-base + user.patch.\n")
  expectOk(ledger("B", "shelved-fix", "set", shelf.id, "rev=1", "artifact=saved-v2.patch", "validation=validation-v2.md"))
  assert.doesNotMatch(expectOk(ledger("B", "checkout", "release")).out, /only you arrange/)
  expectOk(ledger("A", "status"), /only you arrange these fresh contexts/)
  for (const seat of ["A", "B"] as const) expectRefused(ledger(seat, "shelved-fix", "review", shelf.id, "rev=2"), /own work/)
  expectOk(ledger("reader", "status"), /reader=<fresh context name> assessment=<retained file>/)
  expectRefused(ledger("reader", "checkout", "take", "purpose=write"), /assessments only/)
  expectRefused(ledger("reader", "shelved-fix", "review", shelf.id, "rev=2"), /missing reader/)
  expectRefused(ledger("reader", "shelved-fix", "review", shelf.id, "rev=2", "reader=fresh-42", "assessment=missing.md"), /log does not exist/)
  const assessment = "Fresh context independently checked saved-v2.patch against the frozen baseline; empty input preserves the prior state.\n"
  writeFileSync(join(directory, "assessment.md"), assessment)
  expectRefused(ledger("reader", "shelved-fix", "review", shelf.id, "rev=2", "reader=first-author", "assessment=assessment.md"), /different context/)
  expectRefused(ledger("A", "shelved-fix", "review", shelf.id, "rev=2", "reader=fresh-42", "assessment=assessment.md"), /records its own assessment/)
  expectOk(ledger("reader", "shelved-fix", "review", shelf.id, "rev=2", "reader=fresh-42", "assessment=assessment.md"), /reviewed clean by reader \(fresh-42; assessment assessment\//)
  const after = read(join(directory, "ledger.db"))
  const reviewed = rowsOf(after.state, "Shelved fix")[0]!
  assert.equal(reviewed.author, "A")
  assert.equal(reviewed.editor, "B")
  assert.deepEqual(reviewed.contributors, ["A", "B"])
  assert.equal(reviewed.review?.reader, "fresh-42")
  writeFileSync(join(directory, "assessment.md"), "The source file changed after recording the assessment.")
  assert.equal(readFileSync(join(directory, reviewed.review!.assessment!), "utf8"), assessment)
  assert.equal(readFileSync(join(directory, shelf.validation), "utf8"), "validation.md")
  expectOk(ledger("reader", "timeline", "reader"), /fresh-42/)
  expectOk(ledger("master", "timeline", "P-A-1"), /released by A; candidate and evidence retained/)
  assert.ok(after.events.some((event) => event.command === "proposed-fix.take" && event.note.includes("authorship")))
})

test("resolved conditions return to review through the pinned CLI without new validation or candidate revisions", () => {
  const directory = fresh()
  const ledger = runner(directory)
  expectOk(ledger("A", "init", "--single", "--route", "write"))
  expectOk(ledger("A", "proposed-fix", "add", "goal=delete drafts at sign-out", "origin=user experience", "shape=delete the saved draft", "sites=session.ts", "rulings=deletion policy needs confirmation", "test=sign-out persistence check", "cost=one handler"))
  expectOk(ledger("A", "checkout", "take", "purpose=save candidate"))
  expectOk(ledger("A", "shelved-fix", "add", "fixes=P-A-1", "artifact=delete-draft.patch", "baseline=base-sha", "validation=validation.md"))
  expectOk(ledger("A", "checkout", "release"))
  const before = rowsOf(read(join(directory, "ledger.db")).state, "Shelved fix")[0]!
  expectOk(ledger("B", "shelved-fix", "review", before.id, "rev=1", "conditions=confirm deletion at sign-out with the user"))
  expectOk(ledger("A", "status"), /shelved-fix request-review/)
  expectOk(ledger("A", "question", "add", "fix=P-A-1", "question=delete at sign-out?", "options=keep,delete", "recommendation=delete", "effect=persistence after sign-out", "cost=one handler"))
  expectRefused(ledger("A", "shelved-fix", "request-review", before.id, "rev=1", "reason=ready"), /waits for the user's answer/)
  expectRefused(ledger("B", "shelved-fix", "review", before.id, "rev=1"), /waits for the user's answer/)
  expectOk(ledger("master", "question", "answer", "Q-A-1", "rev=1", "answer=delete at sign-out"))
  expectRefused(ledger("A", "shelved-fix", "request-review", before.id, "rev=1"), /reason/)
  expectOk(ledger("A", "shelved-fix", "request-review", before.id, "rev=1", "reason=the user chose the behavior already covered by the retained candidate and validation"))
  const pending = rowsOf(read(join(directory, "ledger.db")).state, "Shelved fix")[0]!
  assert.equal(pending.conditions, "confirm deletion at sign-out with the user", "the request preserves conditions until review")
  expectOk(ledger("B", "status"), /shelved-fix review S-A-1 rev=1/)
  expectOk(ledger("B", "shelved-fix", "review", before.id, "rev=1", "conditions=the ruling is settled; check the cancellation path"))
  expectOk(ledger("B", "shelved-fix", "review", before.id, "rev=1"), /reviewed clean/)
  const after = read(join(directory, "ledger.db"))
  const shelf = rowsOf(after.state, "Shelved fix")[0]!
  assert.deepEqual(shelf, { ...before, state: "reviewed", review: shelf.review, updated: shelf.updated })
  assert.equal(after.events.filter((event) => event.command === "shelved-fix.set").length, 0)
  assert.ok(after.events.some((event) => event.command === "shelved-fix.request-review" && event.note.includes("the user chose")))
  const timeline = expectOk(ledger("A", "timeline", before.id))
  assert.match(timeline.out, /confirm deletion at sign-out with the user/)
  assert.match(timeline.out, /check the cancellation path/)
  expectOk(ledger("A", "report"), /Ready to report/)
})

test("a feature continues from report-only to a reviewed candidate with retained, refreshed validation", () => {
  const directory = fresh()
  const ledger = runner(directory)
  expectOk(ledger("A", "init", "--single", "--route", "write", "--how-far", "report-only"))
  expectOk(ledger("A", "proposed-fix", "add", "goal=resume a draft without losing focus", "origin=human experience goal", "shape=restore the saved field and focus", "sites=form.ts:20", "rulings=user asked to restore focus", "test=acceptance scenario for keyboard-only resume", "cost=one local state transition"))
  expectOk(ledger("A", "report"), /Implementation report/)
  expectOk(ledger("A", "run", "set", "how_far=fix", "reason=user: implement that proposal"), /how far: fix/)
  expectOk(ledger("A", "checkout", "take", "purpose=retain the implementation"))
  const firstRecord = "Claim: restored drafts preserve focus. Alternative: value restores but focus is lost.\nMethod: keyboard resume acceptance run on form.ts, base abc123, candidate draft-v1.patch.\nObserved: focus and value restored, run.log. Limit: desktop keyboard path.\n"
  writeFileSync(join(directory, "validation.md"), firstRecord)
  expectOk(ledger("A", "shelved-fix", "add", "fixes=P-A-1", "artifact=draft-v1.patch", "baseline=abc123 + user.patch", "validation=validation.md"))
  expectOk(ledger("A", "checkout", "release"))
  expectOk(ledger("B", "shelved-fix", "review", "S-A-1", "rev=1", "conditions=preserve focus on retry too"))
  expectOk(ledger("A", "checkout", "take", "purpose=retry correction"))
  expectRefused(ledger("A", "shelved-fix", "set", "S-A-1", "rev=1", "artifact=draft-v2.patch", "validation=validation.md"), /refresh the validation record/)
  writeFileSync(join(directory, "validation.md"), firstRecord.replace("draft-v1.patch", "draft-v2.patch") + "Retry scenario passes too: retry.log.\n")
  expectOk(ledger("A", "shelved-fix", "set", "S-A-1", "rev=1", "artifact=draft-v2.patch", "validation=validation.md"))
  expectOk(ledger("A", "checkout", "release"))
  expectOk(ledger("B", "shelved-fix", "review", "S-A-1", "rev=2"))
  const report = expectOk(ledger("A", "report"), /Ready to report/)
  assert.match(report.out, /resume a draft without losing focus/)
  assert.match(report.out, /draft-v2.patch/)
  assert.match(report.out, /abc123 \+ user.patch/)
  const database = new DatabaseSync(join(directory, "ledger.db"))
  const saved = JSON.parse((database.prepare("SELECT state FROM ledger WHERE id = 1").get() as { state: string }).state)
  database.close()
  assert.equal(saved.rows.filter((row: { kind: string }) => row.kind === "Issue").length, 0, "feature writing needs no invented defect")
  const events = expectOk(ledger("A", "timeline", "S-A-1"))
  const paths = [...events.out.matchAll(/validation\/([a-f0-9]+)\.txt/g)].map((match) => `validation/${match[1]}.txt`)
  assert.ok(paths.some((path) => readFileSync(join(directory, path), "utf8") === firstRecord), "earlier validation survives when its source file is revised")
})
