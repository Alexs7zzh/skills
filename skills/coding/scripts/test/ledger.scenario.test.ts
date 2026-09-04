import assert from "node:assert/strict";
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ledger = join(here, "..", "ledger.ts");
const isoTime = /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z\b/;

type Actor = "A" | "B" | "master";
type Result = ReturnType<typeof spawnSync>;

interface ProposedFixOptions {
  originClass?: "attention-miss" | "self-consistency" | "design-absence";
  test?: string;
  guardrail?: string;
  coordination?: string;
}

interface Run {
  directory: string;
  notificationsFile: string;
  notify: string;
}

interface Notification {
  to: string;
  message: string;
}

function scratch(prefix: string): Run {
  const directory = mkdtempSync(join(tmpdir(), prefix));
  const notify = join(directory, "notify.mjs");
  const notificationsFile = join(directory, "notifications.jsonl");
  writeFileSync(
    notify,
    `#!/usr/bin/env node
import { appendFileSync } from "node:fs";
appendFileSync(process.env.LEDGER_TEST_NOTIFICATIONS, JSON.stringify({
  to: process.argv[2],
  message: process.argv.slice(3).join(" "),
}) + "\\n");
`,
  );
  chmodSync(notify, 0o755);
  return { directory, notificationsFile, notify };
}

function run(fixture: Run, actor: Actor, ...args: string[]): Result {
  return spawnSync(process.execPath, ["--no-warnings", ledger, ...args], {
    encoding: "utf8",
    env: {
      ...process.env,
      LEDGER_DIR: fixture.directory,
      LEDGER_ME: actor,
      LEDGER_NOTIFY: fixture.notify,
      LEDGER_TEST_NOTIFICATIONS: fixture.notificationsFile,
    },
  });
}

function output(result: Result): string {
  return `${result.stdout ?? ""}${result.stderr ?? ""}`;
}

function ok(result: Result, expected?: RegExp): string {
  assert.equal(result.status, 0, output(result));
  const text = output(result);
  if (expected) assert.match(text, expected);
  return text;
}

function bad(result: Result, expected: RegExp): string {
  assert.notEqual(result.status, 0, output(result));
  const text = output(result);
  assert.match(text, expected);
  return text;
}

function notifications(fixture: Run): Notification[] {
  try {
    return readFileSync(fixture.notificationsFile, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Notification);
  } catch (error) {
    const missing = error as NodeJS.ErrnoException;
    if (missing.code === "ENOENT") return [];
    throw error;
  }
}

function writeNotes(fixture: Run): void {
  const text = "passes: 1 sweeps, 1 lenses, 0 probes, 0 diff reviews\nskipped: probes and diff reviews had no applicable rows\nretrospective: no issues found\n";
  writeFileSync(join(fixture.directory, "A-notes.md"), text);
  writeFileSync(join(fixture.directory, "B-notes.md"), text);
}

function writeSingleNotes(fixture: Run): void {
  writeFileSync(
    join(fixture.directory, "A-notes.md"),
    "passes: 1 sweeps, 0 lenses, 0 probes, 0 diff reviews\nskipped: lenses, probes, and diff reviews had no applicable rows\nretrospective: no issues found\n",
  );
}

function recordCheckoutBaseline(fixture: Run, actor: "A" | "B"): void {
  const build = join(fixture.directory, `${actor}-baseline-build.log`);
  const owningTest = join(fixture.directory, `${actor}-baseline-test.log`);
  writeFileSync(build, "baseline build passed\n");
  writeFileSync(owningTest, "baseline owning test passed\n");
  ok(run(fixture, actor, "checkout", "baseline", `build=${build}`, `test=${owningTest}`));
}

function initSingle(fixture: Run, howFar: "fix" | "report-only" | "check-in" = "fix"): void {
  ok(run(fixture, "A", "init", "--single", "--route", "diagnose", "--how-far", howFar, "--clusters", "c1"));
}

function initJointCold(
  fixture: Run,
  howFar: "fix" | "report-only" | "check-in" = "fix",
  clusters = "c1",
  route: "review" | "diagnose" = "diagnose",
): void {
  const args = [
    "init",
    "--joint",
    join(fixture.directory, "report.md"),
    "--route",
    route,
    "--names",
    "A=reviewer-a B=reviewer-b master=review-master",
    "--clusters",
    clusters,
  ];
  if (route === "review") args.push("--hunks", "changed-hunk");
  if (howFar !== "fix") args.push("--how-far", howFar);
  ok(run(fixture, "master", ...args));
  ok(run(fixture, "A", "init", "--cold"));
  ok(run(fixture, "B", "init", "--cold"));
}

function initJoint(
  fixture: Run,
  howFar: "fix" | "report-only" | "check-in" = "fix",
  clusters = "c1",
  route: "review" | "diagnose" = "diagnose",
): void {
  initJointCold(fixture, howFar, clusters, route);
  ok(run(fixture, "A", "coverage", "add", "kind=cluster", "target=c1", "state=covered", "note=walked"));
  ok(run(fixture, "B", "coverage", "add", "kind=cluster", "target=c1", "state=covered", "note=walked"));
  if (route === "review") {
    ok(run(fixture, "A", "coverage", "add", "kind=hunk", "target=changed-hunk", "state=covered", "note=walked"));
    ok(run(fixture, "B", "coverage", "add", "kind=hunk", "target=changed-hunk", "state=covered", "note=walked"));
  }
  ok(run(fixture, "A", "import"));
  ok(run(fixture, "B", "import"));
}

function addVerifiedIssue(
  fixture: Run,
  actor: "A" | "B" = "A",
  label: "Bug" | "Restructure" | "Hardening" | "Nit" | "telemetry-quality" = "Bug",
): string {
  const probe = `${actor}-issue-probe.log`;
  writeFileSync(join(fixture.directory, probe), "reproduced\n");
  const text = ok(run(
    fixture,
    actor,
    "issue",
    "add",
    `label=${label}`,
    "state=verified",
    "certainty=4",
    "site=src/example.ts:10",
    "claim=request can return stale data",
    "trigger=two requests overlap",
    "cause=the second request reads the first result",
    "scope=one request",
    "frequency=whenever the requests overlap",
    "impact=the user receives stale data",
    "impact_rank=1",
    `evidence=${probe}`,
  ));
  const id = text.match(/\bI-[AB]-\d+\b/)?.[0];
  assert.ok(id, `issue id missing from output: ${text}`);
  return id;
}

function addProposedFix(
  fixture: Run,
  actor: "A" | "B",
  issue: string,
  options: ProposedFixOptions = {},
): string {
  const originClass = options.originClass ?? "attention-miss";
  const fields = [
    `issues=${issue}`,
    `origin_class=${originClass}`,
    "shape=keep each request result with its request",
    "sites=src/example.ts:10",
    "rulings=none",
    `test=${options.test ?? "src/example.test.ts"}`,
    "cost=one request-local value and one regression test",
  ];
  if (options.guardrail) fields.push(`guardrail=${options.guardrail}`);
  if (options.coordination) fields.push(`coordination=${options.coordination}`);
  const text = ok(run(
    fixture,
    actor,
    "proposed-fix",
    "add",
    ...fields,
  ));
  const id = text.match(/\bP-[AB]-\d+\b/)?.[0];
  assert.ok(id, `proposed-fix id missing from output: ${text}`);
  return id;
}

function addShelvedFix(
  fixture: Run,
  actor: "A" | "B",
  proposedFix: string,
  suffix = "1",
): string {
  const red = `${actor}-red-${suffix}.log`;
  const green = `${actor}-green-${suffix}.log`;
  writeFileSync(join(fixture.directory, red), "FAIL stale data returned\n");
  writeFileSync(join(fixture.directory, green), "PASS request-local data returned\n");
  const text = ok(run(
    fixture,
    actor,
    "shelved-fix",
    "add",
    `proposed_fixes=${proposedFix}`,
    `artifact=shelve:${actor.toLowerCase()}-${suffix}`,
    `red=${red}`,
    `green=${green}`,
  ));
  const id = text.match(/\bS-[AB]-\d+\b/)?.[0];
  assert.ok(id, `shelved-fix id missing from output: ${text}`);
  return id;
}

function assertReadySummary(text: string): void {
  assert.match(text, /(?:\bA\b.*\bready\b|\bready\b.*\bA\b)/i);
  assert.match(text, /(?:\bB\b.*\bready\b|\bready\b.*\bB\b)/i);
  assert.match(text, /\bnext\b/i);
}

function readyCount(text: string, actor: "A" | "B"): number {
  const actorFirst = text.match(new RegExp(`\\b${actor}\\b[^\\n]*\\bready(?: work)?\\b\\s*:?\\s*(\\d+)`, "i"));
  const readyFirst = text.match(new RegExp(`\\bready(?: work)?(?: for)?\\s+${actor}\\b\\s*:?\\s*(\\d+)`, "i"));
  const match = actorFirst ?? readyFirst;
  assert.ok(match, `${actor} ready-work count missing: ${text}`);
  return Number(match[1]);
}

function exactReadyCommand(text: string, operation: RegExp): string[] {
  assert.match(text, /`"\$LEDGER_DIR\/bin\/ledger\.ts" [^`]+`/);
  assert.doesNotMatch(text, /`ledger(?:\s|`)/);
  const commands = [...text.matchAll(/`"\$LEDGER_DIR\/bin\/ledger\.ts" ([^`]+)`/g)]
    .map((match) => match[1]!);
  const command = commands.find((candidate) => operation.test(candidate));
  assert.ok(command, `ready command ${operation} missing: ${text}`);
  return command.split(" ");
}

test("single report-only run uses the public row vocabulary without fix gates", () => {
  const fixture = scratch("ledger-report-only-");
  const fixFixture = scratch("ledger-single-fix-");
  const footerFixture = scratch("ledger-single-footer-");
  const coverageFlagsFixture = scratch("ledger-coverage-flags-");
  try {
    const help = ok(run(fixture, "A", "--help"));
    for (const word of ["coverage", "issue", "question", "proposed-fix", "shelved-fix", "checkout", "check-in", "handoff", "status", "report", "timeline"]) {
      assert.match(help, new RegExp(`\\b${word}\\b`));
    }
    assert.match(help, /\brun\b/);
    assert.match(ok(run(fixture, "A", "issue", "--help")), /add[\s\S]*set[\s\S]*agree[\s\S]*take[\s\S]*release[\s\S]*exit/i);
    assert.match(ok(run(fixture, "A", "checkout", "--help")), /take[\s\S]*baseline[\s\S]*release[\s\S]*force-release/i);
    assert.match(ok(run(fixture, "A", "question", "--help")), /purpose=<decision\|no-red>[\s\S]*allow-no-red/i);
    assert.match(ok(run(fixture, "A", "check-in", "--help")), /approval[\s\S]*departures/i);

    ok(run(
      coverageFlagsFixture,
      "A",
      "init",
      "--single",
      "--route",
      "review",
      "--how-far",
      "report-only",
      "--hunks",
      "src/first.ts:1,src/second.ts:2",
      "--scenarios",
      "overlapping requests,cancelled request",
    ));
    const coverageFlagStatus = ok(run(coverageFlagsFixture, "A", "status"));
    assert.match(coverageFlagStatus, /hunk[^\n]*src\/first\.ts:1/i);
    assert.match(coverageFlagStatus, /hunk[^\n]*src\/second\.ts:2/i);
    assert.match(coverageFlagStatus, /scenario[^\n]*overlapping requests/i);
    assert.match(coverageFlagStatus, /scenario[^\n]*cancelled request/i);
    ok(run(coverageFlagsFixture, "A", "run", "escalate"));
    assert.match(ok(run(coverageFlagsFixture, "A", "status")), /Run: deep review/i);
    assert.match(ok(run(coverageFlagsFixture, "A", "timeline", "A")), /run escalate \((?:—|run)\)[^\n]*quick[^\n]*deep/i);

    const emptyDiagnosis = scratch("ledger-empty-diagnosis-");
    try {
      bad(run(emptyDiagnosis, "A", "init", "--single", "--route", "diagnose"), /symptom|cluster/i);
    } finally {
      rmSync(emptyDiagnosis.directory, { recursive: true, force: true });
    }

    initSingle(fixture, "report-only");
    ok(run(fixture, "A", "coverage", "add", "kind=cluster", "target=c1", "state=covered", "note=walked"));
    const issue = addVerifiedIssue(fixture);
    ok(run(fixture, "A", "issue", "take", issue, "rev=0"));
    const proposedFix = addProposedFix(fixture, "A", issue);
    ok(run(fixture, "A", "issue", "release", issue, "rev=0"));
    writeSingleNotes(fixture);
    const report = ok(run(fixture, "A", "report"));

    assert.match(report, /report-only/i);
    assert.match(report, new RegExp(issue));
    assert.match(report, new RegExp(proposedFix));
    assert.match(
      readFileSync(join(fixture.directory, "diagnose-report.md"), "utf8"),
      /report record \((?:—|report)\)[^\n]*unreported[^\n]*reported/,
      "the persisted final report must include its own timestamped checkpoint transition",
    );
    assert.match(report, /proposed fix/i);
    assert.doesNotMatch(report, /certificate|signature/i);
    bad(run(fixture, "A", "sign"), /unknown|usage|command/i);
    bad(run(fixture, "A", "converge"), /unknown|usage|command/i);

    initSingle(fixFixture);
    ok(run(fixFixture, "A", "coverage", "add", "kind=cluster", "target=c1", "state=covered", "note=walked"));
    const fixIssue = addVerifiedIssue(fixFixture);
    ok(run(fixFixture, "A", "issue", "take", fixIssue, "rev=0"));
    const fix = addProposedFix(fixFixture, "A", fixIssue);
    ok(run(fixFixture, "A", "checkout", "take", "purpose=write single-seat fix", `rows=${fix}`));
    recordCheckoutBaseline(fixFixture, "A");
    const shelf = addShelvedFix(fixFixture, "A", fix);
    ok(run(fixFixture, "A", "checkout", "release"));
    ok(run(fixFixture, "A", "issue", "release", fixIssue, "rev=0"));
    const singleStatus = ok(run(fixFixture, "A", "status"));
    assert.match(singleStatus, /single-reviewer[\s\S]*fresh diff review/i);
    assert.equal(readyCount(singleStatus, "B"), 1, singleStatus);
    bad(run(fixFixture, "A", "handoff"), /joint|single|not used/i);
    const reviewCommand = exactReadyCommand(singleStatus, /^shelved-fix review /);
    assert.equal(
      reviewCommand.filter((argument) => argument.startsWith("rev=")).length,
      1,
      `generated command has duplicate revision fields: ledger ${reviewCommand.join(" ")}`,
    );
    ok(run(fixFixture, "B", ...reviewCommand));
    writeSingleNotes(fixFixture);
    ok(run(fixFixture, "A", "report"));
    bad(run(fixFixture, "master", "check-in", "approve", `shelves=${shelf}`), /approval/i);
    writeFileSync(
      join(fixFixture.directory, "A-notes.md"),
      "passes: 1 sweeps, 0 lenses, 0 probes, 1 diff reviews\nskipped: lenses and probes had no applicable rows\nretrospective: the fresh diff review confirmed the shelf\n",
    );
    bad(run(
      fixFixture,
      "master",
      "check-in",
      "approve",
      `shelves=${shelf}`,
      "approval=user approved the single shelf",
    ), /notes changed|stale/i);
    ok(run(fixFixture, "A", "report"));
    assert.match(
      readFileSync(join(fixFixture.directory, "diagnose-report.md"), "utf8"),
      /report record \((?:—|report)\)[^\n]*reported[^\n]*reported/,
      "rerendering after a notes edit must refresh the report checkpoint",
    );
    const approved = ok(run(
      fixFixture,
      "master",
      "check-in",
      "approve",
      `shelves=${shelf}`,
      "approval=user approved the single shelf",
    ));
    const checkIn = approved.match(/\bK-M-\d+\b/)?.[0];
    assert.ok(checkIn, approved);
    ok(run(fixFixture, "master", "check-in", "record", checkIn, "rev=0", "changeset=single-1", "departures=none"));

    initSingle(footerFixture);
    ok(run(footerFixture, "A", "coverage", "add", "kind=cluster", "target=c1", "state=covered", "note=walked"));
    const footerIssue = addVerifiedIssue(footerFixture);
    ok(run(
      footerFixture,
      "A",
      "question",
      "add",
      `issues=${footerIssue}`,
      "purpose=decision",
      "question=Should the request keep its own result?",
      "options=keep request ownership, cancel the older request",
      "user_effect=keeping ownership preserves both requests; cancellation drops the older request",
      "code_cost=keeping ownership changes one value; cancellation adds a cancellation path",
      "recommendation=keep request ownership",
    ));
    const answeredFooter = ok(run(
      footerFixture,
      "master",
      "question",
      "answer",
      "Q-A-1",
      "rev=0",
      "answer=keep request ownership",
    ));
    assert.match(answeredFooter, /wait[^\n]*(?:reviewer|ready work)|(?:reviewer|ready work)[^\n]*wait/i);
    assert.doesNotMatch(answeredFooter, /next for master:\s*run ledger report/i);
  } finally {
    rmSync(fixture.directory, { recursive: true, force: true });
    rmSync(fixFixture.directory, { recursive: true, force: true });
    rmSync(footerFixture.directory, { recursive: true, force: true });
    rmSync(coverageFlagsFixture.directory, { recursive: true, force: true });
  }
});

test("clean two-seat handoff notifies the master when no ready work remains", () => {
  const fixture = scratch("ledger-clean-handoff-");
  const reviewNotesFixture = scratch("ledger-review-notes-");
  try {
    initJointCold(fixture, "report-only");
    const openCoverage = ok(run(fixture, "A", "coverage", "add", "kind=cluster", "target=c1"));
    const coverage = openCoverage.match(/\bC-A-\d+\b/)?.[0];
    assert.ok(coverage, `Coverage id missing from output: ${openCoverage}`);
    bad(run(fixture, "A", "import"), /ready work|unfinished|not ready/i);
    ok(run(fixture, "A", "coverage", "set", coverage, "rev=0", "state=covered", "note=walked after failed import"));
    const issue = addVerifiedIssue(fixture, "A");
    ok(run(fixture, "B", "coverage", "add", "kind=cluster", "target=c1", "state=covered", "note=walked"));

    assert.equal(notifications(fixture).length, 0, "cold mutations must not notify peers or master");
    ok(run(fixture, "A", "import"));
    assert.equal(notifications(fixture).length, 0, "the first import must not reveal ready work to the cold peer");
    const coldStatus = ok(run(fixture, "B", "status"));
    assert.match(coldStatus, /cold independence/i);
    assert.doesNotMatch(coldStatus, new RegExp(issue));
    bad(run(fixture, "B", "report"), /import.*cold|cold.*import/i);

    const sealedDirectory = join(fixture.directory, "sealed-cold-copy");
    mkdirSync(sealedDirectory);
    copyFileSync(join(fixture.directory, "cold-A.db"), join(sealedDirectory, "ledger.db"));
    const sealedFixture: Run = { ...fixture, directory: sealedDirectory };
    bad(
      run(sealedFixture, "A", "coverage", "add", "kind=cluster", "target=after-import", "state=covered", "note=late"),
      /sealed/i,
    );

    ok(run(fixture, "B", "import"));
    assert.ok(
      notifications(fixture).some(({ to, message }) => to === "reviewer-b" && message.includes(issue)),
      JSON.stringify(notifications(fixture), null, 2),
    );
    ok(run(fixture, "B", "issue", "agree", issue, "rev=0"));
    ok(run(fixture, "A", "issue", "take", issue, "rev=0"));
    const proposedFix = addProposedFix(fixture, "A", issue);
    ok(run(fixture, "A", "issue", "release", issue, "rev=0"));
    ok(run(fixture, "B", "proposed-fix", "mark", proposedFix, "rev=0"));
    writeNotes(fixture);
    const before = ok(run(fixture, "A", "status"));
    assertReadySummary(before);
    ok(run(fixture, "A", "handoff"));
    ok(run(fixture, "B", "handoff"));

    const sent = notifications(fixture);
    const completed = sent.filter(({ to, message }) =>
      to === "review-master" && /(?:no ready work|reviewers.*done|both.*handoff)/i.test(message));
    assert.equal(completed.length, 1, JSON.stringify(sent, null, 2));
    assert.match(completed[0]!.message, /"\$LEDGER_DIR\/bin\/ledger\.ts" report/);
    assert.doesNotMatch(completed[0]!.message, /\bledger report\b/);
    rmSync(join(fixture.directory, "A-notes.md"));
    bad(run(fixture, "master", "report"), /A-notes\.md/i);
    writeNotes(fixture);
    rmSync(join(fixture.directory, "B-notes.md"));
    bad(run(fixture, "master", "report"), /B-notes\.md/i);
    writeNotes(fixture);
    ok(run(fixture, "master", "report"));

    initJoint(reviewNotesFixture, "report-only", "c1", "review");
    writeFileSync(
      join(reviewNotesFixture.directory, "A-notes.md"),
      "passes: 1 sweeps, 1 lenses, 0 probes, 0 diff reviews\nskipped: probes and diff reviews had no applicable rows\nretrospective: no issues found\n## Goal closure\n\n## Domain scenarios\n",
    );
    bad(run(reviewNotesFixture, "A", "handoff"), /nonempty Goal closure/i);
    writeFileSync(
      join(reviewNotesFixture.directory, "A-notes.md"),
      "passes: 1 sweeps, 1 lenses, 0 probes, 0 diff reviews\nskipped: probes and diff reviews had no applicable rows\nretrospective: no issues found\n## Goal closure\n\nThe user-visible request result stays with its caller.\n\n## Domain scenarios\n\nOverlapping requests: ownership traced; covered; clean.\n",
    );
    bad(run(reviewNotesFixture, "A", "handoff"), /closed N issues/i);
    writeFileSync(
      join(reviewNotesFixture.directory, "A-notes.md"),
      "passes: 1 sweeps, 1 lenses, 0 probes, 0 diff reviews\nskipped: probes and diff reviews had no applicable rows\nretrospective: no issues found\nclosed 0 issues: 0 by execution, 0 by proof, 0 by evidence\n## Goal closure\n\nThe user-visible request result stays with its caller.\n\n## Domain scenarios\n\nOverlapping requests: ownership traced; covered; clean.\n",
    );
    ok(run(reviewNotesFixture, "A", "handoff"));
  } finally {
    rmSync(fixture.directory, { recursive: true, force: true });
    rmSync(reviewNotesFixture.directory, { recursive: true, force: true });
  }
});

test("reviewer A can carry a verified issue through a reviewed shelved fix", () => {
  const fixture = scratch("ledger-a-fix-");
  try {
    initJoint(fixture);
    ok(run(fixture, "A", "status"), /(?:how far|policy)[^\n]*fix/i);
    const issue = addVerifiedIssue(fixture, "A", "Restructure");
    ok(run(fixture, "B", "issue", "set", issue, "rev=0", "impact=stale data reaches every overlapping request"));
    ok(run(fixture, "A", "issue", "agree", issue, "rev=1"));
    bad(run(
      fixture,
      "A",
      "proposed-fix",
      "add",
      `issues=${issue}`,
      "origin_class=attention-miss",
      "shape=keep each request result with its request",
      "sites=src/example.ts:10",
      "rulings=none",
      "test=src/example.test.ts",
      "cost=one request-local value and one regression test",
    ), /take/i);
    ok(run(fixture, "A", "issue", "take", issue, "rev=1"));
    const proposedFix = addProposedFix(fixture, "A", issue, { originClass: "design-absence", test: "none" });
    ok(run(fixture, "A", "issue", "release", issue, "rev=1"));
    ok(run(fixture, "B", "proposed-fix", "mark", proposedFix, "rev=0"));
    const greenOnly = "A-green-without-red.log";
    writeFileSync(join(fixture.directory, greenOnly), "PASS request-local data returned\n");
    ok(run(
      fixture,
      "A",
      "question",
      "add",
      `issues=${issue}`,
      `proposed_fix=${proposedFix}`,
      "purpose=no-red",
      "question=No shipped test can reach this architecture boundary; may this fix be shelved without a red log?",
      "options=allow-no-red, require-red",
      "user_effect=allowing proceeds with the reviewed fix; requiring red leaves the issue open",
      "code_cost=allowing records the architecture exception; requiring red needs a new test seam first",
      "recommendation=allow-no-red",
    ));
    bad(run(
      fixture,
      "A",
      "shelved-fix",
      "add",
      `proposed_fixes=${proposedFix}`,
      "artifact=shelve:a-not-yet-authorized",
      `green=${greenOnly}`,
    ), /checkout|question|red/i);
    ok(run(fixture, "master", "question", "answer", "Q-A-1", "rev=0", "answer=allow-no-red"));
    ok(run(fixture, "A", "issue", "take", issue, "rev=1"));
    ok(run(fixture, "A", "checkout", "take", "purpose=write shelved fix", `rows=${proposedFix}`));
    recordCheckoutBaseline(fixture, "A");
    const authorized = ok(run(
      fixture,
      "A",
      "shelved-fix",
      "add",
      `proposed_fixes=${proposedFix}`,
      "artifact=shelve:a-no-red-authorized",
      `green=${greenOnly}`,
    ));
    const shelvedFix = authorized.match(/\bS-A-\d+\b/)?.[0];
    assert.ok(shelvedFix, `shelved-fix id missing from output: ${authorized}`);
    ok(run(fixture, "A", "checkout", "release"));
    ok(run(fixture, "A", "issue", "release", issue, "rev=1"));
    ok(run(fixture, "B", "shelved-fix", "review", shelvedFix, "rev=0"));

    const report = ok(run(fixture, "master", "report"));
    assert.match(report, new RegExp(`${shelvedFix}[^\\n]*reviewed`, "i"));
    assert.match(report, new RegExp(`${issue}[\\s\\S]*${proposedFix}[\\s\\S]*${shelvedFix}`, "i"));
  } finally {
    rmSync(fixture.directory, { recursive: true, force: true });
  }
});

test("reviewer B can shelve while checkout ownership excludes the other writer", () => {
  const fixture = scratch("ledger-b-checkout-");
  try {
    initJoint(fixture);
    const issue = addVerifiedIssue(fixture, "A");
    ok(run(fixture, "B", "issue", "agree", issue, "rev=0"));
    ok(run(fixture, "B", "issue", "take", issue, "rev=0"));
    const proposedFix = addProposedFix(fixture, "B", issue);
    ok(run(fixture, "B", "issue", "release", issue, "rev=0"));
    ok(run(fixture, "A", "proposed-fix", "mark", proposedFix, "rev=0"));
    ok(run(fixture, "B", "issue", "take", issue, "rev=0"));

    ok(run(fixture, "B", "checkout", "take", "purpose=record the shared baseline", `rows=${proposedFix}`));
    bad(run(fixture, "A", "checkout", "take", "purpose=inspect shelved fix", `rows=${proposedFix}`), /held|checkout.*B|B.*checkout/i);
    const held = ok(run(fixture, "A", "status"));
    assert.match(held, /checkout[\s\S]*B[\s\S]*record the shared baseline/i);
    bad(run(fixture, "master", "checkout", "release"), /A or B|reviewer|force-release/i);
    const forcedReason = "user directed recovery before baseline";
    ok(run(fixture, "master", "checkout", "force-release", `reason=${forcedReason}`));
    assert.match(ok(run(fixture, "master", "timeline", "master")), new RegExp(forcedReason));

    ok(run(fixture, "B", "checkout", "take", "purpose=write shelved fix", `rows=${proposedFix}`));
    recordCheckoutBaseline(fixture, "B");
    const shelfStatus = ok(run(fixture, "B", "status"));
    const shelfCommand = exactReadyCommand(shelfStatus, /^shelved-fix add /);
    assert.match(shelfCommand.join(" "), new RegExp(`proposed_fixes=${proposedFix}(?:\\s|$)`));
    const sameLog = "B-red-and-green.log";
    writeFileSync(join(fixture.directory, sameLog), "one run cannot be both red and green\n");
    bad(run(
      fixture,
      "B",
      "shelved-fix",
      "add",
      `proposed_fixes=${proposedFix}`,
      "artifact=shelve:b-same-log",
      `red=${sameLog}`,
      `green=${sameLog}`,
    ), /different|same/i);
    const red = "B-ready-red.log";
    const green = "B-ready-green.log";
    writeFileSync(join(fixture.directory, red), "FAIL stale result\n");
    writeFileSync(join(fixture.directory, green), "PASS request-local result\n");
    const executableShelf = shelfCommand.map((argument) => {
      if (argument === "artifact=<shelve>") return "artifact=shelve:b-ready";
      if (argument === "red=<path>") return `red=${red}`;
      if (argument === "green=<path>") return `green=${green}`;
      return argument;
    });
    const shelved = ok(run(fixture, "B", ...executableShelf));
    const shelvedFix = shelved.match(/\bS-B-\d+\b/)?.[0];
    assert.ok(shelvedFix, `shelved-fix id missing from ready command output: ${shelved}`);
    ok(run(fixture, "B", "checkout", "release"));
    ok(run(fixture, "B", "issue", "release", issue, "rev=0"));
    ok(run(fixture, "A", "shelved-fix", "review", shelvedFix, "rev=0"));
    ok(run(fixture, "master", "report"), new RegExp(`${shelvedFix}[^\\n]*reviewed`, "i"));
  } finally {
    rmSync(fixture.directory, { recursive: true, force: true });
  }
});

test("shelved-fix conditions route correction to the author and require a fresh review", () => {
  const fixture = scratch("ledger-fix-conditions-");
  try {
    initJoint(fixture);
    const issue = addVerifiedIssue(fixture, "A");
    ok(run(fixture, "B", "issue", "agree", issue, "rev=0"));
    ok(run(fixture, "A", "issue", "take", issue, "rev=0"));
    const proposedFix = addProposedFix(fixture, "A", issue, {
      originClass: "self-consistency",
      guardrail: "the regression test compares against an independent expected value",
      coordination: "shelve with the request ownership direction",
    });
    const directionOutput = ok(run(
      fixture,
      "A",
      "proposed-fix",
      "add",
      `issues=${issue}`,
      "kind=direction",
      "shape=move request result ownership before later cleanup",
      "cost=one ownership move before the code fix",
      "coordination=apply before the shelved code fix",
    ));
    const direction = directionOutput.match(/\bP-A-\d+\b/)?.[0];
    assert.ok(direction, `direction id missing from output: ${directionOutput}`);
    ok(run(fixture, "A", "issue", "release", issue, "rev=0"));
    ok(run(fixture, "B", "proposed-fix", "mark", proposedFix, "rev=0"));
    ok(run(fixture, "B", "proposed-fix", "mark", direction, "rev=0"));
    ok(run(fixture, "A", "issue", "take", issue, "rev=0"));
    ok(run(fixture, "A", "checkout", "take", "purpose=write shelved fix", `rows=${proposedFix}`));
    recordCheckoutBaseline(fixture, "A");
    const shelvedFix = addShelvedFix(fixture, "A", proposedFix);
    ok(run(fixture, "A", "checkout", "release"));
    ok(run(fixture, "A", "issue", "release", issue, "rev=0"));

    ok(run(
      fixture,
      "B",
      "shelved-fix",
      "conditions",
      shelvedFix,
      "rev=0",
      "conditions=preserve the raw failure when saving the summary fails",
    ));
    const authorStatus = ok(run(fixture, "A", "status"));
    assert.match(authorStatus, new RegExp(`${shelvedFix}[\\s\\S]*condition`, "i"));

    const red = "A-red-2.log";
    const green = "A-green-2.log";
    writeFileSync(join(fixture.directory, red), "FAIL raw failure removed\n");
    writeFileSync(join(fixture.directory, green), "PASS raw failure retained\n");
    ok(run(fixture, "A", "issue", "take", issue, "rev=0"));
    ok(run(fixture, "A", "checkout", "take", "purpose=answer review condition", `rows=${shelvedFix}`));
    ok(run(
      fixture,
      "A",
      "shelved-fix",
      "set",
      shelvedFix,
      "rev=1",
      "artifact=shelve:a-2",
      `red=${red}`,
      `green=${green}`,
    ));
    ok(run(fixture, "A", "checkout", "release"));
    ok(run(fixture, "A", "issue", "release", issue, "rev=0"));

    const peerStatus = ok(run(fixture, "B", "status"));
    assert.match(peerStatus, new RegExp(`${shelvedFix}[\\s\\S]*review`, "i"));
    ok(run(fixture, "B", "shelved-fix", "review", shelvedFix, "rev=2"));
    const report = ok(run(fixture, "master", "report"), new RegExp(`${shelvedFix}[^\\n]*reviewed`, "i"));
    assert.match(report, /independent expected value/i);
    assert.match(report, /shelve with the request ownership direction/i);
    assert.match(report, /move request result ownership before later cleanup/i);
    assert.match(report, /apply before the shelved code fix/i);
  } finally {
    rmSync(fixture.directory, { recursive: true, force: true });
  }
});

test("an answered question notifies its author and resumes only its linked issue", () => {
  const fixture = scratch("ledger-question-");
  const shapeFixture = scratch("ledger-shape-question-");
  try {
    initJoint(fixture);
    const linked = addVerifiedIssue(fixture, "A");
    const unrelated = addVerifiedIssue(fixture, "B");
    ok(run(fixture, "B", "issue", "agree", linked, "rev=0"));
    ok(run(fixture, "A", "issue", "agree", unrelated, "rev=0"));
    ok(run(
      fixture,
      "A",
      "question",
      "add",
      `issues=${linked}`,
      "question=Should overlapping requests keep independent results?",
      "purpose=decision",
      "options=(a) yes, preserve both (b) cancel the older request",
      "user_effect=(a) preserves both results; (b) drops the older request",
      "code_cost=(a) stores a request-local value; (b) adds cancellation",
      "recommendation=(a) because callers already own both requests",
    ));
    ok(run(
      fixture,
      "B",
      "question",
      "add",
      `issues=${unrelated}`,
      "question=Should the optional diagnostic be kept?",
      "purpose=decision",
      "options=(a) keep it (b) remove it",
      "user_effect=(a) preserves the diagnostic; (b) removes it",
      "code_cost=(a) keeps one field; (b) removes its readers",
      "recommendation=(a) because existing callers read it",
    ));

    const asked = notifications(fixture).filter(({ to, message }) => to === "review-master" && /Q-[AB]-1/.test(message));
    assert.equal(asked.length, 2, JSON.stringify(notifications(fixture), null, 2));
    assert.match(asked[0]!.message, /question answer Q-A-1/i);
    assert.match(asked[1]!.message, /Q-A-1[\s\S]*Q-B-1|Q-B-1[\s\S]*Q-A-1/i);
    const waiting = ok(run(fixture, "A", "status"));
    assert.match(waiting, /Q-A-1[\s\S]*open/i);
    assert.match(waiting, /Q-B-1[\s\S]*open/i);
    bad(run(fixture, "A", "issue", "take", linked, "rev=0"), /question|Q-A-1|waiting|blocked/i);

    ok(run(fixture, "master", "question", "answer", "Q-A-1", "rev=0", "answer=(a) preserve both"));
    const resumed = ok(run(fixture, "A", "status"));
    assert.match(resumed, new RegExp(`${linked}[\\s\\S]*(?:proposed.fix|fix)`, "i"));
    assert.match(resumed, /Q-B-1[\s\S]*open/i);
    ok(run(fixture, "A", "issue", "take", linked, "rev=0"));
    bad(run(fixture, "A", "issue", "take", unrelated, "rev=0"), /question|Q-B-1|waiting|blocked/i);
    const delivered = notifications(fixture).filter(({ to, message }) => to === "reviewer-a" && /Q-A-1|I-A-1/.test(message));
    assert.ok(delivered.some(({ message }) => /status|proposed-fix/i.test(message)), JSON.stringify(delivered, null, 2));
    ok(run(fixture, "A", "issue", "release", linked, "rev=0"));

    initJoint(shapeFixture);
    const shapeIssue = addVerifiedIssue(shapeFixture, "A");
    ok(run(shapeFixture, "B", "issue", "agree", shapeIssue, "rev=0"));
    ok(run(shapeFixture, "A", "issue", "take", shapeIssue, "rev=0"));
    const shapeFix = addProposedFix(shapeFixture, "A", shapeIssue, {
      originClass: "self-consistency",
      guardrail: "assert the delivered request id",
    });
    ok(run(shapeFixture, "A", "issue", "release", shapeIssue, "rev=0"));
    ok(run(shapeFixture, "B", "proposed-fix", "reject", shapeFix, "rev=0", "reason=first shape misses cleanup"));
    ok(run(shapeFixture, "A", "proposed-fix", "set", shapeFix, "rev=1", "shape=keep request id through cleanup"));
    ok(run(shapeFixture, "B", "proposed-fix", "reject", shapeFix, "rev=2", "reason=second shape changes ownership"));

    const shapeStatus = ok(run(shapeFixture, "A", "status"));
    const shapeQuestionCommand = exactReadyCommand(shapeStatus, /^question add /);
    const shapeQuestionText = shapeQuestionCommand.join(" ");
    assert.match(shapeQuestionText, new RegExp(`issues=${shapeIssue}(?:\\s|$)`));
    assert.match(shapeQuestionText, new RegExp(`proposed_fix=${shapeFix}(?:\\s|$)`));
    const executableQuestion = shapeQuestionCommand.map((argument) => {
      if (argument === "question=<question>") return "question=Which ownership shape should this fix use?";
      if (argument === "options=<options>") return "options=keep request ownership, move result ownership";
      if (argument === "user_effect=<effect>") return "user_effect=both prevent stale results; the second changes cancellation";
      if (argument === "code_cost=<cost>") return "code_cost=the first edits one site; the second moves the owner";
      if (argument === "recommendation=<choice>") return "recommendation=keep request ownership";
      return argument;
    });
    ok(run(shapeFixture, "A", ...executableQuestion), /Q-A-1/);
  } finally {
    rmSync(fixture.directory, { recursive: true, force: true });
    rmSync(shapeFixture.directory, { recursive: true, force: true });
  }
});

test("approved check-in records a changeset and every actor has a timestamped timeline", () => {
  const fixture = scratch("ledger-check-in-timeline-");
  try {
    initJoint(fixture, "check-in");
    writeNotes(fixture);
    const issue = addVerifiedIssue(fixture, "A");
    ok(run(fixture, "B", "issue", "agree", issue, "rev=0"));
    ok(run(fixture, "A", "issue", "take", issue, "rev=0"));
    const proposedFix = addProposedFix(fixture, "A", issue);
    ok(run(fixture, "A", "issue", "release", issue, "rev=0"));
    ok(run(fixture, "B", "proposed-fix", "mark", proposedFix, "rev=0"));
    ok(run(fixture, "A", "issue", "take", issue, "rev=0"));
    ok(run(fixture, "A", "checkout", "take", "purpose=write approved fix", `rows=${proposedFix}`));
    recordCheckoutBaseline(fixture, "A");
    const shelvedFix = addShelvedFix(fixture, "A", proposedFix);
    ok(run(fixture, "A", "checkout", "release"));
    ok(run(fixture, "A", "issue", "release", issue, "rev=0"));
    ok(run(fixture, "B", "shelved-fix", "review", shelvedFix, "rev=0"));
    ok(run(fixture, "A", "handoff"));
    ok(run(fixture, "B", "handoff"));
    ok(run(fixture, "master", "report"));

    bad(run(fixture, "master", "check-in", "approve", `shelves=${shelvedFix}`), /approval/i);
    const approved = ok(run(
      fixture,
      "master",
      "check-in",
      "approve",
      `shelves=${shelvedFix}`,
      "approval=user approved this shelf",
    ));
    const checkIn = approved.match(/\bK-M-\d+\b/)?.[0];
    assert.ok(checkIn, `check-in id missing from output: ${approved}`);
    ok(run(
      fixture,
      "master",
      "check-in",
      "record",
      checkIn,
      "rev=0",
      "changeset=381b16084f61",
      "departures=none",
    ));

    const report = ok(run(fixture, "master", "report"));
    assert.match(report, new RegExp(`${checkIn}[^\\n]*checked[ -]in`, "i"));
    assert.match(report, /381b16084f61/);

    const timelines = new Map<Actor, string>([
      ["A", ok(run(fixture, "A", "timeline", "A"))],
      ["B", ok(run(fixture, "B", "timeline", "B"))],
      ["master", ok(run(fixture, "master", "timeline", "master"))],
    ]);
    for (const [actor, timeline] of timelines) {
      assert.match(timeline, isoTime, `${actor} timeline has no timestamp: ${timeline}`);
      const eventLines = timeline.split("\n").filter((line) => /\b(?:I|P|S|K)-[ABM]-\d+\b/.test(line));
      assert.ok(eventLines.length > 0, `${actor} timeline has no state changes: ${timeline}`);
      for (const line of eventLines) assert.match(line, isoTime, `state change lacks a timestamp: ${line}`);
    }
    assert.match(timelines.get("A")!, new RegExp(`${issue}|${proposedFix}|${shelvedFix}`));
    assert.match(timelines.get("B")!, /agree|mark|review/i);
    assert.match(timelines.get("master")!, new RegExp(checkIn));
  } finally {
    rmSync(fixture.directory, { recursive: true, force: true });
  }
});

test("issue ownership is explicit and handoff refuses a held checkout", () => {
  const fixture = scratch("ledger-work-ownership-");
  const checkoutFixture = scratch("ledger-handoff-checkout-");
  try {
    initJoint(fixture);
    const issue = addVerifiedIssue(fixture, "A");
    ok(run(fixture, "B", "issue", "agree", issue, "rev=0"));
    writeNotes(fixture);

    ok(run(fixture, "A", "issue", "take", issue, "rev=0"));
    bad(run(fixture, "A", "handoff"), /ready work|release.*issue|issue.*take/i);
    bad(run(fixture, "B", "issue", "take", issue, "rev=0"), /taken|owned|assigned|\bA\b/i);
    const owned = ok(run(fixture, "B", "status"));
    assert.match(owned, new RegExp(`${issue}[^\\n]*(?:taken|owned|assigned)[^\\n]*A`, "i"));

    ok(run(fixture, "A", "issue", "release", issue, "rev=0"));
    ok(run(fixture, "B", "issue", "take", issue, "rev=0"));
    ok(run(fixture, "B", "issue", "release", issue, "rev=0"));

    initJoint(checkoutFixture);
    writeNotes(checkoutFixture);
    const checkoutIssue = addVerifiedIssue(checkoutFixture, "A");
    ok(run(checkoutFixture, "B", "issue", "agree", checkoutIssue, "rev=0"));
    ok(run(checkoutFixture, "B", "issue", "take", checkoutIssue, "rev=0"));
    const checkoutFix = addProposedFix(checkoutFixture, "B", checkoutIssue);
    ok(run(checkoutFixture, "B", "issue", "release", checkoutIssue, "rev=0"));
    ok(run(checkoutFixture, "A", "proposed-fix", "mark", checkoutFix, "rev=0"));
    ok(run(checkoutFixture, "B", "issue", "take", checkoutIssue, "rev=0"));
    ok(run(
      checkoutFixture,
      "B",
      "checkout",
      "take",
      "purpose=inspect the shared checkout",
      `rows=${checkoutFix}`,
    ));
    recordCheckoutBaseline(checkoutFixture, "B");
    bad(run(checkoutFixture, "B", "handoff"), /release.*checkout|checkout.*held|holds.*checkout/i);
    const stillHeld = ok(run(checkoutFixture, "B", "status"));
    assert.match(stillHeld, /checkout[\s\S]*B[\s\S]*inspect the shared checkout/i);
    addShelvedFix(checkoutFixture, "B", checkoutFix, "handoff");
    ok(run(checkoutFixture, "B", "checkout", "release"));
    ok(run(checkoutFixture, "B", "issue", "release", checkoutIssue, "rev=0"));
  } finally {
    rmSync(fixture.directory, { recursive: true, force: true });
    rmSync(checkoutFixture.directory, { recursive: true, force: true });
  }
});

test("an open Hardening row is reported but never creates ready work or blocks completion", () => {
  const fixture = scratch("ledger-hardening-");
  const unsafeFixture = scratch("ledger-report-safety-");
  const coverageFixture = scratch("ledger-cluster-coverage-");
  try {
    const names = "A=reviewer-a B=reviewer-b master=review-master";
    bad(run(
      unsafeFixture,
      "master",
      "init",
      "--joint",
      join(unsafeFixture.directory, "A-notes.md"),
      "--route",
      "diagnose",
      "--names",
      names,
    ), /overwrite|ledger state|reserved/i);
    bad(run(
      unsafeFixture,
      "master",
      "init",
      "--joint",
      join(tmpdir(), "outside-ledger-report.md"),
      "--route",
      "diagnose",
      "--names",
      names,
    ), /inside|stay inside|report path/i);

    initJointCold(coverageFixture, "report-only", "foo bar");
    for (const actor of ["A", "B"] as const) {
      ok(run(
        coverageFixture,
        actor,
        "coverage",
        "add",
        "kind=cluster",
        "target=foobar",
        "state=covered",
        "note=substring lookalike",
      ));
      bad(run(coverageFixture, actor, "import"), /cluster 'foo'|cluster 'bar'|no result/i);
      ok(run(
        coverageFixture,
        actor,
        "coverage",
        "add",
        "kind=cluster",
        "target=foo,bar (2/2)",
        "state=covered",
        "note=both exact tokens walked",
      ));
      ok(run(coverageFixture, actor, "import"));
    }
    const coverageReport = ok(run(coverageFixture, "master", "report"));
    assert.match(coverageReport, /cluster[^\n]*foo[^\n]*covered/i);
    assert.match(coverageReport, /cluster[^\n]*bar[^\n]*covered/i);

    initJoint(fixture);
    const probe = "hardening-probe.log";
    writeFileSync(join(fixture.directory, probe), "low-impact defect reproduced\n");
    const created = ok(run(
      fixture,
      "A",
      "issue",
      "add",
      "label=Hardening",
      "state=verified",
      "certainty=4",
      "site=src/example.ts:30",
      "claim=an optional diagnostic omits one field",
      "trigger=a diagnostic is emitted",
      "cause=the optional field is not copied",
      "scope=diagnostic output only",
      "frequency=every matching diagnostic",
      "impact=one optional field is absent",
      "impact_rank=1",
      `evidence=${probe}`,
    ));
    const issue = created.match(/\bI-A-\d+\b/)?.[0];
    assert.ok(issue, `Hardening id missing from output: ${created}`);

    const nitOutput = ok(run(
      fixture,
      "A",
      "issue",
      "add",
      "label=Nit",
      "certainty=2",
      "site=src/example.ts:31",
      "claim=rename one local on the next edit",
    ));
    const nit = nitOutput.match(/\bI-A-\d+\b/)?.[0];
    assert.ok(nit, `Nit id missing from output: ${nitOutput}`);

    const rulingIssue = addVerifiedIssue(fixture, "A");
    bad(run(
      fixture,
      "A",
      "issue",
      "exit",
      rulingIssue,
      "rev=0",
      "kind=ruling-or-baseline",
      "reference=docs/decision.md",
    ), /independent|checked|mark/i);
    ok(run(fixture, "B", "issue", "agree", rulingIssue, "rev=0"));
    ok(run(
      fixture,
      "A",
      "issue",
      "exit",
      rulingIssue,
      "rev=0",
      "kind=ruling-or-baseline",
      "reference=docs/decision.md",
    ));

    const assumedOutput = ok(run(
      fixture,
      "A",
      "issue",
      "add",
      "label=Bug",
      "state=assumed",
      "certainty=3",
      "site=src/example.ts:40",
      "claim=an unavailable provider may return stale data",
      "trigger=the unavailable provider callback runs",
      "cause=the provider behavior cannot be observed here",
      "scope=provider callback",
      "frequency=unknown",
      "impact=the request may receive stale data",
      "impact_rank=1",
      "assumption=the provider can reuse the old result",
      "no_probe_reason=the provider runtime is unavailable",
    ));
    const assumed = assumedOutput.match(/\bI-A-\d+\b/)?.[0];
    assert.ok(assumed, `assumed Issue id missing from output: ${assumedOutput}`);
    ok(run(fixture, "A", "issue", "exit", assumed, "rev=0", "kind=todo", "reference=TODO.md provider probe"));

    for (const label of ["Bug", "Restructure"] as const) {
      const disproved = addVerifiedIssue(fixture, "A", label);
      bad(run(
        fixture,
        "A",
        "issue",
        "exit",
        disproved,
        "rev=0",
        "kind=comment-or-assert",
        "reference=src/example.ts:10",
      ), /disproved/i);
      ok(run(
        fixture,
        "B",
        "issue",
        "disprove",
        disproved,
        "rev=0",
        "certainty=3",
        "evidence=all callers serialize requests",
      ));
      const disprovedStatus = ok(run(fixture, "B", "status"));
      const exitCommand = exactReadyCommand(
        disprovedStatus,
        new RegExp(`^issue exit ${disproved} rev=1 `),
      );
      assert.match(exitCommand.join(" "), /kind=comment-or-assert/);
      assert.match(exitCommand.join(" "), /reference=<comment-or-assert>/);
      const executableExit = exitCommand.map((argument) =>
        argument === "reference=<comment-or-assert>"
          ? `reference=src/example.ts:10 ${label} assertion`
          : argument,
      );
      ok(run(fixture, "B", ...executableExit));
    }

    const status = ok(run(fixture, "A", "status"));
    assert.equal(readyCount(status, "A"), 0, status);
    assert.equal(readyCount(status, "B"), 0, status);
    assert.match(status, new RegExp(`${issue}[^\\n]*Hardening`, "i"));
    assert.match(status, new RegExp(`${nit}[^\\n]*Nit`, "i"));
    bad(run(fixture, "A", "report"), /master/i);
    writeNotes(fixture);
    ok(run(fixture, "A", "handoff"));
    ok(run(fixture, "B", "handoff"));

    const sent = notifications(fixture);
    assert.ok(
      sent.some(({ to, message }) =>
        to === "review-master" && /(?:no ready work|reviewers.*done|both.*handoff)/i.test(message)),
      JSON.stringify(sent, null, 2),
    );
    const report = ok(run(fixture, "master", "report"));
    assert.match(report, new RegExp(`${issue}[^\\n]*Hardening`, "i"));
    assert.match(report, new RegExp(`${issue}[^\\n]*open`, "i"));
    assert.match(report, new RegExp(`${nit}[^\\n]*Nit`, "i"));
  } finally {
    rmSync(fixture.directory, { recursive: true, force: true });
    rmSync(unsafeFixture.directory, { recursive: true, force: true });
    rmSync(coverageFixture.directory, { recursive: true, force: true });
  }
});
