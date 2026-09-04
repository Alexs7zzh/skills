import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { DatabaseSync } from "node:sqlite"

const LEDGER = join(import.meta.dirname, "..", "ledger.ts")

interface Run {
  readonly code: number
  readonly out: string
  readonly err: string
}

function runner(directory: string) {
  return (actor: "A" | "B" | "master", ...args: string[]): Run => {
    const script = existsSync(join(directory, "bin", "ledger.ts")) ? join(directory, "bin", "ledger.ts") : LEDGER
    const child = spawnSync(process.execPath, ["--no-warnings", script, ...args], {
      encoding: "utf8",
      env: { ...process.env, LEDGER_DIR: directory, LEDGER_ME: actor, LEDGER_NOTIFY: "print" },
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
  for (const name of ["probe.log", "red.log", "green.log", "build.log", "test.log"]) writeFileSync(join(directory, name), name)
  return directory
}

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

  expectOk(ledger("A", "proposed-fix", "add", "issues=I-A-1", "origin=attention-miss", "shape=fix the bound", "sites=a.ts:3", "rulings=none", "test=a.test.ts", "cost=one line", "mark=no"))
  expectRefused(ledger("A", "shelved-fix", "add", "fixes=P-A-1", "artifact=stash@0", "red=red.log", "green=green.log"), /take the checkout/)
  expectOk(ledger("A", "checkout", "take", "purpose=fix I-A-1"))
  expectOk(ledger("A", "checkout", "baseline", "build=build.log", "test=test.log"))
  expectOk(ledger("A", "shelved-fix", "add", "fixes=P-A-1", "artifact=stash@0", "red=red.log", "green=green.log"), /S-A-1: shelved P-A-1/)
  expectOk(ledger("A", "checkout", "release"), /dispatch a fresh subagent as B/)
  expectOk(ledger("B", "status"), /shelved-fix review S-A-1 rev=1/)
  expectRefused(ledger("A", "shelved-fix", "review", "S-A-1", "rev=1"), /nobody marks their own work/)
  expectOk(ledger("B", "shelved-fix", "review", "S-A-1", "rev=1"), /reviewed clean by B/)
  expectOk(ledger("A", "status"), /next for A: "\$LEDGER_DIR\/bin\/ledger.ts" report/)

  const report = expectOk(ledger("A", "report"), /The run is done/)
  assert.match(report.out, /\| 1 \| I-A-1 \| Bug \| verified \| 4 \|/)
  assert.match(report.out, /S-A-1 reviewed/)
  assert.ok(existsSync(join(directory, "report.md")))
  assert.match(readFileSync(join(directory, "report.md"), "utf8"), /^# Review report/)
  expectOk(ledger("A", "timeline", "B"), /shelved-fix.review/)
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
  expectOk(ledger("A", "status"), /import this cold pass into the shared database/)
  expectOk(ledger("A", "import"), /imported 2 rows from A/)
  expectOk(ledger("B", "import"), /imported 1 rows from B/)
  expectOk(ledger("B", "status"), /issue agree I-A-1 rev=1/)

  expectOk(ledger("B", "issue", "agree", "I-A-1", "rev=1"), /message for opus-reviewer: ready for you: I-A-1/)
  expectOk(ledger("A", "issue", "take", "I-A-1", "rev=1"))
  expectOk(ledger("A", "proposed-fix", "add", "issues=I-A-1", "origin=design-absence", "shape=one owner per save", "sites=x.ts:9,y.ts:2", "rulings=none", "test=x.test.ts", "cost=two files"), /message for codex-reviewer/)
  expectOk(ledger("B", "proposed-fix", "mark", "P-A-1", "rev=1"))
  expectOk(ledger("A", "checkout", "take", "purpose=fix I-A-1"))
  expectRefused(ledger("B", "checkout", "take", "purpose=probe"), /held by A/)
  expectOk(ledger("A", "shelved-fix", "add", "fixes=P-A-1", "artifact=cs 15", "red=red.log", "green=green.log"), /message for codex-reviewer: ready for you: S-A-1/)
  expectRefused(ledger("A", "handoff"), /release the checkout/)
  expectOk(ledger("A", "checkout", "release"))
  expectRefused(ledger("A", "handoff"), /A-notes.md/)
  writeFileSync(join(directory, "A-notes.md"), "passes: 1 sweeps, 2 lenses, 1 probes, 0 diff reviews\nretrospective: rule 3 found it\n\n## Goal closure\n\nok\n\n## Domain scenarios\n\nok\n")
  expectRefused(ledger("A", "handoff"), /skipped:/)
  writeFileSync(join(directory, "A-notes.md"), "passes: 1 sweeps, 2 lenses, 1 probes, 0 diff reviews\nskipped: diff reviews, none of mine were shelved by B\nretrospective: rule 3 found it\n\n## Goal closure\n\nok\n\n## Domain scenarios\n\nok\n")
  expectOk(ledger("A", "handoff"), /message for codex-reviewer: A handed off. Awaiting you: S-A-1/)
  expectRefused(ledger("B", "handoff"), /ready work remains: S-A-1/)
  expectOk(ledger("B", "shelved-fix", "review", "S-A-1", "rev=1"))
  writeFileSync(join(directory, "B-notes.md"), "passes: 1 sweeps, 1 lenses, 1 probes, 1 diff reviews\nretrospective: nothing new\n\n## Goal closure\n\nok\n\n## Domain scenarios\n\nok\n")
  expectOk(ledger("B", "handoff"), /message for lead: both reviewers handed off with nothing ready/)

  expectRefused(ledger("A", "report"), /master prints/)
  const report = expectOk(ledger("master", "report"), /Two reviewers, opus-reviewer \(A\) and codex-reviewer \(B\)/)
  assert.match(report.out, /Notes from opus-reviewer \(A\)/)
  assert.match(report.out, /rule 3 found it/)
  expectOk(ledger("master", "check-in", "approve", "shelves=S-A-1", "approval=user said go", "executor=A"), /message for opus-reviewer: ready for you: K-M-1/)
  expectOk(ledger("A", "check-in", "record", "K-M-1", "rev=1", "changeset=cs 16"), /checked in as cs 16/)
  expectOk(ledger("master", "report"), /\| K-M-1 \| S-A-1 \| A \| checked in \| cs 16 \|/)
})

test("a database from another schema is refused rather than migrated", () => {
  const directory = fresh()
  const ledger = runner(directory)
  const database = new DatabaseSync(join(directory, "ledger.db"))
  database.exec("CREATE TABLE ledger (id INTEGER PRIMARY KEY, schema INTEGER NOT NULL, state TEXT NOT NULL)")
  database.exec("INSERT INTO ledger VALUES (1, 2, '{}')")
  database.close()
  expectRefused(ledger("A", "status"), /schema 2; this script is schema 3/)
})
