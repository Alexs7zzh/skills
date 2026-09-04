import assert from "node:assert/strict"
import test from "node:test"

import * as fc from "fast-check"

import {
  ACTORS,
  ROW_KINDS,
  allowsNoRedRun,
  applyEvent,
  assertTransitionAudit,
  coverageResults,
  decodeProtocolState,
  initialProtocolState,
  otherSeat,
  parseClusterTokens,
  readyWork,
  transition,
  type Actor,
  type CheckInRow,
  type IssueFacts,
  type IssueId,
  type IssueLabel,
  type IssueRow,
  type LedgerRow,
  type Mark,
  type ProtocolCommand,
  type ProtocolState,
  type ProposedFixRow,
  type Seat,
  type ShelvedFixRow
} from "../src/protocol.js"

const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
const NOTES_HASH = "a".repeat(64)

function at(step: number): string {
  return new Date(Date.UTC(2026, 8, 4, 0, 0, step)).toISOString()
}

function facts(seed: string): IssueFacts {
  return {
    proposition: `proposition-${seed}`,
    site: `src/${seed}.ts:1`,
    trigger: `trigger-${seed}`,
    cause: `cause-${seed}`,
    scope: `scope-${seed}`,
    frequency: `frequency-${seed}`,
    impact: `impact-${seed}`,
    impactRank: 3
  }
}

function accepted(state: ProtocolState, command: ProtocolCommand): ProtocolState {
  const result = transition(state, command)
  assertTransitionAudit(command, result)
  const replayed = result.events.reduce(applyEvent, state)
  assert.deepEqual(replayed, result.state, `${command.type} events must replay to the returned state`)
  return result.state
}

function newState(options: Omit<Parameters<typeof initialProtocolState>[0], "campaignId"> = {}): ProtocolState {
  return initialProtocolState({ campaignId: "campaign-property-tests", ...options })
}

function assertIso(value: string): void {
  assert.match(value, ISO_PATTERN)
  assert.equal(new Date(value).toISOString(), value)
}

function assertStateInvariants(state: ProtocolState): void {
  assert.deepEqual(decodeProtocolState(JSON.parse(JSON.stringify(state))), state)
  const ids = state.rows.map((row) => row.id)
  assert.equal(new Set(ids).size, ids.length)
  assert.equal(state.schemaVersion, 1)

  for (const row of state.rows) {
    assert.ok(ROW_KINDS.includes(row.kind))
    assert.ok(Number.isSafeInteger(row.revision) && row.revision >= 0)
    assertIso(row.createdAt)
    assertIso(row.updatedAt)
    assertIso(row.stateChangedAt)
    if ("marks" in row) {
      for (const mark of row.marks) {
        assert.notEqual(mark.reviewer, row.kind === "Issue" ? row.revisionAuthor : row.author)
        assertIso(mark.at)
        assert.ok(Number.isSafeInteger(mark.revision) && mark.revision >= 0)
      }
    }
  }

  const taken = state.issueTakes.map((take) => take.issueId)
  assert.equal(new Set(taken).size, taken.length)
  for (const take of state.issueTakes) {
    assert.ok(ids.includes(take.issueId))
    assertIso(take.takenAt)
  }
  if (state.checkout) assertIso(state.checkout.takenAt)
  for (const notice of state.notifications) assertIso(notice.at)
}

type TraceAction = {
  readonly operation:
    | "add-issue"
    | "verify"
    | "mark"
    | "edit"
    | "take-issue"
    | "release-issue"
    | "add-coverage"
    | "cover"
    | "take-checkout"
    | "baseline"
    | "handoff"
  readonly seat: Seat
  readonly slot: number
  readonly word: string
}

const seatArb = fc.constantFrom<Seat>("A", "B")
const wordArb = fc.stringMatching(/^[a-z]{1,10}$/)
const actionArb: fc.Arbitrary<TraceAction> = fc.record({
  operation: fc.constantFrom(
    "add-issue",
    "verify",
    "mark",
    "edit",
    "take-issue",
    "release-issue",
    "add-coverage",
    "cover",
    "take-checkout",
    "baseline",
    "handoff"
  ),
  seat: seatArb,
  slot: fc.integer({ min: 1, max: 6 }),
  word: wordArb
})

function firstRow<Kind extends LedgerRow["kind"]>(
  state: ProtocolState,
  kind: Kind,
  predicate: (row: Extract<LedgerRow, { kind: Kind }>) => boolean
): Extract<LedgerRow, { kind: Kind }> | undefined {
  const rows = state.rows.filter((row) => row.kind === kind) as Array<
    Extract<LedgerRow, { kind: Kind }>
  >
  return rows.find(predicate)
}

function commandFor(state: ProtocolState, action: TraceAction, step: number): ProtocolCommand | undefined {
  const timestamp = at(step)
  switch (action.operation) {
    case "add-issue":
      return {
        type: "issue.add",
        actor: action.seat,
        at: timestamp,
        id: `I-${action.seat}-${action.slot}`,
        label: "Bug",
        certainty: 4,
        facts: facts(action.word)
      }
    case "verify": {
      const row = firstRow(state, "Issue", (candidate) =>
        candidate.author === action.seat && candidate.state === "new")
      return row && {
        type: "issue.verify",
        actor: action.seat,
        at: timestamp,
        id: row.id,
        expectedRevision: row.revision,
        certainty: 4,
        evidence: `probe-${action.word}`
      }
    }
    case "mark": {
      const row = firstRow(state, "Issue", (candidate) =>
        candidate.author !== action.seat &&
        (candidate.state === "verified" || candidate.state === "assumed") &&
        candidate.marks.length === 0)
      return row && {
        type: "issue.mark",
        actor: action.seat,
        at: timestamp,
        id: row.id,
        expectedRevision: row.revision
      }
    }
    case "edit": {
      const row = firstRow(state, "Issue", (candidate) =>
        candidate.author === action.seat && !candidate.exit && candidate.state !== "accepted")
      return row && {
        type: "issue.edit",
        actor: action.seat,
        at: timestamp,
        id: row.id,
        expectedRevision: row.revision,
        facts: { proposition: `edited-${action.word}` }
      }
    }
    case "take-issue": {
      const row = firstRow(state, "Issue", (candidate) =>
        (candidate.label === "Bug" || candidate.label === "Restructure") &&
        (candidate.state === "verified" || candidate.state === "assumed") &&
        candidate.marks.length > 0 &&
        !state.issueTakes.some((take) => take.issueId === candidate.id))
      return row && {
        type: "issue.take",
        actor: action.seat,
        at: timestamp,
        id: row.id,
        expectedRevision: row.revision
      }
    }
    case "release-issue": {
      const take = state.issueTakes.find((candidate) => candidate.holder === action.seat)
      if (!take) return undefined
      const row = firstRow(state, "Issue", (candidate) => candidate.id === take.issueId)
      return row && {
        type: "issue.release",
        actor: action.seat,
        at: timestamp,
        id: take.issueId,
        expectedRevision: row.revision
      }
    }
    case "add-coverage":
      return {
        type: "coverage.add",
        actor: action.seat,
        at: timestamp,
        id: `C-${action.seat}-${action.slot}`,
        coverageKind: "scenario",
        target: action.word
      }
    case "cover": {
      const row = firstRow(state, "Coverage", (candidate) =>
        candidate.author === action.seat && candidate.state === "open")
      return row && {
        type: "coverage.cover",
        actor: action.seat,
        at: timestamp,
        id: row.id,
        expectedRevision: row.revision,
        evidence: `walk-${action.word}`
      }
    }
    case "take-checkout":
      return {
        type: "checkout.take",
        actor: action.seat,
        at: timestamp,
        purpose: `probe-${action.word}`,
        rowIds: []
      }
    case "baseline":
      return {
        type: "checkout.baseline",
        actor: action.seat,
        at: timestamp,
        buildLog: `build-${action.word}.log`,
        testLog: `test-${action.word}.log`
      }
    case "handoff":
      return { type: "handoff", actor: action.seat, at: timestamp }
  }
}

function assertHeldActorsCannotHandoff(state: ProtocolState, step: number): void {
  for (const seat of ["A", "B"] as const) {
    const holdsCheckout = state.checkout?.holder === seat
    const holdsIssue = state.issueTakes.some((take) => take.holder === seat)
    if (!holdsCheckout && !holdsIssue) continue
    const result = transition(state, { type: "handoff", actor: seat, at: at(step) })
    assert.equal(result.ok, false, `${seat} handed off while retaining a hold`)
  }
}

test("generated valid-ish command traces remain replayable and structurally valid", () => {
  fc.assert(fc.property(fc.array(actionArb, { minLength: 1, maxLength: 80 }), (actions) => {
    let state = {
      ...newState({ declaredCoverage: [{ coverageKind: "hunk", target: "generated trace" }] }),
      imports: { A: true, B: true }
    }
    for (const [index, action] of actions.entries()) {
      const command = commandFor(state, action, index + 1)
      if (!command) continue
      const result = transition(state, command)
      if (!result.ok) continue
      assertTransitionAudit(command, result)
      assert.deepEqual(result.events.reduce(applyEvent, state), result.state)
      state = result.state
      assertStateInvariants(state)
      assertHeldActorsCannotHandoff(state, index + 100)
    }
  }), { numRuns: 150 })
})

function mark(reviewer: Seat, revision: number): readonly [Mark] {
  return [{ reviewer, revision, at: at(2) }]
}

function branch(owner: Seat, number: number): readonly [IssueRow, ProposedFixRow, ShelvedFixRow] {
  const reviewer = otherSeat(owner)
  const issueId = `I-${owner}-${number}` as const
  const proposedId = `P-${owner}-${number}` as const
  const shelvedId = `S-${owner}-${number}` as const
  const issue: IssueRow = {
    id: issueId,
    kind: "Issue",
    author: owner,
    revisionAuthor: owner,
    revision: 2,
    createdAt: at(1),
    updatedAt: at(2),
    stateChangedAt: at(2),
    label: "Bug",
    facts: facts(`${owner}-${number}`),
    parentIssueIds: [],
    clusters: [],
    contestCount: 0,
    editCount: 0,
    state: "verified",
    certainty: 4,
    evidence: "red reproduction",
    marks: mark(reviewer, 2)
  }
  const proposed: ProposedFixRow = {
    id: proposedId,
    kind: "Proposed fix",
    author: owner,
    proposalKind: "proposal",
    revision: 1,
    createdAt: at(3),
    updatedAt: at(4),
    stateChangedAt: at(4),
    issueRefs: [{ id: issueId, revision: 2 }],
    fix: {
      originClass: "self-consistency",
      shape: "replace the bad transition",
      sitesWalked: "producer and consumers",
      rulingsChecked: "none found",
      testLocation: "test/protocol.test.ts",
      cost: "small",
      interfaceChange: false,
      ownershipChange: false,
      riskSurface: false,
      guardrail: "keep producer and consumer representations aligned"
    },
    priorMarkRequired: true,
    shapeEditCount: 0,
    state: "marked",
    marks: mark(reviewer, 1)
  }
  const shelved: ShelvedFixRow = {
    id: shelvedId,
    kind: "Shelved fix",
    author: owner,
    revision: 1,
    createdAt: at(5),
    updatedAt: at(6),
    stateChangedAt: at(6),
    proposedFixRefs: [{ id: proposedId, revision: 1 }],
    artifact: `shelf-${number}`,
    redRun: { path: `red-${number}.log` },
    greenRun: { path: `green-${number}.log` },
    state: "reviewed",
    marks: mark(reviewer, 1)
  }
  return [issue, proposed, shelved]
}

function stateWithRows(rows: readonly LedgerRow[]): ProtocolState {
  return { ...newState(), rows, imports: { A: true, B: true } }
}

test("an Issue edit invalidates only that row and its descendants", () => {
  fc.assert(fc.property(seatArb, wordArb, (owner, word) => {
    const a = branch("A", 1)
    const b = branch("B", 1)
    const state = stateWithRows([...a, ...b])
    const selected = owner === "A" ? a : b
    const unrelated = owner === "A" ? b : a
    const editor = otherSeat(owner)
    const beforeUnrelated = unrelated.map((row) => structuredClone(row))
    const result = transition(state, {
      type: "issue.edit",
      actor: editor,
      at: at(20),
      id: selected[0].id,
      expectedRevision: selected[0].revision,
      facts: {
        proposition: word,
        detector: "watchdog",
        detectorGap: "watchdog did not inspect this branch"
      },
      label: "Restructure",
      clusters: ["c1", "c2"],
      parentIssueIds: [unrelated[0].id],
      certainty: 5,
      evidence: "peer correction evidence"
    })
    assert.equal(result.ok, true)
    if (!result.ok) return

    const issue = result.state.rows.find((row) => row.id === selected[0].id) as IssueRow
    const proposed = result.state.rows.find((row) => row.id === selected[1].id) as ProposedFixRow
    const shelved = result.state.rows.find((row) => row.id === selected[2].id) as ShelvedFixRow
    assert.equal(issue.author, owner)
    assert.equal(issue.revisionAuthor, editor)
    assert.equal(issue.label, "Restructure")
    assert.deepEqual(issue.clusters, ["c1", "c2"])
    assert.deepEqual(issue.parentIssueIds, [unrelated[0].id])
    assert.equal(issue.certainty, 5)
    assert.equal(issue.state === "verified" ? issue.evidence : undefined, "peer correction evidence")
    assert.equal(issue.facts.detector, "watchdog")
    assert.equal(issue.marks.length, 0)
    assert.equal(proposed.state, "draft")
    assert.equal(proposed.marks.length, 0)
    assert.equal(shelved.state, "shelved")
    assert.equal(shelved.marks.length, 0)
    assert.deepEqual(
      unrelated.map((row) => result.state.rows.find((candidate) => candidate.id === row.id)),
      beforeUnrelated
    )
    const selfMark = transition(result.state, {
      type: "issue.mark",
      actor: editor,
      at: at(21),
      id: issue.id,
      expectedRevision: issue.revision
    })
    assert.equal(selfMark.ok, false)
    if (!selfMark.ok) assert.equal(selfMark.error.code, "self-mark")
    accepted(result.state, {
      type: "issue.mark",
      actor: owner,
      at: at(22),
      id: issue.id,
      expectedRevision: issue.revision
    })
  }))
})

test("authors can never mark or review their own rows", () => {
  fc.assert(fc.property(seatArb, fc.constantFrom("Issue", "Proposed fix", "Shelved fix"), (owner, kind) => {
    const rows = [...branch(owner, 1)]
    const state = stateWithRows(rows.map((row) => {
      if (row.kind === "Issue") return { ...row, marks: [] }
      if (row.kind === "Proposed fix") return { ...row, state: "draft", marks: [] }
      return { ...row, state: "shelved", marks: [] }
    }) as LedgerRow[])
    let command: ProtocolCommand
    if (kind === "Issue") {
      const target = state.rows.find((row): row is IssueRow => row.kind === "Issue")
      assert.ok(target)
      command = { type: "issue.mark", actor: owner, at: at(10), id: target.id, expectedRevision: target.revision }
    } else if (kind === "Proposed fix") {
      const target = state.rows.find((row): row is ProposedFixRow => row.kind === "Proposed fix")
      assert.ok(target)
      command = {
        type: "proposed-fix.mark",
        actor: owner,
        at: at(10),
        id: target.id,
        expectedRevision: target.revision
      }
    } else {
      const target = state.rows.find((row): row is ShelvedFixRow => row.kind === "Shelved fix")
      assert.ok(target)
      command = {
        type: "shelved-fix.review",
        actor: owner,
        at: at(10),
        id: target.id,
        expectedRevision: target.revision,
        verdict: "reviewed"
      }
    }
    const result = transition(state, command)
    assert.equal(result.ok, false)
    if (!result.ok) assert.equal(result.error.code, "self-mark")
  }))
})

test("checkout and Issue takes are exclusive and never expire", () => {
  fc.assert(fc.property(seatArb, fc.integer({ min: 1, max: 1_000_000 }), (holder, elapsed) => {
    const contender = otherSeat(holder)
    const [issue] = branch("A", 9)
    let state = stateWithRows([issue])
    const staleTake = transition(state, {
      type: "issue.take",
      actor: holder,
      at: at(1),
      id: issue.id,
      expectedRevision: issue.revision - 1
    })
    assert.equal(staleTake.ok, false)
    if (!staleTake.ok) assert.equal(staleTake.error.code, "revision")
    state = accepted(state, {
      type: "issue.take",
      actor: holder,
      at: at(1),
      id: issue.id,
      expectedRevision: issue.revision
    })
    state = accepted(state, {
      type: "coverage.add",
      actor: contender,
      at: new Date(Date.UTC(2035, 0, 1, 0, 0, elapsed)).toISOString(),
      id: `C-${contender}-99`,
      coverageKind: "scenario",
      target: "elapsed-time"
    })
    assert.equal(state.issueTakes[0]?.holder, holder)
    const staleRelease = transition(state, {
      type: "issue.release",
      actor: holder,
      at: at(3),
      id: issue.id,
      expectedRevision: issue.revision - 1
    })
    assert.equal(staleRelease.ok, false)
    if (!staleRelease.ok) assert.equal(staleRelease.error.code, "revision")
    const take = transition(state, {
      type: "issue.take",
      actor: contender,
      at: at(4),
      id: issue.id,
      expectedRevision: issue.revision
    })
    assert.equal(take.ok, false)

    const contested: IssueRow = {
      ...issue,
      revisionAuthor: contender,
      state: "contested",
      certainty: 4,
      probe: "run the interleaving probe",
      contestedBy: holder,
      contestCount: 2,
      marks: []
    }
    let checkoutState: ProtocolState = {
      ...newState(),
      imports: { A: true, B: true },
      rows: [contested]
    }
    checkoutState = accepted(checkoutState, {
      type: "checkout.take",
      actor: holder,
      at: at(1),
      purpose: "long probe",
      rowIds: [contested.id]
    })
    checkoutState = accepted(checkoutState, {
      type: "coverage.add",
      actor: contender,
      at: new Date(Date.UTC(2035, 0, 1, 0, 0, elapsed)).toISOString(),
      id: `C-${contender}-98`,
      coverageKind: "scenario",
      target: "still-held"
    })
    assert.equal(checkoutState.checkout?.holder, holder)
    const checkout = transition(checkoutState, {
      type: "checkout.take",
      actor: contender,
      at: at(4),
      purpose: "competing writer",
      rowIds: []
    })
    assert.equal(checkout.ok, false)
  }))
})

test("every accepted state change has an actor, strict ISO time, and from/to audit", () => {
  fc.assert(fc.property(fc.array(actionArb, { minLength: 1, maxLength: 60 }), (actions) => {
    let state = { ...newState(), imports: { A: true, B: true } }
    for (const [index, action] of actions.entries()) {
      const command = commandFor(state, action, index + 1)
      if (!command) continue
      const result = transition(state, command)
      if (!result.ok) continue
      assert.ok(result.events.length > 0)
      for (const event of result.events) {
        assert.ok(ACTORS.includes(event.actor))
        assertIso(event.at)
        assert.ok(Object.hasOwn(event, "from"))
        assert.ok(Object.hasOwn(event, "to"))
        assert.ok(event.from === null || typeof event.from === "string")
        assert.ok(event.to === null || typeof event.to === "string")
      }
      state = result.state
    }
  }), { numRuns: 120 })
})

test("Hardening and Nit Issues are never ready and do not block done", () => {
  fc.assert(fc.property(
    fc.tuple(fc.constantFrom<IssueLabel>("Hardening", "Nit"), fc.constantFrom<IssueLabel>("Hardening", "Nit")),
    ([leftLabel, rightLabel]) => {
      let state = { ...newState(), imports: { A: true, B: true } }
      state = accepted(state, {
        type: "issue.add",
        actor: "A",
        at: at(1),
        id: "I-A-1",
        label: leftLabel,
        certainty: 4,
        facts: facts("hardening")
      })
      state = accepted(state, {
        type: "issue.add",
        actor: "B",
        at: at(2),
        id: "I-B-1",
        label: rightLabel,
        certainty: 4,
        facts: facts("nit")
      })
      for (const actor of ["A", "B"] as const) {
        assert.equal(readyWork(state, actor).some((work) => work.rowId?.startsWith("I-")), false)
      }
      state = accepted(state, { type: "handoff", actor: "A", at: at(3) })
      state = accepted(state, { type: "handoff", actor: "B", at: at(4) })
      assert.ok(state.notifications.some((notice) => notice.kind === "no-ready-work-left"))
    }
  ))
})

test("arbitrary generated traces never permit handoff by a seat retaining a hold", () => {
  fc.assert(fc.property(fc.array(actionArb, { minLength: 1, maxLength: 100 }), (actions) => {
    let state = { ...newState(), imports: { A: true, B: true } }
    for (const [index, action] of actions.entries()) {
      const command = commandFor(state, action, index + 1)
      if (!command) continue
      const result = transition(state, command)
      if (result.ok) state = result.state
      assertHeldActorsCannotHandoff(state, index + 200)
    }
  }), { numRuns: 150 })
})

test("stale expected revisions are always refused", () => {
  fc.assert(fc.property(seatArb, fc.array(wordArb, { minLength: 1, maxLength: 20 }), (owner, edits) => {
    const id = `I-${owner}-1` as IssueId
    let state = { ...newState(), imports: { A: true, B: true } }
    state = accepted(state, {
      type: "issue.add",
      actor: owner,
      at: at(1),
      id,
      label: "Bug",
      certainty: 4,
      facts: facts("stale")
    })
    state = accepted(state, {
      type: "issue.verify",
      actor: owner,
      at: at(2),
      id,
      expectedRevision: 0,
      certainty: 4,
      evidence: "reproduced"
    })
    for (const [index, proposition] of edits.entries()) {
      const row = state.rows.find((candidate) => candidate.id === id)
      assert.ok(row)
      state = accepted(state, {
        type: "issue.edit",
        actor: owner,
        at: at(index + 3),
        id,
        expectedRevision: row.revision,
        facts: { proposition }
      })
    }
    const current = state.rows.find((candidate) => candidate.id === id)
    assert.ok(current)
    const result = transition(state, {
      type: "issue.edit",
      actor: owner,
      at: at(40),
      id,
      expectedRevision: current.revision - 1,
      facts: { proposition: "stale-write" }
    })
    assert.equal(result.ok, false)
    if (!result.ok) assert.equal(result.error.code, "revision")
  }), { numRuns: 100 })
})

test("only an explicit answered no-red Question permits a Shelved fix without a red log", () => {
  let state = newState({ mode: "single", policy: "fix" })
  state = accepted(state, {
    type: "issue.add",
    actor: "A",
    at: at(300),
    id: "I-A-1",
    label: "Restructure",
    certainty: 4,
    facts: facts("no-red"),
    initial: { state: "verified", certainty: 4, evidence: "probe.log" }
  })
  const issue = firstRow(state, "Issue", (row) => row.id === "I-A-1")
  assert.equal(issue?.revision, 0, "an initially verified Issue stays at revision zero")
  assert.equal(issue?.state, "verified")

  state = accepted(state, {
    type: "issue.take",
    actor: "A",
    at: at(301),
    id: "I-A-1",
    expectedRevision: 0
  })
  state = accepted(state, {
    type: "proposed-fix.add",
    actor: "A",
    at: at(302),
    id: "P-A-1",
    issueIds: ["I-A-1"],
    fix: {
      originClass: "design-absence",
      shape: "Expose a test seam",
      sitesWalked: "src/no-red.ts:1",
      rulingsChecked: "none",
      testLocation: "none",
      cost: "one interface",
      interfaceChange: true,
      ownershipChange: false,
      riskSurface: false
    }
  })
  state = accepted(state, {
    type: "question.add",
    actor: "A",
    at: at(303),
    id: "Q-A-1",
    issueIds: ["I-A-1"],
    purpose: "decision",
    question: "Use this shape?",
    options: ["yes", "no"],
    recommendation: "yes",
    userEffect: "The user chooses the shape",
    codeCost: "One branch"
  })
  state = accepted(state, {
    type: "question.answer",
    actor: "master",
    at: at(304),
    id: "Q-A-1",
    expectedRevision: 0,
    answer: "yes"
  })
  assert.ok(readyWork(state, "A").some((item) =>
    item.command === "question.add" && item.rowId === "P-A-1"
  ))
  const checkoutBeforeNoRed = transition(state, {
    type: "checkout.take",
    actor: "A",
    at: at(305),
    purpose: "shelve P-A-1",
    rowIds: ["P-A-1"]
  })
  assert.equal(checkoutBeforeNoRed.ok, false, "an answered ordinary Question grants no red-run exception")

  state = accepted(state, {
    type: "question.add",
    actor: "A",
    at: at(308),
    id: "Q-A-2",
    issueIds: ["I-A-1"],
    purpose: "no-red",
    proposedFixRef: { id: "P-A-1", revision: 0 },
    question: "Allow the architecture exception?",
    options: ["allow-no-red", "deny"],
    recommendation: "allow-no-red",
    userEffect: "The fix may lack a red run",
    codeCost: "Add a test seam later"
  })
  state = accepted(state, {
    type: "question.answer",
    actor: "master",
    at: at(309),
    id: "Q-A-2",
    expectedRevision: 0,
    answer: "(a)"
  })
  const architectureProposal = firstRow(state, "Proposed fix", (row) => row.id === "P-A-1")
  assert.ok(architectureProposal)
  state = accepted(state, {
    type: "proposed-fix.edit",
    actor: "A",
    at: at(310),
    id: "P-A-1",
    expectedRevision: architectureProposal.revision,
    fix: { ...architectureProposal.fix, testLocation: "test/no-red.test.ts" }
  })
  const reachableProposal = firstRow(state, "Proposed fix", (row) => row.id === "P-A-1")
  assert.ok(reachableProposal)
  assert.equal(
    allowsNoRedRun(state, [{ id: reachableProposal.id, revision: reachableProposal.revision }]),
    false,
    "a reachable test location is not an architecture exception"
  )
  state = accepted(state, {
    type: "proposed-fix.edit",
    actor: "A",
    at: at(312),
    id: "P-A-1",
    expectedRevision: reachableProposal.revision,
    fix: { ...reachableProposal.fix, testLocation: "none" }
  })
  const currentArchitecture = firstRow(state, "Proposed fix", (row) => row.id === "P-A-1")
  assert.ok(currentArchitecture)
  state = accepted(state, {
    type: "question.add",
    actor: "A",
    at: at(313),
    id: "Q-A-3",
    issueIds: ["I-A-1"],
    purpose: "no-red",
    proposedFixRef: { id: "P-A-1", revision: currentArchitecture.revision },
    question: "Allow the current architecture exception?",
    options: ["allow-no-red", "deny"],
    recommendation: "allow-no-red",
    userEffect: "The fix may lack a red run",
    codeCost: "Add a test seam later"
  })
  state = accepted(state, {
    type: "question.answer",
    actor: "master",
    at: at(314),
    id: "Q-A-3",
    expectedRevision: 0,
    answer: "allow-no-red"
  })
  state = accepted(state, {
    type: "checkout.take",
    actor: "A",
    at: at(315),
    purpose: "shelve P-A-1",
    rowIds: ["P-A-1"]
  })
  state = accepted(state, {
    type: "checkout.baseline",
    actor: "A",
    at: at(316),
    buildLog: "baseline-build.log",
    testLog: "baseline-test.log"
  })
  state = accepted(state, {
    type: "shelved-fix.add",
    actor: "A",
    at: at(317),
    id: "S-A-1",
    proposedFixIds: ["P-A-1"],
    artifact: "shelve:1",
    redRun: null,
    greenRun: { path: "green.log" }
  })
  assert.equal(firstRow(state, "Shelved fix", (row) => row.id === "S-A-1")?.state, "shelved")
})

test("report-only stops after the Proposed fix and release of its Issue take", () => {
  let state = newState({ mode: "single", policy: "report-only" })
  state = accepted(state, {
    type: "issue.add",
    actor: "A",
    at: at(320),
    id: "I-A-1",
    label: "Bug",
    certainty: 4,
    facts: facts("report-only"),
    initial: { state: "verified", certainty: 4, evidence: "probe.log" }
  })
  state = accepted(state, {
    type: "issue.take",
    actor: "A",
    at: at(321),
    id: "I-A-1",
    expectedRevision: 0
  })
  state = accepted(state, {
    type: "proposed-fix.add",
    actor: "A",
    at: at(322),
    id: "P-A-1",
    issueIds: ["I-A-1"],
    fix: {
      originClass: "attention-miss",
      shape: "Change one branch",
      sitesWalked: "src/report-only.ts:1",
      rulingsChecked: "none",
      testLocation: "test/report-only.test.ts",
      cost: "one branch",
      interfaceChange: false,
      ownershipChange: false,
      riskSurface: false
    }
  })
  assert.deepEqual(
    readyWork(state, "A").map((item) => item.command),
    ["issue.release"]
  )
  state = accepted(state, {
    type: "issue.release",
    actor: "A",
    at: at(323),
    id: "I-A-1",
    expectedRevision: 0
  })
  assert.deepEqual(readyWork(state, "A").map((item) => item.command), ["report.record"])
  assert.deepEqual(readyWork(state, "B"), [])
})

test("recording a Check-in preserves the linked Issue agreement at its new lifecycle revision", () => {
  let state = {
    ...newState({
      mode: "joint",
      route: "diagnose",
      policy: "check-in",
      declaredCoverage: [{ coverageKind: "cluster", target: "check-in" }]
    }),
    imports: { A: true, B: true }
  }
  state = accepted(state, {
    type: "issue.add",
    actor: "A",
    at: at(330),
    id: "I-A-1",
    label: "Bug",
    certainty: 4,
    facts: facts("check-in"),
    clusters: ["check-in"],
    initial: { state: "verified", certainty: 4, evidence: "probe.log" }
  })
  state = accepted(state, {
    type: "issue.mark",
    actor: "B",
    at: at(331),
    id: "I-A-1",
    expectedRevision: 0
  })
  state = accepted(state, {
    type: "issue.take",
    actor: "A",
    at: at(332),
    id: "I-A-1",
    expectedRevision: 0
  })
  state = accepted(state, {
    type: "proposed-fix.add",
    actor: "A",
    at: at(333),
    id: "P-A-1",
    issueIds: ["I-A-1"],
    fix: {
      originClass: "attention-miss",
      shape: "Change one branch",
      sitesWalked: "src/check-in.ts:1",
      rulingsChecked: "none",
      testLocation: "test/check-in.test.ts",
      cost: "one branch",
      interfaceChange: false,
      ownershipChange: false,
      riskSurface: false
    }
  })
  state = accepted(state, {
    type: "checkout.take",
    actor: "A",
    at: at(334),
    purpose: "shelve P-A-1",
    rowIds: ["P-A-1"]
  })
  state = accepted(state, {
    type: "checkout.baseline",
    actor: "A",
    at: at(335),
    buildLog: "baseline-build.log",
    testLog: "baseline-test.log"
  })
  state = accepted(state, {
    type: "shelved-fix.add",
    actor: "A",
    at: at(336),
    id: "S-A-1",
    proposedFixIds: ["P-A-1"],
    artifact: "shelve:1",
    redRun: { path: "red.log" },
    greenRun: { path: "green.log" }
  })
  state = accepted(state, {
    type: "issue.release",
    actor: "A",
    at: at(337),
    id: "I-A-1",
    expectedRevision: 0
  })
  state = accepted(state, {
    type: "checkout.release",
    actor: "A",
    at: at(338),
    probesRemoved: true,
    shelvesRecorded: true
  })
  state = accepted(state, {
    type: "shelved-fix.review",
    actor: "B",
    at: at(339),
    id: "S-A-1",
    expectedRevision: 0,
    verdict: "reviewed"
  })
  state = accepted(state, { type: "handoff", actor: "A", at: at(340) })
  state = accepted(state, { type: "handoff", actor: "B", at: at(341) })
  state = accepted(state, { type: "report.record", actor: "master", at: at(342), notesHash: NOTES_HASH })
  state = accepted(state, {
    type: "check-in.approve",
    actor: "master",
    at: at(343),
    id: "K-M-1",
    shelvedFixIds: ["S-A-1"],
    executor: "master",
    approval: "user named S-A-1",
    notesHash: NOTES_HASH
  })
  assert.ok(state.reportCheckpoint)
  assert.equal(readyWork(state, "master").some((item) => item.command === "report.record"), false)
  state = accepted(state, {
    type: "check-in.record",
    actor: "master",
    at: at(344),
    id: "K-M-1",
    expectedRevision: 0,
    changeset: "cs:1",
    departures: "none"
  })
  const issue = firstRow(state, "Issue", (row) => row.id === "I-A-1")
  assert.equal(issue?.exit?.kind, "check-in")
  assert.equal(issue?.marks[0]?.revision, issue?.revision)
  for (const actor of ACTORS) {
    assert.equal(
      readyWork(state, actor).some((item) =>
        item.command === "proposed-fix.edit" || item.command === "shelved-fix.edit"),
      false,
      `${actor} received stale descendant work after Check-in`
    )
  }
  assert.deepEqual(decodeProtocolState(JSON.parse(JSON.stringify(state))), state)
})

test("cluster parsing is exact across whitespace, commas, and progress suffixes", () => {
  assert.deepEqual(parseClusterTokens("foo, foobar (5/6)"), ["foo", "foobar"])
  const covered = {
    ...newState({
      mode: "single",
      declaredCoverage: [{ coverageKind: "cluster", target: "foo foobar" }]
    }),
    rows: [
      {
        id: "C-A-1",
        kind: "Coverage",
        author: "A",
        revision: 0,
        createdAt: at(1),
        updatedAt: at(1),
        stateChangedAt: at(1),
        coverageKind: "cluster",
        target: "foo,foobar (5/6)",
        state: "covered",
        evidence: "walked",
        marks: []
      }
    ]
  } satisfies ProtocolState
  assert.deepEqual(readyWork(covered, "A").map((item) => item.command), ["report.record"])

  const substring = {
    ...covered,
    declaredCoverage: [{ coverageKind: "cluster", target: "foo" }],
    rows: [{ ...covered.rows[0]!, target: "foobar" }]
  } satisfies ProtocolState
  assert.ok(readyWork(substring, "A").some((item) => item.command === "coverage.add"))
})

test("cold work is isolated, refuses premature import, and unlocks joint work only after both imports", () => {
  let cold = newState({
    mode: "cold",
    coldSeat: "B",
    route: "diagnose",
    declaredCoverage: [{ coverageKind: "cluster", target: "foo foobar" }]
  })
  assert.deepEqual(readyWork(cold, "A"), [])
  assert.deepEqual(readyWork(cold, "master"), [])
  assert.deepEqual(readyWork(cold, "B").map((item) => item.command), ["coverage.add"])
  cold = accepted(cold, {
    type: "coverage.add",
    actor: "B",
    at: at(1),
    id: "C-B-1",
    coverageKind: "cluster",
    target: "foo, foobar (5/6)",
    initial: { state: "covered", evidence: "cold walk" }
  })
  assert.equal(cold.notifications.length, 0)
  assert.deepEqual(readyWork(cold, "B").map((item) => item.command), ["cold.import"])
  const coldHandoff = transition(cold, { type: "handoff", actor: "B", at: at(2) })
  assert.equal(coldHandoff.ok, false)
  if (!coldHandoff.ok) assert.equal(coldHandoff.error.code, "policy")
  const coldQuestion = transition(cold, {
    type: "question.add",
    actor: "B",
    at: at(2),
    id: "Q-B-1",
    issueIds: [],
    purpose: "decision",
    question: "Must not open",
    options: ["yes", "no"],
    recommendation: "yes",
    userEffect: "none",
    codeCost: "none"
  })
  assert.equal(coldQuestion.ok, false)
  if (!coldQuestion.ok) assert.equal(coldQuestion.error.code, "policy")

  const sharedStart = newState({
    mode: "joint",
    route: "diagnose",
    declaredCoverage: [{ coverageKind: "cluster", target: "foo foobar" }]
  })
  const openRow = { ...cold.rows[0]!, state: "open", marks: [] } as LedgerRow
  const premature = transition(sharedStart, {
    type: "cold.import",
    actor: "B",
    at: at(3),
    campaignId: sharedStart.campaignId,
    rows: [openRow as Extract<LedgerRow, { kind: "Coverage" }>]
  })
  assert.equal(premature.ok, false)
  if (!premature.ok) assert.equal(premature.error.code, "ready-work")
  const wrongCampaign = transition(sharedStart, {
    type: "cold.import",
    actor: "B",
    at: at(3),
    campaignId: "some-other-campaign",
    rows: cold.rows as readonly Extract<LedgerRow, { kind: "Coverage" }>[]
  })
  assert.equal(wrongCampaign.ok, false)

  let shared = accepted(sharedStart, {
    type: "cold.import",
    actor: "B",
    at: at(4),
    campaignId: sharedStart.campaignId,
    rows: cold.rows as readonly Extract<LedgerRow, { kind: "Coverage" }>[]
  })
  assert.deepEqual(readyWork(shared, "A"), [])
  assert.deepEqual(readyWork(shared, "B"), [])
  assert.equal(shared.notifications.length, 0)
  const bCoverage = cold.rows[0] as Extract<LedgerRow, { kind: "Coverage" }>
  const aCoverage = {
    ...bCoverage,
    id: "C-A-1",
    author: "A",
    createdAt: at(5),
    updatedAt: at(5),
    stateChangedAt: at(5)
  } satisfies Extract<LedgerRow, { kind: "Coverage" }>
  shared = accepted(shared, {
    type: "cold.import",
    actor: "A",
    at: at(5),
    campaignId: shared.campaignId,
    rows: [aCoverage]
  })
  shared = accepted(shared, { type: "handoff", actor: "A", at: at(6) })
  shared = accepted(shared, { type: "handoff", actor: "B", at: at(7) })
  assert.ok(shared.notifications.some((notice) => notice.kind === "no-ready-work-left"))
})

test("Shelved-fix edit refreshes stale Proposed-fix refs before peer review", () => {
  const [issue, originalProposed, originalShelf] = branch("A", 1)
  const proposed: ProposedFixRow = {
    ...originalProposed,
    revision: 2,
    updatedAt: at(10),
    state: "marked",
    marks: mark("B", 2)
  }
  const shelf: ShelvedFixRow = {
    ...originalShelf,
    state: "shelved",
    marks: [],
    proposedFixRefs: [{ id: proposed.id, revision: 1 }]
  }
  let state: ProtocolState = stateWithRows([issue, proposed, shelf])
  assert.ok(readyWork(state, "A").some((item) =>
    item.command === "issue.take" && item.rowId === issue.id
  ))
  state = accepted(state, {
    type: "issue.take",
    actor: "A",
    at: at(11),
    id: issue.id,
    expectedRevision: issue.revision
  })
  assert.ok(readyWork(state, "A").some((item) =>
    item.command === "checkout.take" && item.rowId === shelf.id
  ))
  state = accepted(state, {
    type: "checkout.take",
    actor: "A",
    at: at(12),
    purpose: "refresh shelf",
    rowIds: [shelf.id]
  })
  state = accepted(state, {
    type: "checkout.baseline",
    actor: "A",
    at: at(13),
    buildLog: "baseline-build.log",
    testLog: "baseline-test.log"
  })
  state = accepted(state, {
    type: "shelved-fix.edit",
    actor: "A",
    at: at(14),
    id: shelf.id,
    expectedRevision: shelf.revision,
    artifact: "shelf-refreshed",
    redRun: { path: "red-refreshed.log" },
    greenRun: { path: "green-refreshed.log" }
  })
  const refreshed = firstRow(state, "Shelved fix", (row) => row.id === shelf.id)
  assert.equal(refreshed?.proposedFixRefs[0]?.revision, proposed.revision)
  state = accepted(state, {
    type: "issue.release",
    actor: "A",
    at: at(15),
    id: issue.id,
    expectedRevision: issue.revision
  })
  state = accepted(state, {
    type: "checkout.release",
    actor: "A",
    at: at(16),
    probesRemoved: true,
    shelvesRecorded: true
  })
  state = accepted(state, {
    type: "shelved-fix.review",
    actor: "B",
    at: at(17),
    id: shelf.id,
    expectedRevision: shelf.revision + 1,
    verdict: "reviewed"
  })
  assert.equal(firstRow(state, "Shelved fix", (row) => row.id === shelf.id)?.state, "reviewed")
})

test("single mode exposes only fresh diff review to B and completes without handoff", () => {
  const [issue, proposed, originalShelf] = branch("A", 1)
  const shelf: ShelvedFixRow = { ...originalShelf, state: "shelved", marks: [] }
  let state: ProtocolState = {
    ...newState({ mode: "single", policy: "fix" }),
    rows: [issue, proposed, shelf]
  }
  assert.deepEqual(readyWork(state, "A"), [])
  assert.deepEqual(readyWork(state, "B").map((item) => item.command), ["shelved-fix.review"])
  state = accepted(state, {
    type: "shelved-fix.review",
    actor: "B",
    at: at(20),
    id: shelf.id,
    expectedRevision: shelf.revision,
    verdict: "reviewed"
  })
  assert.deepEqual(readyWork(state, "B"), [])
  assert.deepEqual(readyWork(state, "A").map((item) => item.command), ["report.record"])
  assert.ok(state.notifications.some((notice) => notice.kind === "no-ready-work-left"))
  const handoff = transition(state, { type: "handoff", actor: "A", at: at(21) })
  assert.equal(handoff.ok, false)
  if (!handoff.ok) assert.equal(handoff.error.code, "invalid-state")
  state = accepted(state, { type: "report.record", actor: "A", at: at(22), notesHash: NOTES_HASH })
  state = accepted(state, {
    type: "check-in.approve",
    actor: "master",
    at: at(23),
    id: "K-M-1",
    shelvedFixIds: [shelf.id],
    executor: "master",
    approval: "user approved after the default fix run",
    notesHash: NOTES_HASH
  })
  assert.equal(firstRow(state, "Check-in", (row) => row.id === "K-M-1")?.state, "approved")
})

test("master force-release recovers checkout before baseline or work", () => {
  const [base] = branch("A", 1)
  const contested: IssueRow = {
    ...base,
    revisionAuthor: "B",
    state: "contested",
    certainty: 4,
    probe: "run the interleaving probe",
    contestedBy: "A",
    contestCount: 2,
    marks: []
  }
  let state: ProtocolState = { ...newState({ mode: "single" }), rows: [contested] }
  state = accepted(state, {
    type: "checkout.take",
    actor: "A",
    at: at(1),
    purpose: "interrupted probe",
    rowIds: [contested.id]
  })
  const normal = transition(state, {
    type: "checkout.release",
    actor: "A",
    at: at(10),
    probesRemoved: false,
    shelvesRecorded: false
  })
  assert.equal(normal.ok, false)
  const forced = transition(state, {
    type: "checkout.release",
    actor: "master",
    at: at(3),
    probesRemoved: false,
    shelvesRecorded: false,
    reason: "user directed recovery"
  })
  assert.equal(forced.ok, true)
  if (!forced.ok) return
  state = forced.state
  const release = forced.events.find((event) => event.type === "checkout.changed")
  assert.deepEqual(release?.release, { forced: true, reason: "user directed recovery" })
  assert.equal(state.checkout, null)
  assert.equal(state.baseline, null)
})

test("Issue cluster linkage covers exact tokens but never substrings", () => {
  const [baseIssue] = branch("A", 1)
  const state = {
    ...newState({
      mode: "single",
      declaredCoverage: [{ coverageKind: "cluster", target: "foo" }]
    }),
    rows: [{ ...baseIssue, clusters: ["foobar"] }]
  } satisfies ProtocolState
  assert.equal(coverageResults(state)[0]?.state, "open")
  const exact = {
    ...state,
    rows: [{ ...baseIssue, clusters: ["foo (5/6)"] }]
  } satisfies ProtocolState
  assert.equal(coverageResults(exact)[0]?.state, "covered")
  const gapWins = {
    ...exact,
    rows: [
      ...exact.rows,
      {
        id: "C-A-1",
        kind: "Coverage",
        author: "A",
        revision: 0,
        createdAt: at(1),
        updatedAt: at(1),
        stateChangedAt: at(1),
        coverageKind: "cluster",
        target: "foo",
        state: "gap",
        reason: "one input class was unavailable",
        marks: []
      }
    ]
  } satisfies ProtocolState
  assert.equal(coverageResults(gapWins)[0]?.state, "gap")
})

test("report-only requires peer marking even for an attention-miss proposal", () => {
  const [issue] = branch("A", 1)
  let state: ProtocolState = {
    ...newState({ mode: "joint", policy: "report-only" }),
    imports: { A: true, B: true },
    rows: [issue]
  }
  state = accepted(state, {
    type: "issue.take",
    actor: "A",
    at: at(1),
    id: issue.id,
    expectedRevision: issue.revision
  })
  state = accepted(state, {
    type: "proposed-fix.add",
    actor: "A",
    at: at(10),
    id: "P-A-1",
    issueIds: [issue.id],
    fix: {
      originClass: "attention-miss",
      shape: "Change one branch",
      sitesWalked: "src/x.ts:1",
      rulingsChecked: "none",
      testLocation: "test/x.test.ts",
      cost: "small",
      interfaceChange: false,
      ownershipChange: false,
      riskSurface: false
    }
  })
  const proposed = firstRow(state, "Proposed fix", (row) => row.id === "P-A-1")
  assert.equal(proposed?.priorMarkRequired, true)
  assert.ok(readyWork(state, "B").some((item) => item.command === "proposed-fix.mark"))
})

test("shape escalation counts only peer rejection followed by author correction", () => {
  const [issue, original] = branch("A", 1)
  const draft: ProposedFixRow = { ...original, state: "draft", marks: [], shapeEditCount: 0 }
  let state = stateWithRows([issue, draft])
  const edit = (step: number, suffix: string): void => {
    const proposed = firstRow(state, "Proposed fix", (row) => row.id === draft.id)
    assert.ok(proposed)
    state = accepted(state, {
      type: "proposed-fix.edit",
      actor: "A",
      at: at(step),
      id: proposed.id,
      expectedRevision: proposed.revision,
      fix: { ...proposed.fix, shape: `${proposed.fix.shape}-${suffix}` }
    })
  }
  const rejectShape = (step: number): void => {
    const proposed = firstRow(state, "Proposed fix", (row) => row.id === draft.id)
    assert.ok(proposed)
    state = accepted(state, {
      type: "proposed-fix.reject",
      actor: "B",
      at: at(step),
      id: proposed.id,
      expectedRevision: proposed.revision,
      reason: "the shape misses a failure branch"
    })
  }
  edit(1, "unsolicited")
  assert.equal(firstRow(state, "Proposed fix", (row) => row.id === draft.id)?.shapeEditCount, 0)
  rejectShape(2)
  const onceRejected = firstRow(state, "Proposed fix", (row) => row.id === draft.id)
  assert.ok(onceRejected)
  const prematureDecision = transition(state, {
    type: "question.add",
    actor: "A",
    at: at(3),
    id: "Q-A-9",
    issueIds: [issue.id],
    purpose: "decision",
    proposedFixRef: { id: draft.id, revision: onceRejected.revision },
    question: "Escalate after only one rejection?",
    options: ["yes", "no"],
    recommendation: "no",
    userEffect: "Would interrupt the user early",
    codeCost: "No code effect"
  })
  assert.equal(prematureDecision.ok, false)
  edit(3, "correction-one")
  rejectShape(4)
  const escalated = firstRow(state, "Proposed fix", (row) => row.id === draft.id)
  assert.equal(escalated?.shapeEditCount, 2)
  assert.equal(escalated?.state, "rejected")
  assert.ok(readyWork(state, "A").some((item) => item.command === "question.add"))
  const third = transition(state, {
    type: "proposed-fix.edit",
    actor: "A",
    at: at(6),
    id: draft.id,
    expectedRevision: escalated?.revision ?? -1,
    fix: { ...draft.fix, shape: "third correction" }
  })
  assert.equal(third.ok, false)
  if (!third.ok) assert.equal(third.error.code, "question")

  state = accepted(state, {
    type: "question.add",
    actor: "A",
    at: at(7),
    id: "Q-A-1",
    issueIds: [issue.id],
    purpose: "decision",
    question: "Choose an unrelated product behavior?",
    options: ["yes", "no"],
    recommendation: "no",
    userEffect: "No effect on this proposal",
    codeCost: "No effect on this proposal"
  })
  state = accepted(state, {
    type: "question.answer",
    actor: "master",
    at: at(8),
    id: "Q-A-1",
    expectedRevision: 0,
    answer: "no"
  })
  assert.equal(transition(state, {
    type: "proposed-fix.edit",
    actor: "A",
    at: at(9),
    id: draft.id,
    expectedRevision: escalated?.revision ?? -1,
    fix: { ...draft.fix, shape: "generic question must not authorize" }
  }).ok, false)

  state = accepted(state, {
    type: "question.add",
    actor: "A",
    at: at(10),
    id: "Q-A-2",
    issueIds: [issue.id],
    purpose: "decision",
    proposedFixRef: { id: draft.id, revision: escalated?.revision ?? -1 },
    question: "Which disputed shape?",
    options: ["(a) narrow", "(b) broad"],
    recommendation: "(a) narrow",
    userEffect: "Preserves the current behavior",
    codeCost: "One compatibility branch"
  })
  state = accepted(state, {
    type: "question.answer",
    actor: "master",
    at: at(11),
    id: "Q-A-2",
    expectedRevision: 0,
    answer: "(a) narrow"
  })
  edit(12, "authorized-correction")
  const corrected = firstRow(state, "Proposed fix", (row) => row.id === draft.id)
  assert.equal(corrected?.shapeEditCount, 0)
  assert.equal(corrected?.state, "draft")
})

test("Question options are distinct and recommendation maps to one of them", () => {
  const [issue] = branch("A", 1)
  const state = stateWithRows([issue])
  const base = {
    type: "question.add" as const,
    actor: "A" as const,
    at: at(1),
    id: "Q-A-1" as const,
    issueIds: [issue.id],
    purpose: "decision" as const,
    question: "Which shape?",
    userEffect: "Changes the visible behavior",
    codeCost: "One branch"
  }
  for (const fields of [
    { options: ["one"], recommendation: "one" },
    { options: ["one", "ONE"], recommendation: "one" },
    { options: ["(a) narrow", "(b) broad"], recommendation: "(c) neither" }
  ]) {
    const result = transition(state, { ...base, ...fields })
    assert.equal(result.ok, false)
    if (!result.ok) assert.equal(result.error.code, "question")
  }
  const asked = accepted(state, {
    ...base,
    options: ["(a) narrow", "(b) broad"],
    recommendation: "(a) because it preserves compatibility"
  })
  const impossibleAnswer = transition(asked, {
    type: "question.answer",
    actor: "master",
    at: at(10),
    id: "Q-A-1",
    expectedRevision: 0,
    answer: "(c) neither"
  })
  assert.equal(impossibleAnswer.ok, false)
  if (!impossibleAnswer.ok) assert.equal(impossibleAnswer.error.code, "question")
  accepted(asked, {
    type: "question.answer",
    actor: "master",
    at: at(11),
    id: "Q-A-1",
    expectedRevision: 0,
    answer: "(b) because compatibility is intentionally broken"
  })
})

test("directions are reportable but never replace an implementation proposal or become shelved", () => {
  const [issue] = branch("A", 1)
  let state: ProtocolState = {
    ...newState({ mode: "single" }),
    rows: [{ ...issue, marks: [] }]
  }
  state = accepted(state, {
    type: "issue.take",
    actor: "A",
    at: at(1),
    id: issue.id,
    expectedRevision: issue.revision
  })
  state = accepted(state, {
    type: "proposed-fix.add",
    actor: "A",
    at: at(2),
    id: "P-A-1",
    issueIds: [issue.id],
    proposalKind: "direction",
    fix: { shape: "Move ownership to the boundary", cost: "requires a product decision" }
  })
  assert.ok(readyWork(state, "A").some((item) => item.command === "proposed-fix.add"))
  assert.equal(readyWork(state, "A").some((item) => item.command === "issue.release"), false)
  const directionCheckout = transition(state, {
    type: "checkout.take",
    actor: "A",
    at: at(3),
    purpose: "attempt direction shelf",
    rowIds: ["P-A-1"]
  })
  assert.equal(directionCheckout.ok, false)
  if (!directionCheckout.ok) assert.equal(directionCheckout.error.code, "checkout")

  let reportOnly: ProtocolState = {
    ...newState({ mode: "single", policy: "report-only" }),
    rows: [{ ...issue, marks: [] }]
  }
  reportOnly = accepted(reportOnly, {
    type: "issue.take",
    actor: "A",
    at: at(6),
    id: issue.id,
    expectedRevision: issue.revision
  })
  reportOnly = accepted(reportOnly, {
    type: "proposed-fix.add",
    actor: "A",
    at: at(7),
    id: "P-A-1",
    issueIds: [issue.id],
    proposalKind: "direction",
    fix: { shape: "Move ownership to the boundary", cost: "requires a product decision" }
  })
  assert.deepEqual(readyWork(reportOnly, "A").map((item) => item.command), ["issue.release"])
})

test("red and green logs must be distinct, and unchecked Issue exits are refused", () => {
  const [issue, proposed] = branch("A", 1)
  let state: ProtocolState = {
    ...stateWithRows([issue, proposed]),
    issueTakes: [{ issueId: issue.id, issueRevision: issue.revision, holder: "A", takenAt: at(1) }],
    checkout: {
      holder: "A",
      purpose: "shelve",
      rowIds: [proposed.id],
      targets: [{ id: proposed.id, revision: proposed.revision, state: proposed.state, current: true }],
      takenAt: at(1)
    },
    baseline: { recordedBy: "A", buildLog: "build.log", testLog: "test.log", recordedAt: at(1) }
  }
  const sameLog = transition(state, {
    type: "shelved-fix.add",
    actor: "A",
    at: at(2),
    id: "S-A-1",
    proposedFixIds: [proposed.id],
    artifact: "shelf",
    redRun: { path: "same.log" },
    greenRun: { path: "same.log" }
  })
  assert.equal(sameLog.ok, false)
  if (!sameLog.ok) assert.equal(sameLog.error.code, "evidence")

  state = newState({ mode: "single" })
  state = accepted(state, {
    type: "issue.add",
    actor: "A",
    at: at(3),
    id: "I-A-1",
    label: "Bug",
    certainty: 1,
    facts: facts("unchecked")
  })
  for (const exit of [
    { kind: "todo" as const, reference: "TODO.md" },
    { kind: "comment-or-assert" as const, reference: "src/x.ts:1" },
    { kind: "ruling-or-baseline" as const, reference: "decision.md" }
  ]) {
    const result = transition(state, {
      type: "issue.exit",
      actor: "A",
      at: at(4),
      id: "I-A-1",
      expectedRevision: 0,
      exit
    })
    assert.equal(result.ok, false)
    if (!result.ok) assert.equal(result.error.code, "invalid-state")
  }
})

test("joint reviewers cannot mutate shared state until both cold imports land", () => {
  let state = newState({ mode: "joint" })
  const premature = transition(state, {
    type: "issue.add",
    actor: "A",
    at: at(1),
    id: "I-A-1",
    label: "Bug",
    certainty: 4,
    facts: facts("premature")
  })
  assert.equal(premature.ok, false)
  if (!premature.ok) assert.equal(premature.error.code, "ready-work")
  state = accepted(state, {
    type: "cold.import",
    actor: "A",
    at: at(2),
    campaignId: state.campaignId,
    rows: []
  })
  assert.equal(transition(state, {
    type: "coverage.add",
    actor: "B",
    at: at(3),
    id: "C-B-1",
    coverageKind: "scenario",
    target: "still premature"
  }).ok, false)
  state = accepted(state, {
    type: "cold.import",
    actor: "B",
    at: at(12),
    campaignId: state.campaignId,
    rows: []
  })
  state = accepted(state, {
    type: "issue.add",
    actor: "A",
    at: at(5),
    id: "I-A-1",
    label: "Bug",
    certainty: 4,
    facts: facts("allowed")
  })
  assert.ok(firstRow(state, "Issue", (row) => row.id === "I-A-1"))
})

test("cold Issue clusters never replace explicit Coverage results", () => {
  let cold = newState({
    mode: "cold",
    coldSeat: "A",
    route: "diagnose",
    declaredCoverage: [{ coverageKind: "cluster", target: "c1" }]
  })
  cold = accepted(cold, {
    type: "issue.add",
    actor: "A",
    at: at(1),
    id: "I-A-1",
    label: "Bug",
    certainty: 4,
    facts: facts("cold-cluster"),
    clusters: ["c1"],
    initial: { state: "verified", certainty: 4, evidence: "probe.log" }
  })
  assert.equal(coverageResults(cold)[0]?.state, "open")
  assert.ok(readyWork(cold, "A").some((item) => item.command === "coverage.add"))
  const shared = newState({
    mode: "joint",
    route: "diagnose",
    declaredCoverage: [{ coverageKind: "cluster", target: "c1" }]
  })
  const imported = transition(shared, {
    type: "cold.import",
    actor: "A",
    at: at(2),
    campaignId: shared.campaignId,
    rows: cold.rows as readonly Extract<LedgerRow, { kind: "Issue" }>[]
  })
  assert.equal(imported.ok, false)
  if (!imported.ok) assert.equal(imported.error.code, "ready-work")
})

test("Question notification contains every open choice and its answer command", () => {
  const [left] = branch("A", 1)
  const [right] = branch("B", 1)
  let state = stateWithRows([left, right])
  state = accepted(state, {
    type: "question.add",
    actor: "A",
    at: at(1),
    id: "Q-A-1",
    issueIds: [left.id],
    purpose: "decision",
    question: "Keep compatibility?",
    options: ["(a) keep", "(b) break"],
    recommendation: "(a) keep",
    userEffect: "Existing callers keep working",
    codeCost: "One adapter"
  })
  state = accepted(state, {
    type: "question.add",
    actor: "B",
    at: at(2),
    id: "Q-B-1",
    issueIds: [right.id],
    purpose: "decision",
    question: "Retain the old format?",
    options: ["(a) retain", "(b) migrate"],
    recommendation: "(b) migrate",
    userEffect: "The saved format changes",
    codeCost: "One migration"
  })
  const notice = state.notifications.filter((item) => item.kind === "question").at(-1)
  assert.ok(notice)
  for (const text of [
    "question: Q-A-1 Keep compatibility?",
    "options: (a) keep | (b) break",
    "user_effect: Existing callers keep working",
    "code_cost: One adapter",
    "recommendation: (a) keep",
    "next: \"$LEDGER_DIR/bin/ledger.ts\" question answer Q-A-1 rev=0 answer=...",
    "question: Q-B-1 Retain the old format?",
    "options: (a) retain | (b) migrate",
    "user_effect: The saved format changes",
    "code_cost: One migration",
    "recommendation: (b) migrate",
    "next: \"$LEDGER_DIR/bin/ledger.ts\" question answer Q-B-1 rev=0 answer=..."
  ]) assert.match(notice.message, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
  assert.deepEqual(notice.rowIds, ["Q-A-1", "Q-B-1"])
})

test("checkout accepts only ready rows and normal release proves post-hold work", () => {
  const [issue, proposed] = branch("A", 1)
  let state: ProtocolState = {
    ...stateWithRows([issue, proposed]),
    issueTakes: [{ issueId: issue.id, issueRevision: issue.revision, holder: "A", takenAt: at(1) }]
  }
  assert.equal(transition(state, {
    type: "checkout.take",
    actor: "A",
    at: at(10),
    purpose: "empty",
    rowIds: []
  }).ok, false)
  assert.equal(transition(state, {
    type: "checkout.take",
    actor: "A",
    at: at(10),
    purpose: "arbitrary",
    rowIds: [issue.id]
  }).ok, false)
  state = accepted(state, {
    type: "checkout.take",
    actor: "A",
    at: at(10),
    purpose: "implement proposal",
    rowIds: [proposed.id]
  })
  state = accepted(state, {
    type: "checkout.baseline",
    actor: "A",
    at: at(11),
    buildLog: "build.log",
    testLog: "test.log"
  })
  const unchanged = transition(state, {
    type: "checkout.release",
    actor: "A",
    at: at(12),
    probesRemoved: true,
    shelvesRecorded: true
  })
  assert.equal(unchanged.ok, false)
  if (!unchanged.ok) assert.equal(unchanged.error.code, "checkout")
})

test("Hardening-only fixes create no readiness and cannot be shelved alone", () => {
  const [baseIssue] = branch("A", 1)
  const issue: IssueRow = {
    ...baseIssue,
    label: "Hardening",
    state: "verified",
    certainty: 4,
    evidence: "hardening evidence",
    marks: []
  }
  const proposed: ProposedFixRow = {
    ...branch("A", 1)[1],
    issueRefs: [{ id: issue.id, revision: issue.revision }],
    state: "draft",
    priorMarkRequired: false,
    marks: []
  }
  let state: ProtocolState = {
    ...newState({ mode: "single" }),
    rows: [issue, proposed],
    issueTakes: [{ issueId: issue.id, issueRevision: issue.revision, holder: "A", takenAt: at(1) }]
  }
  assert.equal(readyWork(state, "A").some((item) => item.rowId === proposed.id), false)
  assert.equal(readyWork(state, "B").length, 0)
  state = {
    ...state,
    checkout: {
      holder: "A",
      purpose: "malformed nonblocking shelf",
      rowIds: [proposed.id],
      targets: [{ id: proposed.id, revision: proposed.revision, state: proposed.state, current: true }],
      takenAt: at(2)
    },
    baseline: { recordedBy: "A", buildLog: "build.log", testLog: "test.log", recordedAt: at(2) }
  }
  const result = transition(state, {
    type: "shelved-fix.add",
    actor: "A",
    at: at(3),
    id: "S-A-1",
    proposedFixIds: [proposed.id],
    artifact: "shelf",
    redRun: { path: "red.log" },
    greenRun: { path: "green.log" }
  })
  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.error.code, "invalid-state")
})

test("telemetry-only fixes are explicit and reviewable without blocking readiness", () => {
  const [baseIssue, baseProposed] = branch("A", 1)
  const verifiedIssue = baseIssue as Extract<IssueRow, { state: "verified" }>
  const issue: IssueRow = {
    ...verifiedIssue,
    label: "telemetry-quality",
    marks: []
  }
  const proposed: ProposedFixRow = {
    ...baseProposed,
    issueRefs: [{ id: issue.id, revision: issue.revision }],
    state: "draft",
    priorMarkRequired: false,
    marks: []
  }
  let state: ProtocolState = {
    ...newState({ mode: "single" }),
    rows: [issue, proposed],
    issueTakes: [{ issueId: issue.id, issueRevision: issue.revision, holder: "A", takenAt: at(1) }]
  }
  assert.equal(readyWork(state, "A").some((item) => item.rowId === proposed.id), false)
  state = accepted(state, {
    type: "checkout.take",
    actor: "A",
    at: at(2),
    purpose: "voluntary telemetry pipeline repair",
    rowIds: [proposed.id]
  })
  state = accepted(state, {
    type: "checkout.baseline",
    actor: "A",
    at: at(3),
    buildLog: "telemetry-build.log",
    testLog: "telemetry-test.log"
  })
  state = accepted(state, {
    type: "shelved-fix.add",
    actor: "A",
    at: at(4),
    id: "S-A-1",
    proposedFixIds: [proposed.id],
    artifact: "shelf:telemetry",
    redRun: { path: "telemetry-red.log" },
    greenRun: { path: "telemetry-green.log" }
  })
  state = accepted(state, {
    type: "issue.release",
    actor: "A",
    at: at(5),
    id: issue.id,
    expectedRevision: issue.revision
  })
  state = accepted(state, {
    type: "checkout.release",
    actor: "A",
    at: at(6),
    probesRemoved: true,
    shelvesRecorded: true
  })
  const review = transition(state, {
    type: "shelved-fix.review",
    actor: "B",
    at: at(7),
    id: "S-A-1",
    expectedRevision: 0,
    verdict: "reviewed"
  })
  assert.equal(review.ok, true)
})

test("disproved substantive Issues require their recorded exit", () => {
  const [issue] = branch("A", 1)
  let state = stateWithRows([{ ...issue, marks: [] }])
  state = accepted(state, {
    type: "issue.disprove",
    actor: "B",
    at: at(1),
    id: issue.id,
    expectedRevision: issue.revision,
    certainty: 2,
    evidence: "src/x.ts:10 proves the claim false"
  })
  assert.ok(readyWork(state, "B").some((item) => item.command === "issue.exit"))
  const handoff = transition(state, { type: "handoff", actor: "B", at: at(2) })
  assert.equal(handoff.ok, false)
  state = accepted(state, {
    type: "issue.exit",
    actor: "B",
    at: at(3),
    id: issue.id,
    expectedRevision: issue.revision + 1,
    exit: { kind: "comment-or-assert", reference: "src/x.ts:10" }
  })
  assert.equal(readyWork(state, "B").some((item) => item.rowId === issue.id), false)
})

test("Shelved-fix review traverses current Issue refs and late Questions are refused", () => {
  const [issue, proposed, originalShelf] = branch("A", 1)
  const shelf: ShelvedFixRow = { ...originalShelf, state: "shelved", marks: [] }
  const staleIssue: IssueRow = {
    ...issue,
    revision: issue.revision + 1,
    updatedAt: at(10),
    facts: { ...issue.facts, proposition: "revised after shelf" },
    marks: []
  }
  const stale = stateWithRows([staleIssue, proposed, shelf])
  assert.equal(readyWork(stale, "B").some((item) => item.command === "shelved-fix.review"), false)
  const review = transition(stale, {
    type: "shelved-fix.review",
    actor: "B",
    at: at(11),
    id: shelf.id,
    expectedRevision: shelf.revision,
    verdict: "reviewed"
  })
  assert.equal(review.ok, false)
  if (!review.ok) assert.equal(review.error.code, "stale-reference")

  const valid = stateWithRows([issue, proposed, shelf])
  const late = transition(valid, {
    type: "question.add",
    actor: "A",
    at: at(12),
    id: "Q-A-1",
    issueIds: [issue.id],
    purpose: "decision",
    question: "Change direction after shelf?",
    options: ["yes", "no"],
    recommendation: "no",
    userEffect: "Would invalidate reviewed work",
    codeCost: "Would require a new shelf"
  })
  assert.equal(late.ok, false)
  if (!late.ok) assert.equal(late.error.code, "question")
})

test("single reports are recorded by A and any later mutation invalidates the checkpoint", () => {
  let state = newState({ mode: "single" })
  assert.deepEqual(readyWork(state, "A").map((item) => item.command), ["report.record"])
  assert.equal(readyWork(state, "master").some((item) => item.command === "report.record"), false)
  const wrongActor = transition(state, {
    type: "report.record",
    actor: "master",
    at: at(1),
    notesHash: NOTES_HASH
  })
  assert.equal(wrongActor.ok, false)
  if (!wrongActor.ok) assert.equal(wrongActor.error.code, "actor")
  state = accepted(state, { type: "report.record", actor: "A", at: at(2), notesHash: NOTES_HASH })
  assert.deepEqual(state.reportCheckpoint, { recordedBy: "A", recordedAt: at(2), notesHash: NOTES_HASH })
  const refreshedHash = "b".repeat(64)
  state = accepted(state, {
    type: "report.record",
    actor: "A",
    at: at(3),
    notesHash: refreshedHash
  })
  assert.deepEqual(state.reportCheckpoint, { recordedBy: "A", recordedAt: at(3), notesHash: refreshedHash })
  state = accepted(state, {
    type: "coverage.add",
    actor: "A",
    at: at(4),
    id: "C-A-1",
    coverageKind: "hunk",
    target: "src/new.ts:1"
  })
  assert.equal(state.reportCheckpoint, null)
})

test("severity downgrades require and retain one explicit reason", () => {
  const [issue] = branch("A", 1)
  const state = stateWithRows([issue])
  const labelDowngrade = transition(state, {
    type: "issue.edit",
    actor: "A",
    at: at(10),
    id: issue.id,
    expectedRevision: issue.revision,
    facts: {},
    label: "Hardening"
  })
  assert.equal(labelDowngrade.ok, false)
  if (!labelDowngrade.ok) assert.equal(labelDowngrade.error.code, "evidence")
  const impactDowngrade = transition(state, {
    type: "issue.edit",
    actor: "A",
    at: at(10),
    id: issue.id,
    expectedRevision: issue.revision,
    facts: { impactRank: 5 }
  })
  assert.equal(impactDowngrade.ok, false)
  if (!impactDowngrade.ok) assert.equal(impactDowngrade.error.code, "evidence")
  const changed = accepted(state, {
    type: "issue.edit",
    actor: "A",
    at: at(10),
    id: issue.id,
    expectedRevision: issue.revision,
    facts: { impactRank: 5 },
    label: "Hardening",
    labelChangeReason: "The affected path is diagnostic only"
  })
  const revised = firstRow(changed, "Issue", (row) => row.id === issue.id)
  assert.equal(revised?.label, "Hardening")
  assert.equal(revised?.facts.impactRank, 5)
  assert.equal(revised?.labelChangeReason, "The affected path is diagnostic only")
})

test("settled Issues require a machine-sortable impact rank", () => {
  const { impactRank: _omitted, ...withoutRank } = facts("unranked")
  const result = transition(newState({ mode: "single" }), {
    type: "issue.add",
    actor: "A",
    at: at(1),
    id: "I-A-1",
    label: "Bug",
    certainty: 4,
    facts: withoutRank,
    initial: { state: "verified", certainty: 4, evidence: "red.log" }
  })
  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.error.code, "evidence")
})

test("terminal Issue dispositions supersede descendant proposal and shelf work", () => {
  const [issue, proposed, shelf] = branch("A", 1)
  let state = stateWithRows([issue, proposed, shelf])
  state = accepted(state, {
    type: "issue.exit",
    actor: "master",
    at: at(10),
    id: issue.id,
    expectedRevision: issue.revision,
    exit: { kind: "user-drop", reason: "User removed this item from scope" }
  })
  for (const actor of ["A", "B"] as const) {
    assert.equal(readyWork(state, actor).some((item) =>
      item.rowId === proposed.id || item.rowId === shelf.id
    ), false)
  }
})

test("an upstream edit drops an approved Check-in instead of preserving stale approval", () => {
  const [issue, proposed, shelf] = branch("A", 1)
  const checkIn: CheckInRow = {
    id: "K-M-1",
    kind: "Check-in",
    author: "master",
    revision: 0,
    createdAt: at(7),
    updatedAt: at(7),
    stateChangedAt: at(7),
    shelvedFixRefs: [{ id: shelf.id, revision: shelf.revision }],
    executor: "master",
    approval: "User approved S-A-1",
    state: "approved",
    marks: []
  }
  let state = stateWithRows([issue, proposed, shelf, checkIn])
  state = accepted(state, {
    type: "issue.edit",
    actor: "A",
    at: at(10),
    id: issue.id,
    expectedRevision: issue.revision,
    facts: { proposition: "Corrected after approval" }
  })
  const invalidated = firstRow(state, "Check-in", (row) => row.id === checkIn.id)
  assert.equal(invalidated?.state, "dropped")
  if (invalidated?.state === "dropped") {
    assert.match(invalidated.reason, /changed after approval/)
  }
})

test("open Questions freeze linked revisions and answers disclose the selected option", () => {
  const [issue, proposed] = branch("A", 1)
  let state = stateWithRows([issue, proposed])
  state = accepted(state, {
    type: "question.add",
    actor: "A",
    at: at(10),
    id: "Q-A-1",
    issueIds: [issue.id],
    purpose: "decision",
    question: "Keep compatibility?",
    options: ["(a) keep", "(b) break"],
    recommendation: "(a) keep",
    userEffect: "Existing callers remain valid",
    codeCost: "One adapter"
  })
  const issueEdit = transition(state, {
    type: "issue.edit",
    actor: "A",
    at: at(11),
    id: issue.id,
    expectedRevision: issue.revision,
    facts: { proposition: "changed while waiting" }
  })
  assert.equal(issueEdit.ok, false)
  if (!issueEdit.ok) assert.equal(issueEdit.error.code, "question")
  const proposalEdit = transition(state, {
    type: "proposed-fix.edit",
    actor: "A",
    at: at(11),
    id: proposed.id,
    expectedRevision: proposed.revision,
    fix: proposed.fix
  })
  assert.equal(proposalEdit.ok, false)
  if (!proposalEdit.ok) assert.equal(proposalEdit.error.code, "question")
  const openState = state
  state = accepted(state, {
    type: "question.answer",
    actor: "master",
    at: at(12),
    id: "Q-A-1",
    expectedRevision: 0,
    answer: "(a) keep"
  })
  const answerNotice = state.notifications.filter((notice) => notice.kind === "answer").at(-1)
  assert.match(answerNotice?.message ?? "", /answer: \(a\) keep/)

  const staleState: ProtocolState = {
    ...openState,
    rows: [
      { ...issue, revision: issue.revision + 1, updatedAt: at(11) },
      proposed,
      ...openState.rows.filter((row) => row.kind === "Question")
    ]
  }
  const staleAnswer = transition(staleState, {
    type: "question.answer",
    actor: "master",
    at: at(13),
    id: "Q-A-1",
    expectedRevision: 0,
    answer: "(a) keep"
  })
  assert.equal(staleAnswer.ok, false)
})

test("a denied no-red exception routes to a test-location edit, not another Question", () => {
  const [base] = branch("A", 1)
  const baseIssue = base as Extract<IssueRow, { state: "verified" }>
  const issue: IssueRow = { ...baseIssue, label: "Restructure" }
  const proposed: ProposedFixRow = {
    ...branch("A", 1)[1],
    issueRefs: [{ id: issue.id, revision: issue.revision }],
    fix: {
      originClass: "design-absence",
      shape: "Introduce an architecture seam",
      sitesWalked: "src/architecture.ts:1",
      rulingsChecked: "none",
      testLocation: "none",
      cost: "one seam",
      interfaceChange: true,
      ownershipChange: false,
      riskSurface: false
    },
    priorMarkRequired: false,
    state: "draft",
    marks: []
  }
  let state = stateWithRows([issue, proposed])
  state = accepted(state, {
    type: "question.add",
    actor: "A",
    at: at(10),
    id: "Q-A-1",
    issueIds: [issue.id],
    purpose: "no-red",
    proposedFixRef: { id: proposed.id, revision: proposed.revision },
    question: "Allow the architecture exception?",
    options: ["allow-no-red", "require-test"],
    recommendation: "require-test",
    userEffect: "A test seam may be added",
    codeCost: "One additional seam"
  })
  state = accepted(state, {
    type: "question.answer",
    actor: "master",
    at: at(11),
    id: "Q-A-1",
    expectedRevision: 0,
    answer: "require-test"
  })
  const commands = readyWork(state, "A")
    .filter((item) => item.rowId === proposed.id)
    .map((item) => item.command)
  assert.deepEqual(commands, ["proposed-fix.edit"])
})

test("review conditions may ask one shelf-revision Question and pause shelf work", () => {
  const [issue, proposed, originalShelf] = branch("A", 1)
  const shelf: ShelvedFixRow = {
    ...originalShelf,
    state: "conditions",
    conditions: "User must choose compatibility behavior",
    marks: []
  }
  let state = stateWithRows([issue, proposed, shelf])
  assert.ok(readyWork(state, "A").some((item) =>
    item.command === "question.add" && item.rowId === shelf.id
  ))
  const unpinned = transition(state, {
    type: "question.add",
    actor: "A",
    at: at(10),
    id: "Q-A-1",
    issueIds: [issue.id],
    purpose: "decision",
    question: "Keep compatibility?",
    options: ["keep", "break"],
    recommendation: "keep",
    userEffect: "Existing callers may break",
    codeCost: "One adapter"
  })
  assert.equal(unpinned.ok, false)
  state = accepted(state, {
    type: "question.add",
    actor: "A",
    at: at(10),
    id: "Q-A-1",
    issueIds: [issue.id],
    purpose: "decision",
    shelvedFixRef: { id: shelf.id, revision: shelf.revision },
    question: "Keep compatibility?",
    options: ["keep", "break"],
    recommendation: "keep",
    userEffect: "Existing callers may break",
    codeCost: "One adapter"
  })
  assert.equal(readyWork(state, "A").some((item) => item.rowId === shelf.id), false)
  state = accepted(state, {
    type: "question.answer",
    actor: "master",
    at: at(11),
    id: "Q-A-1",
    expectedRevision: 0,
    answer: "keep"
  })
  assert.ok(readyWork(state, "A").some((item) =>
    item.command === "issue.take" && item.rowId === issue.id
  ))
  state = accepted(state, {
    type: "issue.take",
    actor: "A",
    at: at(12),
    id: issue.id,
    expectedRevision: issue.revision
  })
  assert.ok(readyWork(state, "A").some((item) =>
    item.command === "checkout.take" && item.rowId === shelf.id
  ))
})

test("another seat cannot revise checkout dependencies while implementation is in flight", () => {
  const [issue, proposed] = branch("A", 1)
  let state: ProtocolState = {
    ...stateWithRows([issue, proposed]),
    issueTakes: [{ issueId: issue.id, issueRevision: issue.revision, holder: "B", takenAt: at(9) }]
  }
  state = accepted(state, {
    type: "checkout.take",
    actor: "B",
    at: at(10),
    purpose: "implement P-A-1",
    rowIds: [proposed.id]
  })
  const proposalRace = transition(state, {
    type: "proposed-fix.edit",
    actor: "A",
    at: at(11),
    id: proposed.id,
    expectedRevision: proposed.revision,
    fix: { ...proposed.fix, shape: "changed after implementation began" }
  })
  assert.equal(proposalRace.ok, false)
  const issueRace = transition(state, {
    type: "issue.edit",
    actor: "A",
    at: at(11),
    id: issue.id,
    expectedRevision: issue.revision,
    facts: { proposition: "changed after implementation began" }
  })
  assert.equal(issueRace.ok, false)
  state = accepted(state, {
    type: "checkout.baseline",
    actor: "B",
    at: at(12),
    buildLog: "baseline-build.log",
    testLog: "baseline-test.log"
  })
  state = accepted(state, {
    type: "shelved-fix.add",
    actor: "B",
    at: at(13),
    id: "S-B-1",
    proposedFixIds: [proposed.id],
    artifact: "shelf:B-1",
    redRun: { path: "red.log" },
    greenRun: { path: "green.log" }
  })
  state = accepted(state, {
    type: "issue.release",
    actor: "B",
    at: at(14),
    id: issue.id,
    expectedRevision: issue.revision
  })
  state = accepted(state, {
    type: "checkout.release",
    actor: "B",
    at: at(15),
    probesRemoved: true,
    shelvesRecorded: true
  })
  assert.equal(state.checkout, null)
})

test("a mixed shelf uses aggregate red evidence only for its testable proposals", () => {
  let state = newState({ mode: "single" })
  state = accepted(state, {
    type: "issue.add",
    actor: "A",
    at: at(1),
    id: "I-A-1",
    label: "Restructure",
    certainty: 4,
    facts: facts("architecture"),
    initial: { state: "verified", certainty: 4, evidence: "architecture.log" }
  })
  state = accepted(state, {
    type: "issue.add",
    actor: "A",
    at: at(2),
    id: "I-A-2",
    label: "Hardening",
    certainty: 4,
    facts: facts("ordinary"),
    initial: { state: "verified", certainty: 4, evidence: "ordinary.log" }
  })
  state = accepted(state, {
    type: "issue.take",
    actor: "A",
    at: at(3),
    id: "I-A-1",
    expectedRevision: 0
  })
  state = accepted(state, {
    type: "issue.take",
    actor: "A",
    at: at(4),
    id: "I-A-2",
    expectedRevision: 0
  })
  state = accepted(state, {
    type: "proposed-fix.add",
    actor: "A",
    at: at(5),
    id: "P-A-1",
    issueIds: ["I-A-1"],
    fix: {
      originClass: "design-absence",
      shape: "Add an architecture seam",
      sitesWalked: "src/architecture.ts:1",
      rulingsChecked: "none",
      testLocation: "none",
      cost: "one seam",
      interfaceChange: true,
      ownershipChange: false,
      riskSurface: false
    }
  })
  state = accepted(state, {
    type: "question.add",
    actor: "A",
    at: at(6),
    id: "Q-A-1",
    issueIds: ["I-A-1"],
    purpose: "no-red",
    proposedFixRef: { id: "P-A-1", revision: 0 },
    question: "Allow no red run for the architecture seam?",
    options: ["allow-no-red", "require-test"],
    recommendation: "allow-no-red",
    userEffect: "The architecture seam has no old-code assertion",
    codeCost: "A later integration test"
  })
  state = accepted(state, {
    type: "question.answer",
    actor: "master",
    at: at(7),
    id: "Q-A-1",
    expectedRevision: 0,
    answer: "allow-no-red"
  })
  state = accepted(state, {
    type: "proposed-fix.add",
    actor: "A",
    at: at(8),
    id: "P-A-2",
    issueIds: ["I-A-2"],
    fix: {
      originClass: "attention-miss",
      shape: "Correct the ordinary branch",
      sitesWalked: "src/ordinary.ts:1",
      rulingsChecked: "none",
      testLocation: "test/ordinary.test.ts",
      cost: "one branch",
      interfaceChange: false,
      ownershipChange: false,
      riskSurface: false
    }
  })
  state = accepted(state, {
    type: "checkout.take",
    actor: "A",
    at: at(9),
    purpose: "shelve same-file fixes",
    rowIds: ["P-A-1", "P-A-2"]
  })
  state = accepted(state, {
    type: "checkout.baseline",
    actor: "A",
    at: at(10),
    buildLog: "baseline-build.log",
    testLog: "baseline-test.log"
  })
  state = accepted(state, {
    type: "shelved-fix.add",
    actor: "A",
    at: at(11),
    id: "S-A-1",
    proposedFixIds: ["P-A-1", "P-A-2"],
    artifact: "shelf:mixed",
    redRun: { path: "ordinary-red.log" },
    greenRun: { path: "mixed-green.log" }
  })
  assert.equal(firstRow(state, "Shelved fix", (row) => row.id === "S-A-1")?.state, "shelved")
  const releases = readyWork(state, "A")
    .filter((item) => item.command === "issue.release")
    .map((item) => item.rowId)
  assert.deepEqual(releases.sort(), ["I-A-1", "I-A-2"])
})

test("initialization coverage gates and quick-to-deep escalation are explicit", () => {
  assert.throws(() => initialProtocolState({
    campaignId: "missing-diagnosis-coverage",
    mode: "single",
    route: "diagnose",
    declaredCoverage: []
  }), /symptom or cluster/)
  assert.throws(() => initialProtocolState({
    campaignId: "missing-review-coverage",
    mode: "single",
    route: "review",
    deep: true,
    declaredCoverage: []
  }), /hunk or scenario/)
  const malformedDeep = initialProtocolState({ campaignId: "malformed-deep", mode: "single" })
  assert.throws(
    () => decodeProtocolState({ ...malformedDeep, deep: true }),
    /declared hunk or scenario/
  )
  const malformedDiagnosis = initialProtocolState({
    campaignId: "malformed-diagnosis",
    mode: "single",
    route: "diagnose"
  })
  assert.throws(
    () => decodeProtocolState(malformedDiagnosis),
    /declared symptom or cluster/
  )
  let state = initialProtocolState({
    campaignId: "escalation",
    mode: "single",
    route: "review",
    declaredCoverage: []
  })
  assert.equal(transition(state, {
    type: "run.escalate",
    actor: "A",
    at: at(1)
  }).ok, false)
  state = accepted(state, {
    type: "run.escalate",
    actor: "A",
    at: at(2),
    declaredCoverage: [{ coverageKind: "hunk", target: "src/escalated.ts:1" }]
  })
  assert.equal(state.deep, true)
  assert.ok(readyWork(state, "A").some((item) => item.command === "coverage.add"))
})

test("an Issue take permits peer shape review but freezes author correction by the other seat", () => {
  const [issue, original] = branch("A", 1)
  const draft: ProposedFixRow = { ...original, state: "draft", marks: [], priorMarkRequired: true }
  const state: ProtocolState = {
    ...stateWithRows([issue, draft]),
    issueTakes: [{ issueId: issue.id, issueRevision: issue.revision, holder: "A", takenAt: at(7) }]
  }
  assert.equal(transition(state, {
    type: "proposed-fix.mark",
    actor: "B",
    at: at(8),
    id: draft.id,
    expectedRevision: draft.revision
  }).ok, true)
  assert.equal(transition(state, {
    type: "proposed-fix.reject",
    actor: "B",
    at: at(8),
    id: draft.id,
    expectedRevision: draft.revision,
    reason: "failure path is missing"
  }).ok, true)
})

test("disposing one parent does not poison replacement work for a surviving multi-Issue proposal", () => {
  const [left, original] = branch("A", 1)
  const [right] = branch("A", 2)
  const proposed: ProposedFixRow = {
    ...original,
    issueRefs: [
      { id: left.id, revision: left.revision },
      { id: right.id, revision: right.revision }
    ]
  }
  let state = stateWithRows([left, right, proposed])
  state = accepted(state, {
    type: "issue.exit",
    actor: "master",
    at: at(10),
    id: right.id,
    expectedRevision: right.revision,
    exit: { kind: "user-drop", reason: "User removed the second path" }
  })
  assert.ok(readyWork(state, "A").some((item) =>
    item.command === "issue.take" && item.rowId === left.id
  ))
})

test("an unrelated checkout does not serialize independent shelf review", () => {
  const [issueOne, proposedOne, originalShelf] = branch("A", 1)
  const shelfOne: ShelvedFixRow = { ...originalShelf, state: "shelved", marks: [] }
  const [issueTwo, proposedTwo] = branch("A", 2)
  let state: ProtocolState = {
    ...stateWithRows([issueOne, proposedOne, shelfOne, issueTwo, proposedTwo]),
    issueTakes: [{ issueId: issueTwo.id, issueRevision: issueTwo.revision, holder: "A", takenAt: at(9) }]
  }
  state = accepted(state, {
    type: "checkout.take",
    actor: "A",
    at: at(10),
    purpose: "implement P-A-2",
    rowIds: [proposedTwo.id]
  })
  assert.ok(readyWork(state, "B").some((item) =>
    item.command === "shelved-fix.review" && item.rowId === shelfOne.id
  ))
  state = accepted(state, {
    type: "shelved-fix.review",
    actor: "B",
    at: at(11),
    id: shelfOne.id,
    expectedRevision: shelfOne.revision,
    verdict: "reviewed"
  })
  assert.equal(firstRow(state, "Shelved fix", (row) => row.id === shelfOne.id)?.state, "reviewed")
})

test("single-seat Check-ins cannot delegate execution to the diff-review-only seat", () => {
  const [issue, proposed, shelf] = branch("A", 1)
  let state: ProtocolState = { ...newState({ mode: "single" }), rows: [issue, proposed, shelf] }
  state = accepted(state, { type: "report.record", actor: "A", at: at(10), notesHash: NOTES_HASH })
  const approval = transition(state, {
    type: "check-in.approve",
    actor: "master",
    at: at(11),
    id: "K-M-1",
    shelvedFixIds: [shelf.id],
    executor: "B",
    approval: "User asked B to execute",
    notesHash: NOTES_HASH
  })
  assert.equal(approval.ok, false)
  if (!approval.ok) assert.equal(approval.error.code, "actor")
})

test("an author's shelf checkout freezes its upstream Proposed fix", () => {
  const [issue, proposed, originalShelf] = branch("A", 1)
  const shelf: ShelvedFixRow = {
    ...originalShelf,
    state: "conditions",
    conditions: "Correct the product-specific branch",
    marks: []
  }
  let state: ProtocolState = {
    ...stateWithRows([issue, proposed, shelf]),
    issueTakes: [{ issueId: issue.id, issueRevision: issue.revision, holder: "A", takenAt: at(10) }]
  }
  state = accepted(state, {
    type: "checkout.take",
    actor: "A",
    at: at(11),
    purpose: "correct S-A-1",
    rowIds: [shelf.id]
  })
  const edit = transition(state, {
    type: "proposed-fix.edit",
    actor: "A",
    at: at(12),
    id: proposed.id,
    expectedRevision: proposed.revision,
    fix: proposed.fix
  })
  assert.equal(edit.ok, false)
  if (!edit.ok) assert.equal(edit.error.code, "checkout")
})

test("a mixed report-only proposal may include and release an unmarked nonblocking Issue", () => {
  const [bug, original] = branch("A", 1)
  const [baseHardening] = branch("A", 2)
  const hardening: IssueRow = {
    ...(baseHardening as Extract<IssueRow, { state: "verified" }>),
    label: "Hardening",
    marks: []
  }
  let state: ProtocolState = {
    ...stateWithRows([bug, hardening]),
    policy: "report-only",
    issueTakes: [{ issueId: bug.id, issueRevision: bug.revision, holder: "A", takenAt: at(10) }]
  }
  state = accepted(state, {
    type: "issue.take",
    actor: "A",
    at: at(11),
    id: hardening.id,
    expectedRevision: hardening.revision
  })
  state = accepted(state, {
    type: "proposed-fix.add",
    actor: "A",
    at: at(12),
    id: original.id,
    issueIds: [bug.id, hardening.id],
    fix: original.fix
  })
  const releases = readyWork(state, "A")
    .filter((item) => item.command === "issue.release")
    .map((item) => item.rowId)
    .sort()
  assert.deepEqual(releases, [bug.id, hardening.id])
})
