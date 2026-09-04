import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ALLOW_NO_RED_ANSWER,
  initialProtocolState,
  transition,
  type DomainEvent,
  type ProtocolCommand,
  type ProtocolState,
} from "../src/protocol.js";
import {
  renderReport,
  renderStatus,
  uncoveredDeclaredClusters,
} from "../src/report.js";

interface Fixture {
  readonly state: ProtocolState;
  readonly events: readonly DomainEvent[];
}

function fixture(noRed = false): Fixture {
  let state = initialProtocolState({
    campaignId: "campaign-report-tests",
    mode: "single",
    route: "diagnose",
    policy: "fix",
    declaredCoverage: [{ coverageKind: "cluster", target: "c1" }],
  });
  const events: DomainEvent[] = [];
  const apply = (command: ProtocolCommand): void => {
    const result = transition(state, command);
    assert.equal(result.ok, true, result.ok ? undefined : result.error.message);
    if (!result.ok) return;
    state = result.state;
    events.push(...result.events);
  };

  apply({
    type: "coverage.add",
    actor: "A",
    at: "2026-09-04T00:00:00.000Z",
    id: "C-A-1",
    coverageKind: "cluster",
    target: "c1",
  });
  apply({
    type: "coverage.cover",
    actor: "A",
    at: "2026-09-04T00:01:00.000Z",
    id: "C-A-1",
    expectedRevision: 0,
    evidence: "coverage.log",
  });
  apply({
    type: "issue.add",
    actor: "A",
    at: "2026-09-04T00:02:00.000Z",
    id: "I-A-1",
    label: noRed ? "Restructure" : "Bug",
    certainty: 4,
    clusters: ["c1"],
    facts: {
      proposition: "a request can receive stale data",
      site: "src/request.ts:10",
      trigger: "two requests overlap",
      cause: "a shared slot stores both results",
      scope: "one request",
      frequency: "every overlapping pair",
      impact: "the user receives another request's data",
      impactRank: 1,
    },
  });
  apply({
    type: "issue.verify",
    actor: "A",
    at: "2026-09-04T00:03:00.000Z",
    id: "I-A-1",
    expectedRevision: 0,
    certainty: 4,
    evidence: "issue-probe.log",
  });
  apply({
    type: "issue.take",
    actor: "A",
    at: "2026-09-04T00:04:00.000Z",
    id: "I-A-1",
    expectedRevision: 1,
  });
  apply({
    type: "proposed-fix.add",
    actor: "A",
    at: "2026-09-04T00:05:00.000Z",
    id: "P-A-1",
    issueIds: ["I-A-1"],
    fix: {
      originClass: noRed ? "design-absence" : "attention-miss",
      shape: "store each result on its request",
      sitesWalked: "src/request.ts:10; src/response.ts:22",
      rulingsChecked: "docs/request-order.md: stable ownership",
      testLocation: noRed ? "none" : "test/request.test.ts",
      cost: "one request-local field",
      interfaceChange: false,
      ownershipChange: false,
      riskSurface: false,
    },
  });

  if (noRed) {
    apply({
      type: "question.add",
      actor: "A",
      at: "2026-09-04T00:06:00.000Z",
      id: "Q-A-1",
      issueIds: ["I-A-1"],
      purpose: "no-red",
      proposedFixRef: { id: "P-A-1", revision: 0 },
      question: "May this architecture-only change be shelved without a red run?",
      options: [ALLOW_NO_RED_ANSWER, "build a new seam"],
      recommendation: "build a new seam",
      userEffect: "waiting adds one review cycle",
      codeCost: "a new test seam touches the request owner",
    });
    apply({
      type: "question.answer",
      actor: "master",
      at: "2026-09-04T00:07:00.000Z",
      id: "Q-A-1",
      expectedRevision: 0,
      answer: ALLOW_NO_RED_ANSWER,
    });
  }

  apply({
    type: "checkout.take",
    actor: "A",
    at: "2026-09-04T00:08:00.000Z",
    purpose: "write P-A-1",
    rowIds: ["P-A-1"],
  });
  apply({
    type: "checkout.baseline",
    actor: "A",
    at: "2026-09-04T00:09:00.000Z",
    buildLog: "baseline-build.log",
    testLog: "baseline-test.log",
  });
  apply({
    type: "shelved-fix.add",
    actor: "A",
    at: "2026-09-04T00:10:00.000Z",
    id: "S-A-1",
    proposedFixIds: ["P-A-1"],
    artifact: "shelve:a-1",
    redRun: noRed ? null : { path: "red.log" },
    greenRun: { path: "green.log" },
  });
  apply({
    type: "checkout.release",
    actor: "A",
    at: "2026-09-04T00:11:00.000Z",
    probesRemoved: true,
    shelvesRecorded: true,
  });
  apply({
    type: "issue.release",
    actor: "A",
    at: "2026-09-04T00:12:00.000Z",
    id: "I-A-1",
    expectedRevision: 1,
  });
  return { state, events };
}

test("report retains issue facts, proposed-fix proof slots, and recorded validation", () => {
  const { state, events } = fixture();
  const report = renderReport(state, { events });

  assert.match(report, /a shared slot stores both results/);
  assert.match(report, /one request; every overlapping pair/);
  assert.match(report, /src\/request\.ts:10; src\/response\.ts:22/);
  assert.match(report, /docs\/request-order\.md: stable ownership/);
  assert.match(report, /Baseline build ran; result retained in baseline-build\.log/);
  assert.match(report, /S-A-1: red run failed on the unfixed code as recorded in red\.log; green run passed as recorded in green\.log/);
  assert.match(report, /recorded normal release declares that no probe remains/);
  assert.ok(report.lastIndexOf("## Validation") > report.lastIndexOf("## Fix table"));
  assert.equal(report.slice(report.lastIndexOf("## Validation")).includes("## Fix table"), false);

  const review = renderReport({ ...state, route: "review" }, { events });
  assert.ok(review.lastIndexOf("## Fix table") > review.lastIndexOf("## Validation"));
  assert.equal(review.slice(review.lastIndexOf("## Fix table")).includes("## Validation"), false);
});

test("no-red validation names the answered authorization Question", () => {
  const { state, events } = fixture(true);
  const report = renderReport(state, { events });
  assert.match(report, /S-A-1: no red log; authorization Questions: Q-A-1; green run passed as recorded in green\.log/);
});

test("ready Question command carries the user-effect and code-cost fields", () => {
  const { state } = fixture();
  const rows = state.rows
    .filter((row) => row.kind !== "Shelved fix" && row.kind !== "Question")
    .map((row) => row.kind === "Proposed fix" ? { ...row, shapeEditCount: 2 } : row);
  const asking: ProtocolState = {
    ...state,
    rows,
    checkout: null,
    issueTakes: [{
      issueId: "I-A-1",
      issueRevision: 1,
      holder: "A",
      takenAt: "2026-09-04T00:04:00.000Z",
    }],
  };
  const status = renderStatus(asking, { actor: "A" });
  assert.match(status, /"\$LEDGER_DIR\/bin\/ledger\.ts" question add[^\n]*user_effect=<effect> code_cost=<cost>/);
});

test("declared cluster matching is token-exact", () => {
  const { state } = fixture();
  const issue = state.rows.find((row) => row.kind === "Issue");
  assert.ok(issue?.kind === "Issue");
  const changed: ProtocolState = {
    ...state,
    declaredCoverage: [{ coverageKind: "cluster", target: "foo" }],
    rows: state.rows.map((row) => row.id === issue.id ? { ...issue, clusters: ["foobar"] } : row),
  };
  assert.deepEqual(uncoveredDeclaredClusters(changed), ["foo"]);
});
