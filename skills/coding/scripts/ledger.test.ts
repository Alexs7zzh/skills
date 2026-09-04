#!/usr/bin/env -S node --no-warnings --test

import assert from "node:assert/strict";
import { copyFileSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const here = dirname(fileURLToPath(import.meta.url));
const ledger = join(here, "ledger.ts");
const schema = join(here, "ledger.sql");
const legacyLedger = resolve(here, "../ledger.sh");

type Actor = "A" | "B" | "fixer" | "master";

function run(directory: string, actor: Actor | "", ...args: string[]) {
  return spawnSync(process.execPath, ["--no-warnings", ledger, ...args], {
    encoding: "utf8",
    env: { ...process.env, LEDGER_DIR: directory, LEDGER_ME: actor, LEDGER_NOTIFY: "true" },
  });
}

function runAsync(directory: string, actor: Actor, args: string[], extraEnv: Record<string, string> = {}): Promise<{ status: number | null; stdout: string; stderr: string }> {
  return new Promise((resolveRun, reject) => {
    const child = spawn(process.execPath, ["--no-warnings", ledger, ...args], {
      env: { ...process.env, LEDGER_DIR: directory, LEDGER_ME: actor, LEDGER_NOTIFY: "true", ...extraEnv },
    });
    let stdout = "", stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (status) => resolveRun({ status, stdout, stderr }));
  });
}

function ok(result: ReturnType<typeof run>, contains = ""): void {
  assert.equal(result.status, 0, result.stderr || result.stdout);
  if (contains) assert.match(result.stdout, new RegExp(escape(contains)));
}
function bad(result: ReturnType<typeof run>, contains: string): void {
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(result.stderr, new RegExp(escape(contains)));
}
function escape(value: string): string { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function scratch(prefix: string): string { return mkdtempSync(join(tmpdir(), prefix)); }
function notes(directory: string, route: "review" | "diagnose" = "diagnose"): void {
  const routeSections = route === "review" ? "\n## Goal closure\nclosed\n## Domain scenarios\ncovered\n" : "";
  for (const actor of ["A", "B"]) writeFileSync(join(directory, `${actor}-notes.md`), `passes: owning suite\nretrospective: no delta\nvote: yes${routeSections}`);
}
function joint(directory: string, policy = "report", clusters = "c1 c2", route: "review" | "diagnose" = "diagnose"): void {
  const args = ["init", "--scribe", "A", "--joint", join(directory, "joint.md"), "--route", route, "--policy", policy,
    "--names", "A=alpha B=beta fixer=fix master=lead"];
  if (clusters) args.push("--clusters", clusters);
  ok(run(directory, "master", ...args));
}
function initCold(directory: string): void { ok(run(directory, "A", "init", "--cold")); ok(run(directory, "B", "init", "--cold")); }

test("single-seat snapshots keep open work, exact coverage, and accepted Nits", () => {
  const directory = scratch("object-ledger-single-");
  try {
    bad(run(directory, "", "init", "--single", "--route", "review"), "LEDGER_ME must be");
    ok(run(directory, "A", "init", "--single", "--route", "review", "--clusters", "foo foobar"), "pinned helper:");
    assert.equal(readFileSync(join(directory, "bin", "ledger.ts"), "utf8"), readFileSync(ledger, "utf8"));
    assert.equal(readFileSync(join(directory, "bin", "ledger.sql"), "utf8"), readFileSync(schema, "utf8"));
    ok(run(directory, "A", "report"), "open 2");
    assert.ok(existsSync(join(directory, "review-report.md")));
    ok(run(directory, "A", "coverage", "add", "kind=cluster", "target=foobar", "state=accounted", "note=clean"));
    const status = run(directory, "A", "status"); ok(status, "uncovered: cluster:foo"); assert.doesNotMatch(status.stdout, /uncovered:.*foobar/);
    ok(run(directory, "A", "claim", "add", "label=Nit", "proposition=wording", "certainty=2"));
    bad(run(directory, "A", "claim", "accept", "C-A-1", "rev=0"), "accepted Claim must be a Nit with disposition");
    ok(run(directory, "A", "claim", "accept", "C-A-1", "rev=0", "reason=accepted debt"), "accepted");
    ok(run(directory, "A", "query", "SELECT state FROM claims WHERE id='C-A-1'"), "accepted");
    bad(run(directory, "A", "claim", "add", "label=Bug", "proposition=incomplete", "certainty=4", "state=verified", "evidence=e"), "needs trigger");
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test("claim revisions stale only linked descendants", () => {
  const directory = scratch("object-ledger-invalidation-");
  try {
    ok(run(directory, "A", "init", "--single", "--route", "diagnose", "--policy", "land", "--clusters", "c1"));
    ok(run(directory, "A", "claim", "add", "label=Bug", "proposition=bug", "certainty=4", "state=verified", "trigger=t", "cause=c", "impact=i", "evidence=e"));
    ok(run(directory, "A", "coverage", "add", "kind=cluster", "target=c1", "state=accounted", "claim=C-A-1", "evidence=e"));
    ok(run(directory, "A", "remedy", "add", "claims=C-A-1", "origin_class=attention-miss", "fix_shape=f", "sites_walked=s", "rulings_checked=r", "test_seam=exists: t", "cost=c", "risk=low", "stable=yes"));
    ok(run(directory, "A", "remedy", "fixable", "R-A-1", "rev=0"));
    writeFileSync(join(directory, "red.log"), "red\n"); writeFileSync(join(directory, "green.log"), "green\n");
    ok(run(directory, "A", "landing", "add", "remedy=R-A-1", "artifact=patch", "red_run=red.log", "green_run=green.log"));
    ok(run(directory, "A", "landing", "review", "L-A-1", "rev=0"));
    ok(run(directory, "A", "status"), "certificate blockers: 0");
    ok(run(directory, "A", "claim", "set", "C-A-1", "rev=0", "state=verified", "proposition=corrected", "certainty=4"), "linked descendants are stale");
    const status = run(directory, "A", "status");
    ok(status, "Coverage V-A-1 references stale Claim C-A-1");
    assert.match(status.stdout, /Remedy R-A-1 references stale or unsettled Claim C-A-1/);
    assert.match(status.stdout, /Landing L-A-1 references stale Remedy R-A-1/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test("cold seats remain independent and imports merge namespaced objects", () => {
  const directory = scratch("object-ledger-cold-");
  try {
    joint(directory); initCold(directory);
    ok(run(directory, "A", "coverage", "add", "kind=cluster", "target=c1", "state=accounted", "note=clean"));
    ok(run(directory, "A", "import"), "imported A");
    const coldB = run(directory, "B", "status"); ok(coldB, "cold: independent until import"); ok(coldB, "uncovered: cluster:c1, cluster:c2");
    ok(run(directory, "B", "coverage", "add", "kind=cluster", "target=c2", "state=accounted", "note=clean"));
    ok(run(directory, "B", "import"), "imported B");
    ok(run(directory, "A", "status"), "uncovered: none");
    ok(run(directory, "master", "query", "SELECT count(*) FROM coverage"), "2");
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test("joint Check in campaign reaches an exhaustive certificate", () => {
  const directory = scratch("object-ledger-flow-");
  try {
    joint(directory, "check-in", "c1 c2", "review"); initCold(directory);
    ok(run(directory, "A", "claim", "add", "label=Bug", "proposition=bug", "certainty=4", "state=verified", "trigger=t", "cause=c", "impact=i", "evidence=e"));
    ok(run(directory, "A", "coverage", "add", "kind=cluster", "target=c1", "state=accounted", "claim=C-A-1", "evidence=e"));
    ok(run(directory, "B", "coverage", "add", "kind=cluster", "target=c2", "state=accounted", "note=clean"));
    ok(run(directory, "A", "import")); ok(run(directory, "B", "import"));
    ok(run(directory, "B", "claim", "agree", "C-A-1", "rev=0"));
    ok(run(directory, "A", "decision", "add", "claims=C-A-1", "state=needs-ruling", "question=which shape", "options=(a) narrow (b) broad", "recommendation=(a)"));
    ok(run(directory, "master", "decision", "decide", "D-A-1", "rev=0", "answer=(a)"));
    ok(run(directory, "B", "decision", "review", "D-A-1", "rev=1", "verdict=agree"));
    ok(run(directory, "A", "remedy", "add", "claims=C-A-1", "origin_class=attention-miss", "fix_shape=f", "sites_walked=s", "rulings_checked=r", "test_seam=exists: t", "cost=c", "risk=low", "stable=yes"));
    ok(run(directory, "B", "remedy", "review", "R-A-1", "rev=0", "verdict=agree"));
    ok(run(directory, "B", "remedy", "fixable", "R-A-1", "rev=0"));
    writeFileSync(join(directory, "red.log"), "red\n"); writeFileSync(join(directory, "green.log"), "green\n");
    ok(run(directory, "fixer", "landing", "add", "remedy=R-A-1", "artifact=s1", "red_run=red.log", "green_run=green.log"));
    ok(run(directory, "B", "landing", "review", "L-F-1", "rev=0", "verdict=agree"));
    ok(run(directory, "master", "delivery", "add", "landing=L-F-1"));
    ok(run(directory, "master", "delivery", "approve", "Y-M-1", "rev=0"));
    ok(run(directory, "master", "delivery", "check-in", "Y-M-1", "rev=0", "changeset=cs:1"));
    bad(run(directory, "B", "sign"), "Delivery Y-M-1 lacks a current independent agreement");
    ok(run(directory, "A", "delivery", "review", "Y-M-1", "rev=1", "verdict=agree"));
    bad(run(directory, "B", "sign"), "A-notes.md is missing");
    notes(directory, "review"); ok(run(directory, "B", "sign"), "signed by B"); ok(run(directory, "A", "converge"), "blockers 0");
    const report = readFileSync(join(directory, "joint.md"), "utf8");
    assert.match(report, /# Exhaustive certificate/); assert.match(report, /## Remedies/); assert.match(report, /## Goal closure/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test("coverage gaps block certificates but never deadline snapshots", () => {
  const directory = scratch("object-ledger-coverage-");
  try {
    joint(directory, "report"); initCold(directory);
    ok(run(directory, "A", "coverage", "add", "kind=cluster", "target=c1", "state=accounted", "note=clean"));
    ok(run(directory, "A", "import")); ok(run(directory, "B", "import")); notes(directory);
    ok(run(directory, "A", "report"), "open 1");
    bad(run(directory, "B", "sign"), "uncovered cluster c2");
    assert.match(readFileSync(join(directory, "joint.md"), "utf8"), /uncovered cluster c2/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test("campaigns pin both implementations in the correct direction", () => {
  const directory = scratch("object-ledger-pin-");
  try {
    const source = join(directory, "source"), campaign = join(directory, "campaign"); mkdirSync(source); mkdirSync(campaign);
    copyFileSync(ledger, join(source, "ledger.ts")); copyFileSync(schema, join(source, "ledger.sql"));
    const initialized = spawnSync(process.execPath, ["--no-warnings", join(source, "ledger.ts"), "init", "--single", "--route", "diagnose"], {
      encoding: "utf8", env: { ...process.env, LEDGER_DIR: campaign, LEDGER_ME: "A" },
    });
    assert.equal(initialized.status, 0, initialized.stderr);
    writeFileSync(join(source, "ledger.ts"), "throw new Error('incompatible replacement')\n");
    const pinned = spawnSync(process.execPath, ["--no-warnings", join(campaign, "bin", "ledger.ts"), "status"], { encoding: "utf8", env: { ...process.env, LEDGER_DIR: campaign, LEDGER_ME: "A" } });
    assert.equal(pinned.status, 0, pinned.stderr); assert.match(pinned.stdout, /single/);
    const legacyEntry = spawnSync(legacyLedger, ["status"], { encoding: "utf8", env: { ...process.env, LEDGER_DIR: campaign, LEDGER_ME: "A" } });
    assert.equal(legacyEntry.status, 0, legacyEntry.stderr); assert.match(legacyEntry.stdout, /single/);

    const legacyCampaign = join(directory, "legacy"); mkdirSync(legacyCampaign);
    const oldInit = spawnSync(legacyLedger, ["init", "--single", "--route", "diagnose"], { encoding: "utf8", env: { ...process.env, LEDGER_DIR: legacyCampaign, LEDGER_ME: "A" } });
    assert.equal(oldInit.status, 0, oldInit.stderr);
    const modernEntry = run(legacyCampaign, "A", "status"); assert.equal(modernEntry.status, 0, modernEntry.stderr); assert.match(modernEntry.stdout, /single seat A/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test("schema rejects deletion, mutable evidence, and invalid state shortcuts", () => {
  const directory = scratch("object-ledger-schema-");
  try {
    ok(run(directory, "A", "init", "--single", "--route", "diagnose"));
    ok(run(directory, "A", "claim", "add", "label=Nit", "proposition=x", "certainty=2"));
    const db = new DatabaseSync(join(directory, "ledger.db"));
    try {
      assert.throws(() => db.exec("DELETE FROM claims WHERE id='C-A-1'"), /never deleted/);
      assert.throws(() => db.exec("UPDATE claim_revisions SET proposition='raw' WHERE claim_id='C-A-1'"), /immutable/);
      assert.throws(() => db.exec("UPDATE claims SET state='verified' WHERE id='C-A-1'"), /new revision or its current peer mark/);
      assert.throws(() => db.exec("UPDATE claims SET id='C-A-2' WHERE id='C-A-1'"), /id is immutable/);
    } finally { db.close(); }
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test("sign and concurrent mutation cannot leave a usable stale signature", async () => {
  const directory = scratch("object-ledger-sign-race-");
  try {
    joint(directory, "report", ""); initCold(directory); ok(run(directory, "A", "import")); ok(run(directory, "B", "import")); notes(directory);
    const barrier = join(directory, "sign-barrier");
    const signing = runAsync(directory, "B", ["sign"], { LEDGER_TEST_SIGN_BARRIER: barrier });
    for (let attempt = 0; attempt < 200 && !existsSync(`${barrier}.ready`); attempt += 1) await new Promise((done) => setTimeout(done, 10));
    assert.ok(existsSync(`${barrier}.ready`), "sign reached its in-transaction barrier");
    const mutation = runAsync(directory, "A", ["claim", "add", "label=Bug", "proposition=late", "certainty=2"]);
    writeFileSync(`${barrier}.release`, "release\n");
    const [signed, changed] = await Promise.all([signing, mutation]);
    assert.equal(signed.status, 0, signed.stderr); assert.equal(changed.status, 0, changed.stderr);
    ok(run(directory, "master", "query", "SELECT count(*) FROM signatures"), "0");
    bad(run(directory, "A", "converge"), "Claim C-A-1 is candidate");
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test("concurrent public writers serialize", async () => {
  const directory = scratch("object-ledger-writers-");
  try {
    ok(run(directory, "A", "init", "--single", "--route", "diagnose"));
    const writes = Array.from({ length: 16 }, (_, index) => runAsync(directory, "A", ["claim", "add", "label=Nit", `proposition=writer-${index}`, "certainty=2"]));
    const results = await Promise.all(writes); for (const result of results) assert.equal(result.status, 0, result.stderr);
    ok(run(directory, "A", "query", "SELECT count(*) FROM claims"), "16");
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
