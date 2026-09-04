/**
 * Pure ledger protocol for the coding skill at 381b16084f61.
 *
 * This module owns names, states, permissions, transitions, invalidation, shared
 * checkout ownership, handoffs, and ready-work classification. It performs no
 * I/O. A CLI decodes input into ProtocolCommand values, a store persists the
 * returned DomainEvent values atomically, and projections render ProtocolState.
 */

export const ACTORS = ["A", "B", "master"] as const;
export type Actor = (typeof ACTORS)[number];
export type Seat = Exclude<Actor, "master">;

export const POLICIES = ["fix", "report-only", "check-in"] as const;
export type Policy = (typeof POLICIES)[number];
export const DEFAULT_POLICY: Policy = "fix";
export const PROTOCOL_SCHEMA_VERSION = 1;

export const RUN_MODES = ["single", "joint", "cold"] as const;
export type RunMode = (typeof RUN_MODES)[number];
export const ROUTES = ["review", "diagnose"] as const;
export type Route = (typeof ROUTES)[number];

export const ROW_KINDS = [
  "Coverage",
  "Issue",
  "Question",
  "Proposed fix",
  "Shelved fix",
  "Check-in",
] as const;
export type RowKind = (typeof ROW_KINDS)[number];

export const COVERAGE_STATES = ["open", "covered", "gap"] as const;
export type CoverageState = (typeof COVERAGE_STATES)[number];

export const ISSUE_STATES = [
  "new",
  "verified",
  "assumed",
  "contested",
  "disproved",
  "duplicate",
  "accepted",
] as const;
export type IssueState = (typeof ISSUE_STATES)[number];

export const QUESTION_STATES = ["open", "answered"] as const;
export type QuestionState = (typeof QUESTION_STATES)[number];

export const PROPOSED_FIX_STATES = ["draft", "marked", "rejected"] as const;
export type ProposedFixState = (typeof PROPOSED_FIX_STATES)[number];

export const SHELVED_FIX_STATES = ["shelved", "conditions", "reviewed"] as const;
export type ShelvedFixState = (typeof SHELVED_FIX_STATES)[number];

export const CHECK_IN_STATES = ["approved", "checked in", "dropped"] as const;
export type CheckInState = (typeof CHECK_IN_STATES)[number];

export type RowState =
  | CoverageState
  | IssueState
  | QuestionState
  | ProposedFixState
  | ShelvedFixState
  | CheckInState;

export const ISSUE_LABELS = [
  "Bug",
  "Restructure",
  "Hardening",
  "Nit",
  "telemetry-quality",
] as const;
export type IssueLabel = (typeof ISSUE_LABELS)[number];
export type Certainty = 1 | 2 | 3 | 4 | 5;
export type VerifiedCertainty = 4 | 5;
export type ImpactRank = 1 | 2 | 3 | 4 | 5;

export type CoverageId = `C-${Seat}-${number}`;
export type IssueId = `I-${Seat}-${number}`;
export type QuestionId = `Q-${Seat}-${number}`;
export type ProposedFixId = `P-${Seat}-${number}`;
export type ShelvedFixId = `S-${Seat}-${number}`;
export type CheckInId = `K-M-${number}`;
export type RowId =
  | CoverageId
  | IssueId
  | QuestionId
  | ProposedFixId
  | ShelvedFixId
  | CheckInId;

export interface RevisionRef<Id extends RowId = RowId> {
  readonly id: Id;
  readonly revision: number;
}

export interface Mark {
  readonly reviewer: Seat;
  readonly revision: number;
  readonly at: string;
}

type NoMark = readonly [];
type OneMark = readonly [Mark];

interface RowBase<Id extends RowId, Kind extends RowKind> {
  readonly id: Id;
  readonly kind: Kind;
  readonly author: Actor;
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly stateChangedAt: string;
}

export interface CoverageCommon extends RowBase<CoverageId, "Coverage"> {
  readonly author: Seat;
  readonly coverageKind: "hunk" | "symptom" | "cluster" | "scenario";
  readonly target: string;
  readonly issueId?: IssueId;
}

export type CoverageRow = CoverageCommon &
  (
    | { readonly state: "open"; readonly marks: NoMark }
    | { readonly state: "covered"; readonly evidence: string; readonly marks: NoMark }
    | { readonly state: "gap"; readonly reason: string; readonly marks: NoMark }
  );

export interface IssueFacts {
  readonly proposition: string;
  readonly site: string;
  readonly trigger: string;
  readonly cause: string;
  readonly scope: string;
  readonly frequency: string;
  readonly impact: string;
  readonly impactRank?: ImpactRank;
  readonly detector?: string;
  readonly detectorGap?: string;
}

export type IssueExit =
  | { readonly kind: "comment-or-assert"; readonly reference: string }
  | { readonly kind: "ruling-or-baseline"; readonly reference: string }
  | { readonly kind: "todo"; readonly reference: string }
  | { readonly kind: "user-drop"; readonly reason: string }
  | { readonly kind: "check-in"; readonly checkInId: CheckInId };

interface IssueCommon extends RowBase<IssueId, "Issue"> {
  readonly author: Seat;
  /** Seat responsible for the current content revision; origin authorship never changes. */
  readonly revisionAuthor: Seat;
  readonly label: IssueLabel;
  readonly labelChangeReason?: string;
  readonly facts: IssueFacts;
  readonly parentIssueIds: readonly IssueId[];
  readonly clusters: readonly string[];
  readonly contestCount: number;
  readonly editCount: number;
  readonly exit?: IssueExit;
}

export type IssueRow = IssueCommon &
  (
    | { readonly state: "new"; readonly certainty: Certainty; readonly marks: NoMark }
    | {
        readonly state: "verified";
        readonly certainty: VerifiedCertainty;
        readonly evidence: string;
        readonly marks: NoMark | OneMark;
      }
    | {
        readonly state: "assumed";
        readonly certainty: Certainty;
        readonly assumption: string;
        readonly noProbeReason: string;
        readonly marks: NoMark | OneMark;
      }
    | {
        readonly state: "contested";
        readonly certainty: Certainty;
        readonly probe: string;
        readonly contestedBy: Seat;
        readonly marks: NoMark;
      }
    | {
        readonly state: "disproved";
        readonly certainty: Certainty;
        readonly evidence: string;
        readonly marks: NoMark;
      }
    | {
        readonly state: "duplicate";
        readonly certainty: Certainty;
        readonly duplicateOf: IssueId;
        readonly marks: NoMark;
      }
    | {
        readonly state: "accepted";
        readonly label: "Nit";
        readonly certainty: Certainty;
        readonly reason: string;
        readonly marks: NoMark;
      }
  );

interface QuestionCommon extends RowBase<QuestionId, "Question"> {
  readonly author: Seat;
  readonly issueIds: readonly IssueId[];
  readonly issueRefs: readonly RevisionRef<IssueId>[];
  readonly purpose: "decision" | "no-red";
  readonly proposedFixRef?: RevisionRef<ProposedFixId>;
  readonly shelvedFixRef?: RevisionRef<ShelvedFixId>;
  readonly question: string;
  readonly options: readonly string[];
  readonly recommendation: string;
  readonly userEffect: string;
  readonly codeCost: string;
  readonly marks: NoMark;
}

export type QuestionRow = QuestionCommon &
  (
    | { readonly state: "open" }
    | { readonly state: "answered"; readonly answer: string; readonly answeredAt: string }
  );

export interface ProposedFixShape {
  readonly originClass?: "attention-miss" | "self-consistency" | "design-absence";
  readonly shape: string;
  readonly sitesWalked?: string;
  readonly rulingsChecked?: string;
  readonly testLocation?: string;
  readonly cost: string;
  readonly interfaceChange?: boolean;
  readonly ownershipChange?: boolean;
  readonly riskSurface?: boolean;
  /** Guardrail that prevents this invariant mismatch from recurring. */
  readonly guardrail?: string;
  /** Overlap, ordering, or shared-file coordination with other proposed fixes. */
  readonly coordination?: string;
}

interface ProposedFixCommon extends RowBase<ProposedFixId, "Proposed fix"> {
  readonly author: Seat;
  readonly proposalKind: "proposal" | "direction";
  readonly issueRefs: readonly RevisionRef<IssueId>[];
  readonly fix: ProposedFixShape;
  readonly priorMarkRequired: boolean;
  readonly shapeEditCount: number;
}

export type ProposedFixRow = ProposedFixCommon &
  (
    | { readonly state: "draft"; readonly marks: NoMark }
    | { readonly state: "marked"; readonly marks: OneMark }
    | { readonly state: "rejected"; readonly reason: string; readonly marks: NoMark }
  );

export interface RunLog {
  readonly path: string;
}

interface ShelvedFixCommon extends RowBase<ShelvedFixId, "Shelved fix"> {
  readonly author: Seat;
  readonly proposedFixRefs: readonly RevisionRef<ProposedFixId>[];
  readonly artifact: string;
  readonly redRun: RunLog | null;
  readonly greenRun: RunLog;
}

export type ShelvedFixRow = ShelvedFixCommon &
  (
    | { readonly state: "shelved"; readonly marks: NoMark }
    | { readonly state: "conditions"; readonly conditions: string; readonly marks: NoMark }
    | { readonly state: "reviewed"; readonly marks: OneMark }
  );

interface CheckInCommon extends RowBase<CheckInId, "Check-in"> {
  readonly author: "master";
  readonly shelvedFixRefs: readonly RevisionRef<ShelvedFixId>[];
  readonly executor: Actor;
  readonly approval: string;
  readonly marks: NoMark;
}

export type CheckInRow = CheckInCommon &
  (
    | { readonly state: "approved" }
    | { readonly state: "checked in"; readonly changeset: string; readonly departures: string }
    | { readonly state: "dropped"; readonly reason: string }
  );

export type LedgerRow =
  | CoverageRow
  | IssueRow
  | QuestionRow
  | ProposedFixRow
  | ShelvedFixRow
  | CheckInRow;

export interface CheckoutHold {
  readonly holder: Seat;
  readonly purpose: string;
  readonly rowIds: readonly RowId[];
  readonly targets: readonly CheckoutTarget[];
  readonly takenAt: string;
}

export interface CheckoutTarget {
  readonly id: RowId;
  readonly revision: number;
  readonly state: RowState;
  /** Whether the target's upstream revision links were current at take time. */
  readonly current: boolean;
}

export interface IssueTake {
  readonly issueId: IssueId;
  readonly issueRevision: number;
  readonly holder: Seat;
  readonly takenAt: string;
}

export interface Baseline {
  readonly recordedBy: Seat;
  readonly buildLog: string;
  readonly testLog: string;
  readonly recordedAt: string;
}

export interface Handoff {
  readonly seat: Seat;
  readonly at: string;
}

export interface ReportCheckpoint {
  readonly recordedBy: "A" | "master";
  readonly recordedAt: string;
  /** SHA-256 of the external reviewer-notes inputs used to render this report. */
  readonly notesHash: string;
}

export interface Notification {
  readonly recipient: Actor;
  readonly kind: "ready-work" | "handoff" | "question" | "answer" | "no-ready-work-left";
  readonly message: string;
  readonly rowIds: readonly RowId[];
  readonly at: string;
}

export interface ProtocolState {
  readonly schemaVersion: typeof PROTOCOL_SCHEMA_VERSION;
  /** Unpredictable run nonce shared by the joint run and both cold passes. */
  readonly campaignId: string;
  readonly mode: RunMode;
  /** Whether the local run owes the deep-review notes and pass accounting. */
  readonly deep: boolean;
  readonly coldSeat: Seat | null;
  readonly route: Route;
  readonly policy: Policy;
  readonly reportPath: string | null;
  readonly names: Readonly<Record<Actor, string>>;
  readonly declaredCoverage: readonly Pick<CoverageCommon, "coverageKind" | "target">[];
  readonly rows: readonly LedgerRow[];
  readonly checkout: CheckoutHold | null;
  readonly issueTakes: readonly IssueTake[];
  readonly baseline: Baseline | null;
  readonly handoffs: Readonly<Record<Seat, Handoff | null>>;
  readonly imports: Readonly<Record<Seat, boolean>>;
  readonly reportCheckpoint: ReportCheckpoint | null;
  readonly notifications: readonly Notification[];
}

export interface ProtocolOptions {
  readonly campaignId: string;
  readonly mode?: RunMode;
  readonly deep?: boolean;
  readonly coldSeat?: Seat;
  readonly route?: Route;
  readonly policy?: Policy;
  readonly reportPath?: string | null;
  readonly names?: Partial<Record<Actor, string>>;
  readonly declaredCoverage?: readonly Pick<CoverageCommon, "coverageKind" | "target">[];
}

function hasRequiredCoverageDeclaration(
  route: Route,
  deep: boolean,
  declared: readonly Pick<CoverageCommon, "coverageKind" | "target">[],
): boolean {
  if (route === "diagnose") {
    return declared.some((item) => item.coverageKind === "symptom" || item.coverageKind === "cluster");
  }
  return !deep || declared.some((item) => item.coverageKind === "hunk" || item.coverageKind === "scenario");
}

export function initialProtocolState(options: ProtocolOptions): ProtocolState {
  if (!options.campaignId.trim()) throw new Error("campaignId must not be empty");
  const mode = options.mode ?? "joint";
  const deep = mode === "single" ? options.deep ?? false : true;
  const route = options.route ?? "review";
  const declaredCoverage = options.declaredCoverage ?? [];
  if (
    options.declaredCoverage !== undefined &&
    !hasRequiredCoverageDeclaration(route, deep, declaredCoverage)
  ) {
    throw new Error(
      route === "diagnose"
        ? "diagnosis initialization needs a declared symptom or cluster"
        : "deep review initialization needs a declared hunk or scenario",
    );
  }
  return {
    schemaVersion: PROTOCOL_SCHEMA_VERSION,
    campaignId: options.campaignId,
    mode,
    deep,
    coldSeat: mode === "cold" ? options.coldSeat ?? "A" : null,
    route,
    policy: options.policy ?? DEFAULT_POLICY,
    reportPath: options.reportPath ?? null,
    names: { A: options.names?.A ?? "A", B: options.names?.B ?? "B", master: options.names?.master ?? "master" },
    declaredCoverage,
    rows: [],
    checkout: null,
    issueTakes: [],
    baseline: null,
    handoffs: { A: null, B: null },
    imports: { A: false, B: false },
    reportCheckpoint: null,
    notifications: [],
  };
}

interface CommandEnvelope<Type extends string, Who extends Actor = Actor> {
  readonly type: Type;
  readonly actor: Who;
  readonly at: string;
}

export type ProtocolCommand =
  | (CommandEnvelope<"run.escalate", Seat> & {
      readonly declaredCoverage?: readonly Pick<CoverageCommon, "coverageKind" | "target">[];
    })
  | (CommandEnvelope<"cold.import", Seat> & {
      readonly campaignId: string;
      readonly rows: readonly (CoverageRow | IssueRow)[];
    })
  | (CommandEnvelope<"coverage.add", Seat> & {
      readonly id: CoverageId;
      readonly coverageKind: CoverageCommon["coverageKind"];
      readonly target: string;
      readonly issueId?: IssueId;
      readonly initial?:
        | { readonly state: "covered"; readonly evidence: string }
        | { readonly state: "gap"; readonly reason: string };
    })
  | (CommandEnvelope<"coverage.cover", Seat> & {
      readonly id: CoverageId;
      readonly expectedRevision: number;
      readonly evidence: string;
    })
  | (CommandEnvelope<"coverage.gap", Seat> & {
      readonly id: CoverageId;
      readonly expectedRevision: number;
      readonly reason: string;
    })
  | (CommandEnvelope<"issue.add", Seat> & {
      readonly id: IssueId;
      readonly label: IssueLabel;
      readonly certainty: Certainty;
      readonly facts: IssueFacts;
      readonly clusters?: readonly string[];
      readonly parentIssueIds?: readonly IssueId[];
      readonly initial?:
        | { readonly state: "verified"; readonly certainty: VerifiedCertainty; readonly evidence: string }
        | {
            readonly state: "assumed";
            readonly certainty: Certainty;
            readonly assumption: string;
            readonly noProbeReason: string;
          }
        | { readonly state: "accepted"; readonly reason: string };
    })
  | (CommandEnvelope<"issue.edit", Seat> & {
      readonly id: IssueId;
      readonly expectedRevision: number;
      readonly facts: Partial<IssueFacts>;
      readonly label?: IssueLabel;
      readonly labelChangeReason?: string;
      readonly clusters?: readonly string[];
      readonly parentIssueIds?: readonly IssueId[];
      readonly certainty?: Certainty;
      readonly evidence?: string;
      readonly assumption?: string;
      readonly noProbeReason?: string;
    })
  | (CommandEnvelope<"issue.verify", Seat> & {
      readonly id: IssueId;
      readonly expectedRevision: number;
      readonly certainty: VerifiedCertainty;
      readonly evidence: string;
    })
  | (CommandEnvelope<"issue.assume", Seat> & {
      readonly id: IssueId;
      readonly expectedRevision: number;
      readonly certainty: Certainty;
      readonly assumption: string;
      readonly noProbeReason: string;
    })
  | (CommandEnvelope<"issue.mark", Seat> & { readonly id: IssueId; readonly expectedRevision: number })
  | (CommandEnvelope<"issue.contest", Seat> & {
      readonly id: IssueId;
      readonly expectedRevision: number;
      readonly probe: string;
    })
  | (CommandEnvelope<"issue.probe", Seat> & {
      readonly id: IssueId;
      readonly expectedRevision: number;
      readonly verdict: "verified" | "disproved";
      readonly certainty: VerifiedCertainty;
      readonly evidence: string;
    })
  | (CommandEnvelope<"issue.disprove", Seat> & {
      readonly id: IssueId;
      readonly expectedRevision: number;
      readonly certainty: Certainty;
      readonly evidence: string;
    })
  | (CommandEnvelope<"issue.duplicate", Seat> & {
      readonly id: IssueId;
      readonly expectedRevision: number;
      readonly duplicateOf: IssueId;
    })
  | (CommandEnvelope<"issue.accept", Seat> & {
      readonly id: IssueId;
      readonly expectedRevision: number;
      readonly reason: string;
    })
  | (CommandEnvelope<"issue.exit", Actor> & {
      readonly id: IssueId;
      readonly expectedRevision: number;
      readonly exit: Exclude<IssueExit, { readonly kind: "check-in" }>;
    })
  | (CommandEnvelope<"issue.take", Seat> & { readonly id: IssueId; readonly expectedRevision: number })
  | (CommandEnvelope<"issue.release", Seat> & { readonly id: IssueId; readonly expectedRevision: number })
  | (CommandEnvelope<"question.add", Seat> & {
      readonly id: QuestionId;
      readonly issueIds: readonly IssueId[];
      readonly purpose: "decision" | "no-red";
      readonly proposedFixRef?: RevisionRef<ProposedFixId>;
      readonly shelvedFixRef?: RevisionRef<ShelvedFixId>;
      readonly question: string;
      readonly options: readonly string[];
      readonly recommendation: string;
      readonly userEffect: string;
      readonly codeCost: string;
    })
  | (CommandEnvelope<"question.answer", "master"> & {
      readonly id: QuestionId;
      readonly expectedRevision: number;
      readonly answer: string;
    })
  | (CommandEnvelope<"proposed-fix.add", Seat> & {
      readonly id: ProposedFixId;
      readonly issueIds: readonly IssueId[];
      readonly fix: ProposedFixShape;
      readonly proposalKind?: "proposal" | "direction";
    })
  | (CommandEnvelope<"proposed-fix.edit", Seat> & {
      readonly id: ProposedFixId;
      readonly expectedRevision: number;
      readonly fix: ProposedFixShape;
    })
  | (CommandEnvelope<"proposed-fix.mark", Seat> & {
      readonly id: ProposedFixId;
      readonly expectedRevision: number;
    })
  | (CommandEnvelope<"proposed-fix.reject", Seat> & {
      readonly id: ProposedFixId;
      readonly expectedRevision: number;
      readonly reason: string;
    })
  | (CommandEnvelope<"shelved-fix.add", Seat> & {
      readonly id: ShelvedFixId;
      readonly proposedFixIds: readonly ProposedFixId[];
      readonly artifact: string;
      readonly redRun: RunLog | null;
      readonly greenRun: RunLog;
    })
  | (CommandEnvelope<"shelved-fix.edit", Seat> & {
      readonly id: ShelvedFixId;
      readonly expectedRevision: number;
      readonly artifact: string;
      readonly redRun: RunLog | null;
      readonly greenRun: RunLog;
    })
  | (CommandEnvelope<"shelved-fix.review", Seat> & {
      readonly id: ShelvedFixId;
      readonly expectedRevision: number;
      readonly verdict: "reviewed" | "conditions";
      readonly conditions?: string;
    })
  | (CommandEnvelope<"check-in.approve", "master"> & {
      readonly id: CheckInId;
      readonly shelvedFixIds: readonly ShelvedFixId[];
      readonly executor: Actor;
      readonly approval: string;
      readonly notesHash: string;
    })
  | (CommandEnvelope<"check-in.record", Actor> & {
      readonly id: CheckInId;
      readonly expectedRevision: number;
      readonly changeset: string;
      readonly departures: string;
    })
  | (CommandEnvelope<"check-in.drop", "master"> & {
      readonly id: CheckInId;
      readonly expectedRevision: number;
      readonly reason: string;
    })
  | (CommandEnvelope<"checkout.take", Seat> & {
      readonly purpose: string;
      readonly rowIds: readonly RowId[];
    })
  | (CommandEnvelope<"checkout.baseline", Seat> & {
      readonly buildLog: string;
      readonly testLog: string;
    })
  | (CommandEnvelope<"checkout.release", Actor> & {
      readonly probesRemoved: boolean;
      readonly shelvesRecorded: boolean;
      readonly reason?: string;
    })
  | (CommandEnvelope<"report.record", "A" | "master"> & { readonly notesHash: string })
  | CommandEnvelope<"handoff", Seat>;

export type CommandType = ProtocolCommand["type"];

/** Compile-time exhaustive list used by table-driven protocol tests. */
export const STATE_CHANGING_COMMANDS = {
  "run.escalate": "campaign",
  "cold.import": "campaign",
  "coverage.add": "Coverage",
  "coverage.cover": "Coverage",
  "coverage.gap": "Coverage",
  "issue.add": "Issue",
  "issue.edit": "Issue",
  "issue.verify": "Issue",
  "issue.assume": "Issue",
  "issue.mark": "Issue",
  "issue.contest": "Issue",
  "issue.probe": "Issue",
  "issue.disprove": "Issue",
  "issue.duplicate": "Issue",
  "issue.accept": "Issue",
  "issue.exit": "Issue",
  "issue.take": "Issue",
  "issue.release": "Issue",
  "question.add": "Question",
  "question.answer": "Question",
  "proposed-fix.add": "Proposed fix",
  "proposed-fix.edit": "Proposed fix",
  "proposed-fix.mark": "Proposed fix",
  "proposed-fix.reject": "Proposed fix",
  "shelved-fix.add": "Shelved fix",
  "shelved-fix.edit": "Shelved fix",
  "shelved-fix.review": "Shelved fix",
  "check-in.approve": "Check-in",
  "check-in.record": "Check-in",
  "check-in.drop": "Check-in",
  "checkout.take": "checkout",
  "checkout.baseline": "checkout",
  "checkout.release": "checkout",
  "report.record": "campaign",
  handoff: "handoff",
} as const satisfies Record<CommandType, RowKind | "campaign" | "checkout" | "handoff">;

interface EventEnvelope<Type extends string> {
  readonly type: Type;
  readonly command: CommandType;
  readonly actor: Actor;
  readonly at: string;
  readonly from: string | null;
  readonly to: string | null;
}

export type DomainEvent =
  | (EventEnvelope<"run.changed"> & {
      readonly deep: boolean;
      readonly declaredCoverage: readonly Pick<CoverageCommon, "coverageKind" | "target">[];
    })
  | (EventEnvelope<"row.changed"> & {
      readonly rowId: RowId;
      readonly rowKind: RowKind;
      readonly before: LedgerRow | null;
      readonly after: LedgerRow;
      readonly reason: "command" | "revision-invalidation" | "check-in";
    })
  | (EventEnvelope<"checkout.changed"> & {
      readonly checkout: CheckoutHold | null;
      readonly baseline: Baseline | null;
      readonly release?: { readonly forced: boolean; readonly reason?: string };
    })
  | (EventEnvelope<"handoff.changed"> & {
      readonly seat: Seat;
      readonly handoff: Handoff | null;
    })
  | (EventEnvelope<"import.changed"> & { readonly seat: Seat; readonly imported: boolean })
  | (EventEnvelope<"issue-take.changed"> & {
      readonly issueId: IssueId;
      readonly take: IssueTake | null;
    })
  | (EventEnvelope<"report.changed"> & { readonly checkpoint: ReportCheckpoint | null })
  | (EventEnvelope<"notification.requested"> & { readonly notification: Notification });

export interface ProtocolError {
  readonly code:
    | "actor"
    | "checkout"
    | "duplicate-id"
    | "evidence"
    | "invalid-state"
    | "missing-row"
    | "policy"
    | "question"
    | "ready-work"
    | "revision"
    | "self-mark"
    | "stale-reference";
  readonly message: string;
  readonly command: CommandType;
}

export type TransitionResult =
  | { readonly ok: true; readonly state: ProtocolState; readonly events: readonly DomainEvent[] }
  | { readonly ok: false; readonly error: ProtocolError };

export interface ReadyWork {
  readonly actor: Actor;
  readonly command: CommandType;
  readonly rowId?: RowId;
  readonly reason: string;
}

export interface CoverageResult {
  readonly coverageKind: CoverageCommon["coverageKind"];
  readonly target: string;
  readonly state: CoverageState;
}

class Rejected extends Error {
  constructor(readonly code: ProtocolError["code"], message: string) {
    super(message);
  }
}

function reject(code: ProtocolError["code"], message: string): never {
  throw new Rejected(code, message);
}

function requireText(value: string, name: string): void {
  if (!value.trim()) reject("evidence", `${name} must not be empty`);
}

function requireSha256(value: string, name: string): void {
  if (!/^[0-9a-f]{64}$/.test(value)) reject("evidence", `${name} must be a lowercase SHA-256`);
}

function requireList<T>(values: readonly T[], name: string): void {
  if (values.length === 0) reject("evidence", `${name} must not be empty`);
}

function selectedQuestionOption(options: readonly string[], value: string): string | undefined {
  const normalized = options.map(normalizedAnswer);
  const selected = normalizedAnswer(value);
  const exactIndex = normalized.indexOf(selected);
  if (exactIndex >= 0) return options[exactIndex];
  const label = /^\(([a-z])\)(?:\s|$)/i.exec(value.trim())?.[1]?.toLowerCase();
  if (!label) return undefined;
  const index = label.charCodeAt(0) - "a".charCodeAt(0);
  if (index < 0 || index >= options.length) return undefined;
  const option = options[index];
  if (option === undefined) return undefined;
  const optionLabel = /^\(([a-z])\)(?:\s|$)/i.exec(option.trim())?.[1]?.toLowerCase();
  return optionLabel === undefined || optionLabel === label ? option : undefined;
}

function mapsToQuestionOption(options: readonly string[], value: string): boolean {
  return selectedQuestionOption(options, value) !== undefined;
}

function requireQuestionOptions(options: readonly string[], recommendation: string): void {
  if (options.length < 2) reject("question", "A Question needs at least two options");
  const normalized = options.map((option) => {
    requireText(option, "Question option");
    return normalizedAnswer(option);
  });
  if (new Set(normalized).size !== normalized.length) {
    reject("question", "Question options must be distinct");
  }
  requireText(recommendation, "Question recommendation");
  if (!mapsToQuestionOption(options, recommendation)) {
    reject("question", "Question recommendation must map to an offered option");
  }
}

function requireTimestamp(at: string): void {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(at) || new Date(at).toISOString() !== at) {
    reject("evidence", `invalid timestamp '${at}'`);
  }
}

function rowById<Id extends RowId>(state: ProtocolState, id: Id): Extract<LedgerRow, { id: Id }> {
  const row = state.rows.find((candidate) => candidate.id === id);
  if (!row) reject("missing-row", `row ${id} does not exist`);
  return row as Extract<LedgerRow, { id: Id }>;
}

function rowOfKind<Kind extends RowKind>(
  state: ProtocolState,
  id: RowId,
  kind: Kind,
): Extract<LedgerRow, { kind: Kind }> {
  const row = rowById(state, id);
  if (row.kind !== kind) reject("invalid-state", `${id} is ${row.kind}, not ${kind}`);
  return row as Extract<LedgerRow, { kind: Kind }>;
}

function expectRevision(row: LedgerRow, expected: number): void {
  if (row.revision !== expected) {
    reject("revision", `${row.id} is revision ${row.revision}, not ${expected}`);
  }
}

function ensureUniqueId(state: ProtocolState, id: RowId): void {
  if (state.rows.some((row) => row.id === id)) reject("duplicate-id", `row ${id} already exists`);
}

function isSeat(actor: Actor): actor is Seat {
  return actor === "A" || actor === "B";
}

export function otherSeat(seat: Seat): Seat {
  return seat === "A" ? "B" : "A";
}

function currentMark(row: IssueRow | ProposedFixRow | ShelvedFixRow): Mark | null {
  return row.marks[0] ?? null;
}

function hasCurrentMark(row: IssueRow | ProposedFixRow | ShelvedFixRow): boolean {
  const mark = currentMark(row);
  return mark !== null && mark.revision === row.revision;
}

function refsCurrent<Kind extends RowKind>(
  state: ProtocolState,
  refs: readonly RevisionRef[],
  kind: Kind,
): boolean {
  return refs.every((ref) => {
    const row = state.rows.find((candidate) => candidate.id === ref.id);
    return row?.kind === kind && row.revision === ref.revision;
  });
}

function hasOpenQuestion(state: ProtocolState, issueId: IssueId): boolean {
  return state.rows.some(
    (row) => row.kind === "Question" && row.state === "open" && row.issueIds.includes(issueId),
  );
}

function hasAnyQuestion(state: ProtocolState, issueId: IssueId): boolean {
  const issue = rowOfKind(state, issueId, "Issue");
  return state.rows.some(
    (row) => row.kind === "Question" &&
      row.issueRefs.some((ref) => ref.id === issueId && ref.revision === issue.revision),
  );
}

function hasAnsweredDecision(state: ProtocolState, issueId: IssueId): boolean {
  const issue = rowOfKind(state, issueId, "Issue");
  return state.rows.some((row) =>
    row.kind === "Question" &&
    row.purpose === "decision" &&
    row.state === "answered" &&
    row.issueRefs.some((ref) => ref.id === issueId && ref.revision === issue.revision),
  );
}

function hasAnsweredShapeDecision(state: ProtocolState, proposed: ProposedFixRow): boolean {
  return state.rows.some((row) =>
    row.kind === "Question" &&
    row.purpose === "decision" &&
    row.state === "answered" &&
    row.proposedFixRef?.id === proposed.id &&
    row.proposedFixRef.revision === proposed.revision,
  );
}

function issueTake(state: ProtocolState, issueId: IssueId): IssueTake | null {
  return state.issueTakes.find((take) => take.issueId === issueId) ?? null;
}

function issueIdsForProposedFixRefs(
  state: ProtocolState,
  refs: readonly RevisionRef<ProposedFixId>[],
): IssueId[] {
  return [...new Set(refs.flatMap((ref) => {
    const row = rowOfKind(state, ref.id, "Proposed fix");
    return row.issueRefs.map((issueRef) => issueRef.id);
  }))];
}

export const ALLOW_NO_RED_ANSWER = "allow-no-red";

function normalizedAnswer(answer: string): string {
  return answer.trim().toLowerCase();
}

function currentNoRedQuestion(
  state: ProtocolState,
  proposed: ProposedFixRow,
): QuestionRow | undefined {
  return state.rows.find((row): row is QuestionRow =>
    row.kind === "Question" &&
    row.purpose === "no-red" &&
    row.proposedFixRef?.id === proposed.id &&
    row.proposedFixRef.revision === proposed.revision &&
    proposed.issueRefs.every((issueRef) =>
      row.issueRefs.some((questionRef) =>
        questionRef.id === issueRef.id && questionRef.revision === issueRef.revision,
      ),
    ),
  );
}

/** A missing red run is authorized only by an explicit, linked user answer. */
export function allowsNoRedRun(
  state: ProtocolState,
  refs: readonly RevisionRef<ProposedFixId>[],
): boolean {
  return refs.length > 0 && refs.every((proposedRef) => {
    const issueIds = issueIdsForProposedFixRefs(state, [proposedRef]);
    const proposed = rowOfKind(state, proposedRef.id, "Proposed fix");
    const architecture = normalizedAnswer(proposed.fix.testLocation ?? "") === "none" &&
      proposed.fix.originClass === "design-absence" &&
      issueIds.some((issueId) => issueOrAncestorHasLabel(state, issueId, "Restructure"));
    return architecture && state.rows.some((row) =>
      row.kind === "Question" &&
      row.purpose === "no-red" &&
      row.state === "answered" &&
      normalizedAnswer(row.answer) === ALLOW_NO_RED_ANSWER &&
      row.proposedFixRef?.id === proposedRef.id &&
      row.proposedFixRef.revision === proposedRef.revision &&
      proposed.issueRefs.every((issueRef) =>
        row.issueRefs.some((questionRef) =>
          questionRef.id === issueRef.id && questionRef.revision === issueRef.revision,
        ),
      ),
    );
  });
}

function issueOrAncestorHasLabel(
  state: ProtocolState,
  issueId: IssueId,
  label: IssueLabel,
  seen = new Set<IssueId>(),
): boolean {
  if (seen.has(issueId)) return false;
  seen.add(issueId);
  const issue = rowOfKind(state, issueId, "Issue");
  return issue.label === label || issue.parentIssueIds.some((parentId) =>
    issueOrAncestorHasLabel(state, parentId, label, seen),
  );
}

function proposedFixesForIssue(state: ProtocolState, issueId: IssueId): ProposedFixRow[] {
  return state.rows.filter(
    (row): row is ProposedFixRow =>
      row.kind === "Proposed fix" && row.issueRefs.some((ref) => ref.id === issueId),
  );
}

function proposedFixHasOpenQuestion(state: ProtocolState, proposed: ProposedFixRow): boolean {
  return proposed.issueRefs.some((ref) => hasOpenQuestion(state, ref.id));
}

function shelvedFixesForProposedFix(state: ProtocolState, id: ProposedFixId): ShelvedFixRow[] {
  return state.rows.filter(
    (row): row is ShelvedFixRow =>
      row.kind === "Shelved fix" && row.proposedFixRefs.some((ref) => ref.id === id),
  );
}

function issueIdsForShelvedFix(state: ProtocolState, shelved: ShelvedFixRow): readonly IssueId[] {
  return issueIdsForProposedFixRefs(state, shelved.proposedFixRefs);
}

function issueIsSubstantive(issue: IssueRow): boolean {
  return issue.label === "Bug" || issue.label === "Restructure";
}

function issueIsDirectlyFixable(issue: IssueRow): boolean {
  return issueIsSubstantive(issue) || issue.label === "telemetry-quality";
}

function proposedFixIsSubstantive(state: ProtocolState, proposed: ProposedFixRow): boolean {
  return proposed.issueRefs.some((ref) => {
    const issue = state.rows.find(
      (row): row is IssueRow => row.kind === "Issue" && row.id === ref.id,
    );
    return issue !== undefined && issueIsSubstantive(issue);
  });
}

function proposedFixIsDirectlyShelvable(state: ProtocolState, proposed: ProposedFixRow): boolean {
  return proposed.issueRefs.some((ref) => {
    const issue = state.rows.find(
      (row): row is IssueRow => row.kind === "Issue" && row.id === ref.id,
    );
    return issue !== undefined && issueIsDirectlyFixable(issue);
  });
}

function proposedFixHasDispositionedIssue(state: ProtocolState, proposed: ProposedFixRow): boolean {
  return proposed.issueRefs.some((ref) => {
    const issue = state.rows.find(
      (row): row is IssueRow => row.kind === "Issue" && row.id === ref.id,
    );
    return issue === undefined || issue.exit !== undefined ||
      (issue.state !== "verified" && issue.state !== "assumed");
  });
}

function shelvedFixIsSubstantive(state: ProtocolState, shelved: ShelvedFixRow): boolean {
  return shelved.proposedFixRefs.some((ref) => {
    const proposed = state.rows.find(
      (row): row is ProposedFixRow => row.kind === "Proposed fix" && row.id === ref.id,
    );
    return proposed !== undefined && proposedFixIsSubstantive(state, proposed);
  });
}

function shelvedFixIsDirectlyReviewable(state: ProtocolState, shelved: ShelvedFixRow): boolean {
  return shelved.proposedFixRefs.some((ref) => {
    const proposed = state.rows.find(
      (row): row is ProposedFixRow => row.kind === "Proposed fix" && row.id === ref.id,
    );
    return proposed !== undefined && proposedFixIsDirectlyShelvable(state, proposed);
  });
}

function proposedFixIsCurrent(state: ProtocolState, proposed: ProposedFixRow): boolean {
  return refsCurrent(state, proposed.issueRefs, "Issue") &&
    !proposedFixHasDispositionedIssue(state, proposed) &&
    !proposedFixHasOpenQuestion(state, proposed);
}

function shelvedFixIsCurrent(state: ProtocolState, shelved: ShelvedFixRow): boolean {
  if (!refsCurrent(state, shelved.proposedFixRefs, "Proposed fix")) return false;
  return shelved.proposedFixRefs.every((ref) => {
    const proposed = state.rows.find(
      (row): row is ProposedFixRow => row.kind === "Proposed fix" && row.id === ref.id,
    );
    return proposed !== undefined && proposedFixIsCurrent(state, proposed);
  });
}

function shelvedFixHasOpenQuestion(state: ProtocolState, shelved: ShelvedFixRow): boolean {
  return state.rows.some((row) =>
    row.kind === "Question" &&
    row.state === "open" &&
    row.shelvedFixRef?.id === shelved.id &&
    row.shelvedFixRef.revision === shelved.revision,
  );
}

function shelvedFixHasCurrentQuestion(state: ProtocolState, shelved: ShelvedFixRow): boolean {
  return state.rows.some((row) =>
    row.kind === "Question" &&
    row.shelvedFixRef?.id === shelved.id &&
    row.shelvedFixRef.revision === shelved.revision,
  );
}

function checkoutTouchesShelvedFix(state: ProtocolState, shelved: ShelvedFixRow): boolean {
  if (!state.checkout) return false;
  if (state.checkout.rowIds.includes(shelved.id)) return true;
  return shelved.proposedFixRefs.some((proposedRef) => {
    if (state.checkout?.rowIds.includes(proposedRef.id)) return true;
    const proposed = rowOfKind(state, proposedRef.id, "Proposed fix");
    return proposed.issueRefs.some((issueRef) => checkoutTouchesIssue(state, issueRef.id));
  });
}

function checkoutTouchesIssue(state: ProtocolState, issueId: IssueId): boolean {
  return state.checkout?.rowIds.some((id) => {
    const row = rowById(state, id);
    if (row.kind === "Issue") return row.id === issueId;
    if (row.kind === "Proposed fix") return row.issueRefs.some((ref) => ref.id === issueId);
    if (row.kind === "Shelved fix") {
      return row.proposedFixRefs.some((ref) =>
        rowOfKind(state, ref.id, "Proposed fix").issueRefs.some((issueRef) => issueRef.id === issueId),
      );
    }
    return false;
  }) ?? false;
}

function rejectOtherSeatIssueWork(state: ProtocolState, issueId: IssueId, actor: Actor): void {
  if (!isSeat(actor)) return;
  const take = issueTake(state, issueId);
  if (take && take.holder !== actor) {
    reject("actor", `${issueId} is taken by ${take.holder}`);
  }
  if (state.checkout && checkoutTouchesIssue(state, issueId)) {
    if (state.checkout.holder !== actor) {
      reject("checkout", `${issueId} is frozen by ${state.checkout.holder}'s checkout work`);
    }
    if (!state.checkout.rowIds.includes(issueId)) {
      reject("checkout", `${issueId} is an upstream dependency frozen during checkout work`);
    }
  }
}

function rejectProposedWork(
  state: ProtocolState,
  proposed: ProposedFixRow,
  actor: Seat,
  includeIssueTakes: boolean,
): void {
  if (includeIssueTakes) {
    for (const ref of proposed.issueRefs) {
      const take = issueTake(state, ref.id);
      if (take && take.holder !== actor) reject("actor", `${ref.id} is taken by ${take.holder}`);
    }
  }
  if (
    state.checkout &&
    state.checkout.holder !== actor &&
    (state.checkout.rowIds.some((id) => {
        const row = rowById(state, id);
        return row.id === proposed.id ||
          (row.kind === "Shelved fix" && row.proposedFixRefs.some((ref) => ref.id === proposed.id));
      }) || proposed.issueRefs.some((ref) => checkoutTouchesIssue(state, ref.id)))
  ) {
    reject("checkout", `${proposed.id} is frozen by ${state.checkout.holder}'s checkout work`);
  }
  const ownDependentShelfTarget = state.checkout?.holder === actor && state.checkout.rowIds.some((id) => {
    const row = rowById(state, id);
    return row.kind === "Shelved fix" && row.proposedFixRefs.some((ref) => ref.id === proposed.id);
  });
  if (ownDependentShelfTarget) {
    reject("checkout", `${proposed.id} is an upstream dependency frozen during checkout work`);
  }
  const ownTarget = state.checkout?.holder === actor
    ? state.checkout.targets.find((target) => target.id === proposed.id)
    : undefined;
  if (ownTarget?.current && ownTarget.state !== "rejected") {
    reject("checkout", `${proposed.id} is frozen at the revision being implemented`);
  }
}

function checkInsForShelvedFix(state: ProtocolState, id: ShelvedFixId): CheckInRow[] {
  return state.rows.filter(
    (row): row is CheckInRow =>
      row.kind === "Check-in" && row.shelvedFixRefs.some((ref) => ref.id === id),
  );
}

function checkoutWorkRecorded(state: ProtocolState, hold: CheckoutHold): boolean {
  return hold.targets.every((target) => {
    const row = rowById(state, target.id);
    if (row.kind === "Issue") {
      return row.revision > target.revision && row.revisionAuthor === hold.holder;
    }
    if (row.kind === "Proposed fix") {
      if (target.state === "rejected" || !target.current) {
        return row.revision > target.revision && row.author === hold.holder;
      }
      return shelvedFixesForProposedFix(state, row.id).some((shelved) =>
        shelved.author === hold.holder &&
        shelved.createdAt > hold.takenAt &&
        shelved.proposedFixRefs.some((ref) => ref.id === row.id && ref.revision === target.revision),
      );
    }
    if (row.kind === "Shelved fix") {
      return row.author === hold.holder &&
        row.revision > target.revision &&
        row.state === "shelved";
    }
    if (row.kind === "Coverage") {
      return row.author === hold.holder && row.revision > target.revision && row.state !== "open";
    }
    return false;
  });
}

function checkoutTargetEligible(
  state: ProtocolState,
  row: LedgerRow,
  actor: Seat,
  batchRowIds: readonly RowId[] = [],
): boolean {
  if (row.kind === "Issue") {
    return issueIsSubstantive(row) && !row.exit && (
      (row.state === "new" && row.revisionAuthor === actor) ||
      (row.state === "contested" && row.contestCount >= 2 && row.contestedBy === actor) ||
      (row.state === "contested" && row.contestCount < 2 && row.revisionAuthor !== actor) ||
      (row.state === "disproved" && row.revisionAuthor === actor)
    );
  }
  if (row.kind === "Proposed fix") {
    const batchHasSubstantiveProposal = batchRowIds.some((id) => {
      const candidate = state.rows.find((value): value is ProposedFixRow =>
        value.kind === "Proposed fix" && value.id === id,
      );
      return candidate !== undefined && proposedFixIsDirectlyShelvable(state, candidate);
    });
    if (
      row.proposalKind !== "proposal" ||
      (!proposedFixIsDirectlyShelvable(state, row) && !batchHasSubstantiveProposal) ||
      proposedFixHasDispositionedIssue(state, row) ||
      proposedFixHasOpenQuestion(state, row)
    ) return false;
    const staleRepair = row.author === actor && !refsCurrent(state, row.issueRefs, "Issue");
    const rejectedRepair = row.author === actor && row.state === "rejected";
    const readyToShelve = refsCurrent(state, row.issueRefs, "Issue") &&
      (row.state === "marked" || (row.state === "draft" && !row.priorMarkRequired)) &&
      shelvedFixesForProposedFix(state, row.id).length === 0 &&
      row.issueRefs.every((ref) => issueTake(state, ref.id)?.holder === actor) &&
      (normalizedAnswer(row.fix.testLocation ?? "") !== "none" ||
        allowsNoRedRun(state, [{ id: row.id, revision: row.revision }]));
    return staleRepair || rejectedRepair || readyToShelve;
  }
  if (row.kind === "Shelved fix") {
    if (row.author !== actor || !shelvedFixIsDirectlyReviewable(state, row)) return false;
    if (!issueIdsForShelvedFix(state, row).every((id) => issueTake(state, id)?.holder === actor)) {
      return false;
    }
    if (row.state === "conditions" && shelvedFixIsCurrent(state, row)) return true;
    if (shelvedFixIsCurrent(state, row)) return false;
    return row.proposedFixRefs.every((ref) => {
      const proposed = state.rows.find(
        (candidate): candidate is ProposedFixRow => candidate.kind === "Proposed fix" && candidate.id === ref.id,
      );
      return proposed !== undefined &&
        proposedFixIsCurrent(state, proposed) &&
        proposed.proposalKind === "proposal" &&
        (proposed.state === "marked" || (proposed.state === "draft" && !proposed.priorMarkRequired));
    });
  }
  if (row.kind === "Coverage") {
    return row.author === actor && row.state === "open";
  }
  return false;
}

function replaceRow(state: ProtocolState, after: LedgerRow): ProtocolState {
  const found = state.rows.some((row) => row.id === after.id);
  return {
    ...state,
    rows: found
      ? state.rows.map((row) => (row.id === after.id ? after : row))
      : [...state.rows, after],
  };
}

export function applyEvent(state: ProtocolState, event: DomainEvent): ProtocolState {
  switch (event.type) {
    case "run.changed":
      return { ...state, deep: event.deep, declaredCoverage: event.declaredCoverage };
    case "row.changed":
      return replaceRow(state, event.after);
    case "checkout.changed":
      return { ...state, checkout: event.checkout, baseline: event.baseline };
    case "handoff.changed":
      return { ...state, handoffs: { ...state.handoffs, [event.seat]: event.handoff } };
    case "import.changed":
      return { ...state, imports: { ...state.imports, [event.seat]: event.imported } };
    case "issue-take.changed":
      return {
        ...state,
        issueTakes: event.take
          ? [...state.issueTakes.filter((take) => take.issueId !== event.issueId), event.take]
          : state.issueTakes.filter((take) => take.issueId !== event.issueId),
      };
    case "report.changed":
      return { ...state, reportCheckpoint: event.checkpoint };
    case "notification.requested":
      return { ...state, notifications: [...state.notifications, event.notification] };
  }
}

function rowChanged(
  command: ProtocolCommand,
  before: LedgerRow | null,
  after: LedgerRow,
  reason: Extract<DomainEvent, { type: "row.changed" }>["reason"] = "command",
): DomainEvent {
  return {
    type: "row.changed",
    command: command.type,
    actor: command.actor,
    at: command.at,
    from: before?.state ?? null,
    to: after.state,
    rowId: after.id,
    rowKind: after.kind,
    before,
    after,
    reason,
  };
}

function revised<Row extends LedgerRow>(row: Row, at: string, fields: Readonly<Record<string, unknown>>): Row {
  const nextState = (fields.state ?? row.state) as Row["state"];
  return {
    ...row,
    ...fields,
    revision: row.revision + 1,
    updatedAt: at,
    stateChangedAt: nextState === row.state ? row.stateChangedAt : at,
  } as Row;
}

function completeIssueFacts(facts: IssueFacts): void {
  requireText(facts.proposition, "Issue proposition");
  requireText(facts.site, "Issue site");
  requireText(facts.trigger, "Issue trigger");
  requireText(facts.cause, "Issue cause");
  requireText(facts.scope, "Issue scope");
  requireText(facts.frequency, "Issue frequency");
  requireText(facts.impact, "Issue impact");
  if (facts.impactRank === undefined || facts.impactRank < 1 || facts.impactRank > 5) {
    reject("evidence", "Issue impact rank must be 1 (highest) through 5 (lowest)");
  }
  if ((facts.detector === undefined) !== (facts.detectorGap === undefined)) {
    reject("evidence", "Issue detector and detector gap must be recorded together");
  }
  if (facts.detector !== undefined) requireText(facts.detector, "Issue detector");
  if (facts.detectorGap !== undefined) requireText(facts.detectorGap, "Issue detector gap");
}

function initialIssueFacts(facts: IssueFacts): void {
  requireText(facts.proposition, "Issue proposition");
  requireText(facts.site, "Issue site");
}

function completeProposedFix(fix: ProposedFixShape, proposalKind: "proposal" | "direction" = "proposal"): void {
  requireText(fix.shape, proposalKind === "direction" ? "Direction summary" : "Proposed fix shape");
  requireText(fix.cost, proposalKind === "direction" ? "Direction cost" : "Proposed fix cost");
  if (proposalKind === "direction") return;
  requireText(fix.originClass ?? "", "Proposed fix origin class");
  requireText(fix.sitesWalked ?? "", "Proposed fix sites walked");
  requireText(fix.rulingsChecked ?? "", "Proposed fix rulings checked");
  requireText(fix.testLocation ?? "", "Proposed fix test location");
  if (normalizedAnswer(fix.testLocation ?? "") === "none" && fix.originClass !== "design-absence") {
    reject("evidence", "test location 'none' is only valid for a design-absence architecture proposal");
  }
  if (fix.originClass === "self-consistency") {
    requireText(fix.guardrail ?? "", "Self-consistency guardrail");
  }
  if (fix.coordination !== undefined) requireText(fix.coordination, "Proposed fix coordination");
}

function validateRunLogs(redRun: RunLog | null, greenRun: RunLog): void {
  if (redRun) requireText(redRun.path, "Shelved fix red run");
  requireText(greenRun.path, "Shelved fix green run");
  if (redRun && redRun.path.trim() === greenRun.path.trim()) {
    reject("evidence", "Shelved fix red and green runs must be different log files");
  }
}

function validateShelvedEvidence(
  state: ProtocolState,
  refs: readonly RevisionRef<ProposedFixId>[],
  redRun: RunLog | null,
  greenRun: RunLog,
): void {
  const noTestRefs = refs.filter((ref) =>
    normalizedAnswer(rowOfKind(state, ref.id, "Proposed fix").fix.testLocation ?? "") === "none"
  );
  const testableRefs = refs.filter((ref) => !noTestRefs.some((candidate) => candidate.id === ref.id));
  for (const ref of noTestRefs) {
    if (!allowsNoRedRun(state, [ref])) {
      reject("question", `${ref.id} needs a current answered no-red architecture Question`);
    }
  }
  if (testableRefs.length > 0 && redRun === null) {
    reject("evidence", "Every testable Proposed fix needs a failing red run");
  }
  if (testableRefs.length === 0 && redRun !== null) {
    reject("evidence", "An all-no-red Shelved fix cannot claim an aggregate red run");
  }
  validateRunLogs(redRun, greenRun);
}

function assertAuthor(row: { readonly author: Actor }, actor: Actor): void {
  if (row.author !== actor) reject("actor", `only ${row.author} may edit this row`);
}

function assertIndependent(row: { readonly author: Actor }, actor: Actor): asserts actor is Seat {
  if (!isSeat(actor)) reject("actor", "a reviewer must perform this action");
  if (row.author === actor) reject("self-mark", `${actor} cannot mark or review their own row`);
}

function assertIssueIndependent(row: IssueRow, actor: Actor): asserts actor is Seat {
  if (!isSeat(actor)) reject("actor", "a reviewer must perform this action");
  if (row.revisionAuthor === actor) {
    reject("self-mark", `${actor} cannot mark or dispute the Issue revision they wrote`);
  }
}

function assertIssueEditor(row: IssueRow, actor: Actor): asserts actor is Seat {
  if (!isSeat(actor) || row.revisionAuthor !== actor) {
    reject("actor", `only current Issue editor ${row.revisionAuthor} may perform this action`);
  }
}

function checkoutHeldBy(state: ProtocolState, actor: Seat): void {
  if (state.checkout?.holder !== actor) {
    reject("checkout", `checkout is not held by ${actor}`);
  }
}

function refsForIssues(state: ProtocolState, ids: readonly IssueId[]): RevisionRef<IssueId>[] {
  requireList(ids, "Proposed fix issues");
  const includesSubstantiveIssue = ids.some((id) => issueIsSubstantive(rowOfKind(state, id, "Issue")));
  return ids.map((id) => {
    const issue = rowOfKind(state, id, "Issue");
    if (issue.exit) reject("invalid-state", `${id} already has an exit`);
    if (issue.state !== "verified" && issue.state !== "assumed") {
      reject("invalid-state", `${id} must be verified or assumed before a Proposed fix`);
    }
    if (
      state.mode !== "single" &&
      !hasCurrentMark(issue) &&
      (issue.label !== "Hardening" && issue.label !== "Nit" || !includesSubstantiveIssue)
    ) {
      reject("invalid-state", `${id} needs the other reviewer's mark`);
    }
    if (hasOpenQuestion(state, id)) reject("question", `${id} is waiting for the user's answer`);
    return { id, revision: issue.revision };
  });
}

function requiresPriorMark(state: ProtocolState, issueIds: readonly IssueId[], fix: ProposedFixShape): boolean {
  const fastAttentionMiss =
    fix.originClass === "attention-miss" &&
    !fix.interfaceChange &&
    !fix.ownershipChange &&
    !fix.riskSurface &&
    !issueIds.some((id) => hasAnyQuestion(state, id));
  return state.mode !== "single" && (state.policy === "report-only" || !fastAttentionMiss);
}

function refsForProposedFixes(
  state: ProtocolState,
  ids: readonly ProposedFixId[],
): RevisionRef<ProposedFixId>[] {
  requireList(ids, "Shelved fix proposed fixes");
  const includesSubstantiveProposal = ids.some((id) =>
    proposedFixIsSubstantive(state, rowOfKind(state, id, "Proposed fix")),
  );
  const refs = ids.map((id) => {
    const proposed = rowOfKind(state, id, "Proposed fix");
    if (proposed.proposalKind === "direction") {
      reject("invalid-state", `${id} is a report direction and cannot be shelved`);
    }
    if (!refsCurrent(state, proposed.issueRefs, "Issue")) {
      reject("stale-reference", `${id} refers to an old Issue revision`);
    }
    for (const issueRef of proposed.issueRefs) {
      const issue = rowOfKind(state, issueRef.id, "Issue");
      if (issue.exit || (issue.state !== "verified" && issue.state !== "assumed")) {
        reject("invalid-state", `${issue.id} is no longer settled`);
      }
      if (
        state.mode !== "single" &&
        !hasCurrentMark(issue) &&
        (issue.label !== "Hardening" && issue.label !== "Nit" || !includesSubstantiveProposal)
      ) {
        reject("invalid-state", `${issue.id} needs the other reviewer's mark`);
      }
    }
    if (proposedFixHasOpenQuestion(state, proposed)) {
      reject("question", `${id} is waiting for a user answer`);
    }
    if (proposed.shapeEditCount >= 2 && !hasAnsweredShapeDecision(state, proposed)) {
      reject("question", `${id} needs a user answer after two shape edits`);
    }
    const ready = proposed.state === "marked" ||
      (proposed.state === "draft" && !proposed.priorMarkRequired);
    if (!ready) reject("invalid-state", `${id} is not ready to shelve`);
    if (shelvedFixesForProposedFix(state, id).length > 0) {
      reject("invalid-state", `${id} already has a Shelved fix`);
    }
    return { id, revision: proposed.revision };
  });
  if (!refs.some((ref) => proposedFixIsDirectlyShelvable(state, rowOfKind(state, ref.id, "Proposed fix")))) {
    reject("invalid-state", "A Shelved fix must include at least one Bug, Restructure, or telemetry-quality Issue");
  }
  return refs;
}

function refsForShelvedFixes(
  state: ProtocolState,
  ids: readonly ShelvedFixId[],
): RevisionRef<ShelvedFixId>[] {
  requireList(ids, "Check-in shelved fixes");
  return ids.map((id) => {
    const shelved = rowOfKind(state, id, "Shelved fix");
    const reviewed = shelved.state === "reviewed" && hasCurrentMark(shelved);
    if (!reviewed) {
      reject("invalid-state", `${id} must have a current independent review`);
    }
    if (!shelvedFixIsCurrent(state, shelved)) {
      reject("stale-reference", `${id} has a stale Proposed-fix or Issue reference, or an open Question`);
    }
    if (checkInsForShelvedFix(state, id).some((row) => row.state !== "dropped")) {
      reject("invalid-state", `${id} already belongs to a live Check-in`);
    }
    return { id, revision: shelved.revision };
  });
}

function importRows(state: ProtocolState, command: Extract<ProtocolCommand, { type: "cold.import" }>): DomainEvent[] {
  if (state.mode !== "joint") reject("invalid-state", "cold rows import only into a joint run");
  if (command.campaignId !== state.campaignId) reject("invalid-state", "cold pass belongs to another campaign");
  if (state.imports[command.actor]) reject("invalid-state", `${command.actor} already imported`);
  const seen = new Set<RowId>();
  const events: DomainEvent[] = [];
  for (const row of command.rows) {
    if (row.author !== command.actor) reject("actor", `${row.id} was not authored by ${command.actor}`);
    if (seen.has(row.id)) reject("duplicate-id", `cold import repeats ${row.id}`);
    seen.add(row.id);
    ensureUniqueId(state, row.id);
    if (row.marks.length > 0) reject("self-mark", `cold row ${row.id} cannot carry a mark`);
    if (row.kind === "Coverage" && row.state === "open") {
      reject("ready-work", `${row.id} is unfinished cold coverage`);
    }
    if (
      row.kind === "Issue" &&
      (row.label === "Bug" || row.label === "Restructure") &&
      row.state === "new"
    ) {
      reject("ready-work", `${row.id} is an unfinished cold Issue`);
    }
    events.push(rowChanged(command, null, row));
  }
  for (const declared of state.declaredCoverage) {
    const covered = command.rows.some((row) =>
      row.kind === "Coverage" &&
      row.author === command.actor &&
      row.coverageKind === declared.coverageKind &&
      coverageTargetMatches(declared.coverageKind, row.target, declared.target) &&
      row.state !== "open",
    );
    if (!covered) {
      reject("ready-work", `cold pass has no result for ${declared.coverageKind} '${declared.target}'`);
    }
  }
  events.push({
    type: "import.changed",
    command: command.type,
    actor: command.actor,
    at: command.at,
    from: "cold",
    to: "imported",
    seat: command.actor,
    imported: true,
  });
  return events;
}

function decideCommand(state: ProtocolState, command: ProtocolCommand): DomainEvent[] {
  requireTimestamp(command.at);
  if (
    state.mode === "joint" &&
    isSeat(command.actor) &&
    (!state.imports.A || !state.imports.B) &&
    command.type !== "cold.import"
  ) {
    reject("ready-work", "both cold passes must be imported before reviewer mutations");
  }
  if (state.mode === "cold" && command.actor !== state.coldSeat) {
    reject("actor", `only cold seat ${state.coldSeat ?? "unset"} may change this cold run`);
  }
  if (state.mode === "cold") {
    const coldCommands: readonly CommandType[] = [
      "coverage.add",
      "coverage.cover",
      "coverage.gap",
      "issue.add",
      "issue.edit",
      "issue.verify",
      "issue.assume",
      "issue.disprove",
      "issue.duplicate",
      "issue.accept",
    ];
    if (!coldCommands.includes(command.type)) {
      reject("policy", `${command.type} is not available during a cold pass`);
    }
  }
  if (
    state.mode === "single" &&
    command.actor === "B" &&
    command.type !== "shelved-fix.review"
  ) {
    reject("actor", "seat B exists only as the fresh Shelved-fix reviewer in a single-seat run");
  }
  const event = (before: LedgerRow | null, after: LedgerRow): DomainEvent =>
    rowChanged(command, before, after);

  switch (command.type) {
    case "issue.edit":
    case "issue.verify":
    case "issue.assume":
    case "issue.mark":
    case "issue.contest":
    case "issue.probe":
    case "issue.disprove":
    case "issue.duplicate":
    case "issue.accept":
    case "issue.exit":
      rejectOtherSeatIssueWork(state, command.id, command.actor);
      if (hasOpenQuestion(state, command.id)) {
        reject("question", `${command.id} is frozen while its Question is open`);
      }
      break;
    case "proposed-fix.edit": {
      const proposed = rowOfKind(state, command.id, "Proposed fix");
      rejectProposedWork(state, proposed, command.actor, true);
      if (proposedFixHasOpenQuestion(state, proposed)) {
        reject("question", `${command.id} is frozen while its Question is open`);
      }
      break;
    }
    case "proposed-fix.mark":
    case "proposed-fix.reject": {
      const proposed = rowOfKind(state, command.id, "Proposed fix");
      rejectProposedWork(state, proposed, command.actor, false);
      if (proposedFixHasOpenQuestion(state, proposed)) {
        reject("question", `${command.id} is frozen while its Question is open`);
      }
      break;
    }
    case "coverage.cover":
    case "coverage.gap": {
      const coverage = rowOfKind(state, command.id, "Coverage");
      if (state.checkout && state.checkout.holder !== command.actor && state.checkout.rowIds.includes(coverage.id)) {
        reject("checkout", `${coverage.id} is frozen by ${state.checkout.holder}'s checkout work`);
      }
      break;
    }
    case "shelved-fix.edit":
    case "shelved-fix.review": {
      const shelved = rowOfKind(state, command.id, "Shelved fix");
      if (shelvedFixHasOpenQuestion(state, shelved)) {
        reject("question", `${shelved.id} is frozen while its Question is open`);
      }
      if (command.type === "shelved-fix.review" && checkoutTouchesShelvedFix(state, shelved)) {
        reject("checkout", `release the overlapping checkout before reviewing ${shelved.id}`);
      }
      break;
    }
    default:
      break;
  }

  switch (command.type) {
    case "run.escalate": {
      if (state.mode !== "single" || state.deep) {
        reject("invalid-state", "only a quick or plain single-seat run may escalate to deep");
      }
      const declaredCoverage = [
        ...state.declaredCoverage,
        ...(command.declaredCoverage ?? []).filter((candidate) =>
          !state.declaredCoverage.some((existing) =>
            existing.coverageKind === candidate.coverageKind && existing.target === candidate.target,
          ),
        ),
      ];
      for (const declared of declaredCoverage) requireText(declared.target, "Declared coverage target");
      if (!hasRequiredCoverageDeclaration(state.route, true, declaredCoverage)) {
        reject(
          "evidence",
          state.route === "review"
            ? "deep review escalation needs a declared hunk or scenario"
            : "deep diagnosis escalation needs a declared symptom or cluster",
        );
      }
      return [{
        type: "run.changed",
        command: command.type,
        actor: command.actor,
        at: command.at,
        from: "quick",
        to: "deep",
        deep: true,
        declaredCoverage,
      }];
    }

    case "cold.import":
      return importRows(state, command);

    case "coverage.add": { // Each cold reviewer owns their coverage observations.
      ensureUniqueId(state, command.id);
      requireText(command.target, "Coverage target");
      if (command.issueId) rowOfKind(state, command.issueId, "Issue");
      const common: CoverageCommon = {
        id: command.id,
        kind: "Coverage",
        author: command.actor,
        revision: 0,
        createdAt: command.at,
        updatedAt: command.at,
        stateChangedAt: command.at,
        coverageKind: command.coverageKind,
        target: command.target,
        ...(command.issueId ? { issueId: command.issueId } : {}),
      };
      let row: CoverageRow;
      if (command.initial?.state === "covered") {
        requireText(command.initial.evidence, "Coverage evidence");
        row = { ...common, state: "covered", evidence: command.initial.evidence, marks: [] };
      } else if (command.initial?.state === "gap") {
        requireText(command.initial.reason, "Coverage gap reason");
        row = { ...common, state: "gap", reason: command.initial.reason, marks: [] };
      } else {
        row = { ...common, state: "open", marks: [] };
      }
      return [event(null, row)];
    }

    case "coverage.cover":
    case "coverage.gap": {
      const before = rowOfKind(state, command.id, "Coverage");
      assertAuthor(before, command.actor);
      expectRevision(before, command.expectedRevision);
      const after: CoverageRow = command.type === "coverage.cover"
        ? revised(before, command.at, { state: "covered", evidence: command.evidence, marks: [] }) as CoverageRow
        : revised(before, command.at, { state: "gap", reason: command.reason, marks: [] }) as CoverageRow;
      requireText(command.type === "coverage.cover" ? command.evidence : command.reason, "Coverage result");
      return [event(before, after)];
    }

    case "issue.add": {
      ensureUniqueId(state, command.id);
      initialIssueFacts(command.facts);
      for (const id of command.parentIssueIds ?? []) rowOfKind(state, id, "Issue");
      const common: IssueCommon = {
        id: command.id,
        kind: "Issue",
        author: command.actor,
        revisionAuthor: command.actor,
        revision: 0,
        createdAt: command.at,
        updatedAt: command.at,
        stateChangedAt: command.at,
        label: command.label,
        facts: command.facts,
        parentIssueIds: command.parentIssueIds ?? [],
        clusters: command.clusters ?? [],
        contestCount: 0,
        editCount: 0,
      };
      let row: IssueRow;
      if (command.initial?.state === "verified") {
        completeIssueFacts(command.facts);
        requireText(command.initial.evidence, "Issue verification evidence");
        row = {
          ...common,
          state: "verified",
          certainty: command.initial.certainty,
          evidence: command.initial.evidence,
          marks: [],
        };
      } else if (command.initial?.state === "assumed") {
        completeIssueFacts(command.facts);
        requireText(command.initial.assumption, "Issue assumption");
        requireText(command.initial.noProbeReason, "Reason no fifteen-minute probe exists");
        row = {
          ...common,
          state: "assumed",
          certainty: command.initial.certainty,
          assumption: command.initial.assumption,
          noProbeReason: command.initial.noProbeReason,
          marks: [],
        };
      } else if (command.initial?.state === "accepted") {
        if (command.label !== "Nit") reject("invalid-state", "Only a Nit may be accepted");
        requireText(command.initial.reason, "Accepted Nit reason");
        row = {
          ...common,
          label: "Nit",
          state: "accepted",
          certainty: command.certainty,
          reason: command.initial.reason,
          marks: [],
        };
      } else {
        row = { ...common, state: "new", certainty: command.certainty, marks: [] };
      }
      return [event(null, row)];
    }

    case "issue.edit": {
      const before = rowOfKind(state, command.id, "Issue");
      expectRevision(before, command.expectedRevision);
      if (before.exit) reject("invalid-state", `${before.id} already has an exit`);
      if (["disproved", "duplicate", "accepted"].includes(before.state)) {
        reject("invalid-state", `${before.id} is terminal in ${before.state}`);
      }
      if (before.state === "contested" && before.contestCount >= 2) {
        reject("invalid-state", `${before.id} must be settled by issue.probe`);
      }
      const facts = { ...before.facts, ...command.facts };
      const label = command.label ?? before.label;
      const downgradesSubstantive = issueIsSubstantive(before) &&
        label !== "Bug" && label !== "Restructure";
      const downgradesImpact =
        before.facts.impactRank !== undefined &&
        facts.impactRank !== undefined &&
        facts.impactRank > before.facts.impactRank;
      if (downgradesSubstantive || downgradesImpact) {
        requireText(command.labelChangeReason ?? "", "Issue severity downgrade reason");
      }
      if (command.labelChangeReason !== undefined) {
        requireText(command.labelChangeReason, "Issue label change reason");
      }
      const parentIssueIds = command.parentIssueIds ?? before.parentIssueIds;
      for (const id of parentIssueIds) {
        if (id === before.id) reject("invalid-state", "An Issue cannot be its own parent");
        rowOfKind(state, id, "Issue");
      }
      const common: IssueCommon = {
        id: before.id,
        kind: "Issue",
        author: before.author,
        revisionAuthor: command.actor,
        revision: before.revision + 1,
        createdAt: before.createdAt,
        updatedAt: command.at,
        stateChangedAt: before.state === "contested" ? command.at : before.stateChangedAt,
        label,
        ...(command.labelChangeReason !== undefined
          ? { labelChangeReason: command.labelChangeReason }
          : before.labelChangeReason !== undefined
            ? { labelChangeReason: before.labelChangeReason }
            : {}),
        facts,
        parentIssueIds,
        clusters: command.clusters ?? before.clusters,
        contestCount: before.contestCount,
        editCount: before.editCount + 1,
      };
      let after: IssueRow;
      if (before.state === "verified") {
        completeIssueFacts(facts);
        if (command.assumption !== undefined || command.noProbeReason !== undefined) {
          reject("invalid-state", "assumption fields apply only to an assumed Issue");
        }
        const certainty = command.certainty ?? before.certainty;
        if (certainty < 4) reject("evidence", "A verified Issue needs certainty step 4 or 5");
        const evidence = command.evidence ?? before.evidence;
        requireText(evidence, "Issue verification evidence");
        after = {
          ...common,
          state: "verified",
          certainty: certainty as VerifiedCertainty,
          evidence,
          marks: [],
        };
      } else if (before.state === "assumed") {
        completeIssueFacts(facts);
        if (command.evidence !== undefined) {
          reject("invalid-state", "evidence applies to issue.verify, issue.probe, or issue.disprove");
        }
        const assumption = command.assumption ?? before.assumption;
        const noProbeReason = command.noProbeReason ?? before.noProbeReason;
        requireText(assumption, "Issue assumption");
        requireText(noProbeReason, "Reason no fifteen-minute probe exists");
        after = {
          ...common,
          state: "assumed",
          certainty: command.certainty ?? before.certainty,
          assumption,
          noProbeReason,
          marks: [],
        };
      } else {
        if (command.evidence !== undefined || command.assumption !== undefined || command.noProbeReason !== undefined) {
          reject("invalid-state", "state-specific evidence requires verify or assume");
        }
        initialIssueFacts(facts);
        after = {
          ...common,
          state: "new",
          certainty: command.certainty ?? before.certainty,
          marks: [],
        };
      }
      return [event(before, after)];
    }

    case "issue.verify": {
      const before = rowOfKind(state, command.id, "Issue");
      assertIssueEditor(before, command.actor);
      expectRevision(before, command.expectedRevision);
      if (before.exit) reject("invalid-state", `${before.id} already has an exit`);
      if (!["new", "assumed", "contested"].includes(before.state)) {
        reject("invalid-state", `${before.id} cannot be verified from ${before.state}`);
      }
      if (before.state === "contested" && before.contestCount >= 2) {
        reject("invalid-state", `${before.id} must be settled by issue.probe`);
      }
      requireText(command.evidence, "Issue verification evidence");
      completeIssueFacts(before.facts);
      const after = revised(before, command.at, {
        state: "verified",
        revisionAuthor: command.actor,
        certainty: command.certainty,
        evidence: command.evidence,
        marks: [] as NoMark,
      }) as IssueRow;
      return [event(before, after)];
    }

    case "issue.assume": {
      const before = rowOfKind(state, command.id, "Issue");
      assertIssueEditor(before, command.actor);
      expectRevision(before, command.expectedRevision);
      if (before.exit || !["new", "contested"].includes(before.state)) {
        reject("invalid-state", `${before.id} cannot be assumed from ${before.state}`);
      }
      requireText(command.assumption, "Issue assumption");
      requireText(command.noProbeReason, "Reason no fifteen-minute probe exists");
      completeIssueFacts(before.facts);
      const after = revised(before, command.at, {
        state: "assumed",
        revisionAuthor: command.actor,
        certainty: command.certainty,
        assumption: command.assumption,
        noProbeReason: command.noProbeReason,
        marks: [] as NoMark,
      }) as IssueRow;
      return [event(before, after)];
    }

    case "issue.mark": {
      const before = rowOfKind(state, command.id, "Issue");
      expectRevision(before, command.expectedRevision);
      assertIssueIndependent(before, command.actor);
      if (before.exit) reject("invalid-state", `${before.id} already has an exit`);
      if (before.state !== "verified" && before.state !== "assumed") {
        reject("invalid-state", `${before.id} cannot be marked from ${before.state}`);
      }
      if (hasCurrentMark(before)) reject("invalid-state", `${before.id} already has a current mark`);
      const after = {
        ...before,
        marks: [{ reviewer: command.actor, revision: before.revision, at: command.at }],
        updatedAt: command.at,
      } as IssueRow;
      return [event(before, after)];
    }

    case "issue.contest": {
      const before = rowOfKind(state, command.id, "Issue");
      expectRevision(before, command.expectedRevision);
      assertIssueIndependent(before, command.actor);
      if (before.exit || (before.state !== "verified" && before.state !== "assumed")) {
        reject("invalid-state", `${before.id} cannot be contested from ${before.state}`);
      }
      if (hasCurrentMark(before)) reject("invalid-state", `${before.id} is already agreed at this revision`);
      requireText(command.probe, "Issue contest probe");
      const after = revised(before, command.at, {
        state: "contested",
        revisionAuthor: command.actor,
        probe: command.probe,
        contestedBy: command.actor,
        contestCount: before.contestCount + 1,
        marks: [] as NoMark,
      }) as IssueRow;
      return [event(before, after)];
    }

    case "issue.probe": {
      const before = rowOfKind(state, command.id, "Issue");
      expectRevision(before, command.expectedRevision);
      if (before.state !== "contested" || before.contestCount < 2) {
        reject("invalid-state", `${before.id} has not reached the required probe`);
      }
      if (before.contestedBy !== command.actor) reject("actor", `${before.contestedBy} owns this probe`);
      checkoutHeldBy(state, command.actor);
      if (!state.baseline) reject("checkout", "record the first-holder baseline before running the probe");
      requireText(command.evidence, "Issue probe evidence");
      const after: IssueRow = command.verdict === "verified"
        ? revised(before, command.at, {
            state: "verified",
            revisionAuthor: command.actor,
            certainty: command.certainty,
            evidence: command.evidence,
            marks: [] as NoMark,
          }) as IssueRow
        : revised(before, command.at, {
            state: "disproved",
            revisionAuthor: command.actor,
            certainty: command.certainty,
            evidence: command.evidence,
            marks: [] as NoMark,
          }) as IssueRow;
      return [event(before, after)];
    }

    case "issue.disprove": {
      const before = rowOfKind(state, command.id, "Issue");
      expectRevision(before, command.expectedRevision);
      if (state.mode !== "cold") assertIssueIndependent(before, command.actor);
      else assertIssueEditor(before, command.actor);
      if (before.exit || ["disproved", "duplicate", "accepted"].includes(before.state)) {
        reject("invalid-state", `${before.id} cannot be disproved from ${before.state}`);
      }
      if (command.certainty < 2) reject("evidence", "A disproved Issue needs certainty step 2 or better");
      requireText(command.evidence, "Issue disproof evidence");
      const after = revised(before, command.at, {
        state: "disproved",
        revisionAuthor: command.actor,
        certainty: command.certainty,
        evidence: command.evidence,
        marks: [] as NoMark,
      }) as IssueRow;
      return [event(before, after)];
    }

    case "issue.duplicate": {
      const before = rowOfKind(state, command.id, "Issue");
      expectRevision(before, command.expectedRevision);
      if (state.mode !== "cold") assertIssueIndependent(before, command.actor);
      else assertIssueEditor(before, command.actor);
      if (before.exit || ["disproved", "duplicate", "accepted"].includes(before.state)) {
        reject("invalid-state", `${before.id} cannot become duplicate from ${before.state}`);
      }
      const target = rowOfKind(state, command.duplicateOf, "Issue");
      if (before.id === target.id) reject("invalid-state", "An Issue cannot duplicate itself");
      if (target.state === "duplicate") reject("invalid-state", "A duplicate target cannot itself be duplicate");
      if (state.rows.some((row) => row.kind === "Issue" && row.state === "duplicate" && row.duplicateOf === before.id)) {
        reject("invalid-state", `${before.id} is already the target of a duplicate`);
      }
      const after = revised(before, command.at, {
        state: "duplicate",
        revisionAuthor: command.actor,
        duplicateOf: target.id,
        marks: [] as NoMark,
      }) as IssueRow;
      return [event(before, after)];
    }

    case "issue.accept": {
      const before = rowOfKind(state, command.id, "Issue");
      expectRevision(before, command.expectedRevision);
      assertIssueEditor(before, command.actor);
      if (before.label !== "Nit") reject("invalid-state", "Only a Nit may be accepted");
      if (before.exit || ["disproved", "duplicate", "accepted"].includes(before.state)) {
        reject("invalid-state", `${before.id} cannot be accepted from ${before.state}`);
      }
      requireText(command.reason, "Accepted Nit reason");
      const after = revised(before, command.at, {
        state: "accepted",
        revisionAuthor: command.actor,
        label: "Nit",
        reason: command.reason,
        marks: [] as NoMark,
      }) as IssueRow;
      return [event(before, after)];
    }

    case "issue.exit": {
      const before = rowOfKind(state, command.id, "Issue");
      expectRevision(before, command.expectedRevision);
      if (before.exit) reject("invalid-state", `${before.id} already has an exit`);
      if (command.exit.kind === "user-drop") {
        if (command.actor !== "master") reject("actor", "only the user through master may drop an Issue");
        requireText(command.exit.reason, "Issue drop reason");
      } else {
        if (command.actor !== before.revisionAuthor) {
          reject("actor", `only current Issue editor ${before.revisionAuthor} may record this exit`);
        }
        requireText(command.exit.reference, "Issue exit reference");
        if (command.exit.kind === "todo" && before.state !== "assumed") {
          reject("invalid-state", "A todo exit requires an assumed Issue with its no-probe reason");
        }
        if (command.exit.kind === "comment-or-assert" && before.state !== "disproved") {
          reject("invalid-state", "A comment-or-assert exit requires a disproved Issue");
        }
        if (command.exit.kind === "ruling-or-baseline") {
          const settled = before.state === "verified" || before.state === "assumed";
          const independentlyChecked = state.mode === "single" || hasCurrentMark(before) || hasAnsweredDecision(state, before.id);
          if (!settled || !independentlyChecked) {
            reject("invalid-state", "A ruling-or-baseline exit requires settled, independently checked evidence");
          }
        }
      }
      return [event(before, revised(before, command.at, {
        exit: command.exit,
        revisionAuthor: isSeat(command.actor) ? command.actor : before.revisionAuthor,
      }) as IssueRow)];
    }

    case "issue.take": {
      const issue = rowOfKind(state, command.id, "Issue");
      expectRevision(issue, command.expectedRevision);
      if (state.checkout && state.checkout.holder !== command.actor && checkoutTouchesIssue(state, issue.id)) {
        reject("checkout", `${issue.id} is frozen by ${state.checkout.holder}'s checkout work`);
      }
      if (issue.exit || (issue.state !== "verified" && issue.state !== "assumed")) {
        reject("invalid-state", `${issue.id} is not ready to take`);
      }
      const accompaniesSubstantiveTake = state.issueTakes.some((take) => {
        if (take.holder !== command.actor) return false;
        const takenIssue = rowOfKind(state, take.issueId, "Issue");
        return issueIsSubstantive(takenIssue);
      });
      if (
        state.mode !== "single" &&
        !hasCurrentMark(issue) &&
        (issue.label !== "Hardening" && issue.label !== "Nit" || !accompaniesSubstantiveTake)
      ) {
        reject("invalid-state", `${issue.id} needs the other reviewer's mark`);
      }
      if (hasOpenQuestion(state, issue.id)) reject("question", `${issue.id} is waiting for the user`);
      const proposed = proposedFixesForIssue(state, issue.id);
      const shelves = proposed.flatMap((row) => shelvedFixesForProposedFix(state, row.id));
      const correctionShelves = [...new Map(shelves.map((row) => [row.id, row])).values()];
      if (correctionShelves.some((row) =>
        row.author !== command.actor ||
        (row.state !== "conditions" && shelvedFixIsCurrent(state, row)) ||
        checkInsForShelvedFix(state, row.id).some((checkIn) => checkIn.state !== "dropped")
      )) {
        reject("invalid-state", `${issue.id} already has a Shelved fix that is not owned correction work`);
      }
      const siblingIssueIds = proposed.flatMap((row) => row.issueRefs.map((ref) => ref.id));
      const otherHolder = siblingIssueIds
        .map((id) => issueTake(state, id))
        .find((take) => take && take.holder !== command.actor);
      if (otherHolder) {
        reject("invalid-state", `${otherHolder.issueId} in the same Proposed fix is taken by ${otherHolder.holder}`);
      }
      const existing = issueTake(state, issue.id);
      if (existing) reject("invalid-state", `${issue.id} is taken by ${existing.holder}`);
      const take: IssueTake = {
        issueId: issue.id,
        issueRevision: issue.revision,
        holder: command.actor,
        takenAt: command.at,
      };
      return [{
        type: "issue-take.changed",
        command: command.type,
        actor: command.actor,
        at: command.at,
        from: "free",
        to: "taken",
        issueId: issue.id,
        take,
      }];
    }

    case "issue.release": {
      const issue = rowOfKind(state, command.id, "Issue");
      expectRevision(issue, command.expectedRevision);
      const take = issueTake(state, command.id);
      if (!take) reject("invalid-state", `${command.id} is not taken`);
      if (take.holder !== command.actor) reject("actor", `${command.id} is taken by ${take.holder}`);
      return [{
        type: "issue-take.changed",
        command: command.type,
        actor: command.actor,
        at: command.at,
        from: "taken",
        to: "free",
        issueId: command.id,
        take: null,
      }];
    }

    case "question.add": {
      ensureUniqueId(state, command.id);
      requireList(command.issueIds, "Question issues");
      const questionIssueRefs: RevisionRef<IssueId>[] = [];
      let conditionsShelf: ShelvedFixRow | undefined;
      if (command.shelvedFixRef) {
        if (command.purpose !== "decision") {
          reject("question", "Only a decision Question may be linked to review conditions");
        }
        conditionsShelf = rowOfKind(state, command.shelvedFixRef.id, "Shelved fix");
        expectRevision(conditionsShelf, command.shelvedFixRef.revision);
        if (conditionsShelf.author !== command.actor || conditionsShelf.state !== "conditions") {
          reject("question", "A review-conditions Question must name the author's current conditions shelf");
        }
        if (!shelvedFixIsCurrent(state, conditionsShelf)) {
          reject("stale-reference", `${conditionsShelf.id} has stale upstream revisions`);
        }
      }
      for (const id of command.issueIds) {
        if (state.checkout && checkoutTouchesIssue(state, id)) {
          reject("checkout", `release checkout before asking a Question about ${id}`);
        }
        rejectOtherSeatIssueWork(state, id, command.actor);
        const issue = rowOfKind(state, id, "Issue");
        if (issue.exit) reject("invalid-state", `${id} already has an exit`);
        if (issue.state !== "verified" && issue.state !== "assumed") {
          reject("invalid-state", `${id} must be verified or assumed before asking a Question`);
        }
        if (hasOpenQuestion(state, id)) reject("question", `${id} already has an open Question`);
        const hasShelf = proposedFixesForIssue(state, id).some(
          (proposed) => shelvedFixesForProposedFix(state, proposed.id).length > 0,
        );
        const conditionsShelfContainsIssue = conditionsShelf !== undefined &&
          issueIdsForProposedFixRefs(state, conditionsShelf.proposedFixRefs).includes(id);
        if (hasShelf && !conditionsShelfContainsIssue) {
          reject("question", `${id} already has a Shelved fix; only current review conditions may ask late`);
        }
        questionIssueRefs.push({ id, revision: issue.revision });
      }
      if (command.purpose === "no-red" && !command.proposedFixRef) {
        reject("question", "A no-red Question must name the current Proposed fix revision");
      }
      if (command.proposedFixRef && command.shelvedFixRef) {
        reject("question", "A Question links either a Proposed fix or a Shelved fix, not both");
      }
      if (command.proposedFixRef) {
        const proposed = rowOfKind(state, command.proposedFixRef.id, "Proposed fix");
        expectRevision(proposed, command.proposedFixRef.revision);
        if (proposed.author !== command.actor) {
          reject("question", "A Proposed-fix Question must be asked by its author");
        }
        if (
          command.purpose === "decision" &&
          !((proposed.state === "rejected" || proposed.state === "draft") && proposed.shapeEditCount >= 2)
        ) {
          reject("question", "A shape Question must name the current twice-disputed Proposed fix");
        }
        if (command.purpose === "no-red" && proposed.state !== "draft" && proposed.state !== "marked") {
          reject("question", "A no-red Question must name a current unrejected Proposed fix");
        }
        if (!proposed.issueRefs.every((ref) => command.issueIds.includes(ref.id))) {
          reject("question", "A shape Question must link every Issue in its Proposed fix");
        }
      }
      if (conditionsShelf) {
        const shelfIssueIds = issueIdsForProposedFixRefs(state, conditionsShelf.proposedFixRefs);
        if (!shelfIssueIds.every((id) => command.issueIds.includes(id))) {
          reject("question", "A review-conditions Question must link every Issue in its Shelved fix");
        }
      }
      requireText(command.question, "Question");
      requireQuestionOptions(command.options, command.recommendation);
      if (command.purpose === "no-red" && !command.options.some((option) => normalizedAnswer(option) === ALLOW_NO_RED_ANSWER)) {
        reject("question", `A no-red Question must offer the exact answer '${ALLOW_NO_RED_ANSWER}'`);
      }
      requireText(command.userEffect, "Question user effect");
      requireText(command.codeCost, "Question code cost");
      const row: QuestionRow = {
        id: command.id,
        kind: "Question",
        author: command.actor,
        revision: 0,
        createdAt: command.at,
        updatedAt: command.at,
        stateChangedAt: command.at,
        issueIds: command.issueIds,
        issueRefs: questionIssueRefs,
        purpose: command.purpose,
        ...(command.proposedFixRef ? { proposedFixRef: command.proposedFixRef } : {}),
        ...(command.shelvedFixRef ? { shelvedFixRef: command.shelvedFixRef } : {}),
        question: command.question,
        options: command.options,
        recommendation: command.recommendation,
        userEffect: command.userEffect,
        codeCost: command.codeCost,
        state: "open",
        marks: [],
      };
      return [event(null, row)];
    }

    case "question.answer": {
      const before = rowOfKind(state, command.id, "Question");
      expectRevision(before, command.expectedRevision);
      if (before.state !== "open") reject("invalid-state", `${before.id} is already answered`);
      if (!refsCurrent(state, before.issueRefs, "Issue")) {
        reject("stale-reference", `${before.id} refers to an old Issue revision`);
      }
      if (before.proposedFixRef && !refsCurrent(state, [before.proposedFixRef], "Proposed fix")) {
        reject("stale-reference", `${before.id} refers to an old Proposed-fix revision`);
      }
      if (before.shelvedFixRef && !refsCurrent(state, [before.shelvedFixRef], "Shelved fix")) {
        reject("stale-reference", `${before.id} refers to an old Shelved-fix revision`);
      }
      requireText(command.answer, "Question answer");
      const answer = selectedQuestionOption(before.options, command.answer);
      if (answer === undefined) {
        reject("question", "Question answer must map to an offered option");
      }
      const after = revised(before, command.at, {
        state: "answered",
        answer,
        answeredAt: command.at,
      }) as QuestionRow;
      return [event(before, after)];
    }

    case "proposed-fix.add": {
      ensureUniqueId(state, command.id);
      const proposalKind = command.proposalKind ?? "proposal";
      completeProposedFix(command.fix, proposalKind);
      for (const issueId of command.issueIds) {
        const take = issueTake(state, issueId);
        if (take?.holder !== command.actor) reject("actor", `${command.actor} must take ${issueId} first`);
        const issue = rowOfKind(state, issueId, "Issue");
        if (take.issueRevision !== issue.revision) reject("revision", `${issueId} take is stale`);
      }
      if (
        proposalKind === "proposal" &&
        command.fix.originClass === "design-absence" &&
        !command.issueIds.some((issueId) => issueOrAncestorHasLabel(state, issueId, "Restructure"))
      ) {
        reject("invalid-state", "A design-absence proposal must link a Restructure Issue");
      }
      const row: ProposedFixRow = {
        id: command.id,
        kind: "Proposed fix",
        author: command.actor,
        proposalKind,
        revision: 0,
        createdAt: command.at,
        updatedAt: command.at,
        stateChangedAt: command.at,
        issueRefs: refsForIssues(state, command.issueIds),
        fix: command.fix,
        priorMarkRequired: requiresPriorMark(state, command.issueIds, command.fix),
        shapeEditCount: 0,
        state: "draft",
        marks: [],
      };
      return [event(null, row)];
    }

    case "proposed-fix.edit": {
      const before = rowOfKind(state, command.id, "Proposed fix");
      assertAuthor(before, command.actor);
      expectRevision(before, command.expectedRevision);
      const answeredDecision = hasAnsweredShapeDecision(state, before);
      if (before.shapeEditCount >= 2 && !answeredDecision) {
        reject("question", `${before.id} reached two shape edits; ask the user`);
      }
      completeProposedFix(command.fix, before.proposalKind);
      const currentRefs = refsForIssues(state, before.issueRefs.map((ref) => ref.id));
      if (
        before.proposalKind === "proposal" &&
        command.fix.originClass === "design-absence" &&
        !before.issueRefs.some((ref) => issueOrAncestorHasLabel(state, ref.id, "Restructure"))
      ) {
        reject("invalid-state", "A design-absence proposal must link a Restructure Issue");
      }
      const after = revised(before, command.at, {
        state: "draft",
        fix: command.fix,
        issueRefs: currentRefs,
        priorMarkRequired: requiresPriorMark(state, before.issueRefs.map((ref) => ref.id), command.fix),
        shapeEditCount: answeredDecision ? 0 : before.shapeEditCount,
        marks: [] as NoMark,
      }) as ProposedFixRow;
      return [event(before, after)];
    }

    case "proposed-fix.mark": {
      const before = rowOfKind(state, command.id, "Proposed fix");
      expectRevision(before, command.expectedRevision);
      assertIndependent(before, command.actor);
      if (before.state !== "draft") reject("invalid-state", `${before.id} cannot be marked from ${before.state}`);
      if (!refsCurrent(state, before.issueRefs, "Issue")) {
        reject("stale-reference", `${before.id} refers to an old Issue revision`);
      }
      refsForIssues(state, before.issueRefs.map((ref) => ref.id));
      if (before.shapeEditCount >= 2 && !hasAnsweredShapeDecision(state, before)) {
        reject("question", `${before.id} needs a user answer after two shape edits`);
      }
      completeProposedFix(before.fix, before.proposalKind);
      const after = revised(before, command.at, {
        state: "marked",
        marks: [{ reviewer: command.actor, revision: before.revision + 1, at: command.at }] as OneMark,
      }) as ProposedFixRow;
      return [event(before, after)];
    }

    case "proposed-fix.reject": {
      const before = rowOfKind(state, command.id, "Proposed fix");
      expectRevision(before, command.expectedRevision);
      assertIndependent(before, command.actor);
      if (before.state !== "draft") reject("invalid-state", `${before.id} cannot be rejected from ${before.state}`);
      if (!refsCurrent(state, before.issueRefs, "Issue")) {
        reject("stale-reference", `${before.id} refers to an old Issue revision`);
      }
      completeProposedFix(before.fix, before.proposalKind);
      requireText(command.reason, "Proposed fix rejection reason");
      const after = revised(before, command.at, {
        state: "rejected",
        reason: command.reason,
        shapeEditCount: before.shapeEditCount + 1,
        marks: [] as NoMark,
      }) as ProposedFixRow;
      return [event(before, after)];
    }

    case "shelved-fix.add": {
      if (state.policy === "report-only") reject("policy", "report-only runs do not create Shelved fixes");
      ensureUniqueId(state, command.id);
      checkoutHeldBy(state, command.actor);
      if (!state.baseline) reject("checkout", "record the first-holder baseline before shelving a fix");
      requireText(command.artifact, "Shelved fix artifact");
      const proposedFixRefs = refsForProposedFixes(state, command.proposedFixIds);
      for (const issueId of issueIdsForProposedFixRefs(state, proposedFixRefs)) {
        const take = issueTake(state, issueId);
        if (take?.holder !== command.actor) reject("actor", `${command.actor} must take ${issueId} first`);
        const issue = rowOfKind(state, issueId, "Issue");
        if (take.issueRevision !== issue.revision) reject("revision", `${issueId} take is stale`);
      }
      validateShelvedEvidence(state, proposedFixRefs, command.redRun, command.greenRun);
      const row: ShelvedFixRow = {
        id: command.id,
        kind: "Shelved fix",
        author: command.actor,
        revision: 0,
        createdAt: command.at,
        updatedAt: command.at,
        stateChangedAt: command.at,
        proposedFixRefs,
        artifact: command.artifact,
        redRun: command.redRun,
        greenRun: command.greenRun,
        state: "shelved",
        marks: [],
      };
      return [event(null, row)];
    }

    case "shelved-fix.edit": {
      const before = rowOfKind(state, command.id, "Shelved fix");
      assertAuthor(before, command.actor);
      expectRevision(before, command.expectedRevision);
      checkoutHeldBy(state, command.actor);
      if (!state.baseline) reject("checkout", "record the first-holder baseline before updating a shelve");
      if (checkInsForShelvedFix(state, before.id).some((row) => row.state !== "dropped")) {
        reject("invalid-state", `${before.id} belongs to an active Check-in`);
      }
      for (const issueId of issueIdsForShelvedFix(state, before)) {
        const issue = rowOfKind(state, issueId, "Issue");
        const take = issueTake(state, issueId);
        if (take?.holder !== command.actor || take.issueRevision !== issue.revision) {
          reject("actor", `${command.actor} must hold a current take for ${issueId}`);
        }
      }
      requireText(command.artifact, "Shelved fix artifact");
      const proposedFixRefs = before.proposedFixRefs.map((ref) => {
        const proposed = rowOfKind(state, ref.id, "Proposed fix");
        if (!refsCurrent(state, proposed.issueRefs, "Issue")) {
          reject("stale-reference", `${proposed.id} refers to an old Issue revision`);
        }
        const ready = proposed.state === "marked" ||
          (proposed.state === "draft" && !proposed.priorMarkRequired);
        if (!ready) reject("invalid-state", `${proposed.id} is not ready for a Shelved fix`);
        if (proposedFixHasOpenQuestion(state, proposed)) {
          reject("question", `${proposed.id} is waiting for a user answer`);
        }
        return { id: proposed.id, revision: proposed.revision };
      });
      validateShelvedEvidence(state, proposedFixRefs, command.redRun, command.greenRun);
      const after = revised(before, command.at, {
        state: "shelved",
        proposedFixRefs,
        artifact: command.artifact,
        redRun: command.redRun,
        greenRun: command.greenRun,
        marks: [] as NoMark,
      }) as ShelvedFixRow;
      return [event(before, after)];
    }

    case "shelved-fix.review": {
      const before = rowOfKind(state, command.id, "Shelved fix");
      expectRevision(before, command.expectedRevision);
      assertIndependent(before, command.actor);
      if (!shelvedFixIsDirectlyReviewable(state, before)) {
        reject("invalid-state", `${before.id} has no Bug, Restructure, or telemetry-quality Issue to review`);
      }
      if (before.state !== "shelved") reject("invalid-state", `${before.id} cannot be reviewed from ${before.state}`);
      if (!shelvedFixIsCurrent(state, before)) {
        reject("stale-reference", `${before.id} has a stale Proposed-fix or Issue reference, or an open Question`);
      }
      if (command.verdict === "conditions") requireText(command.conditions ?? "", "Shelved fix conditions");
      const after: ShelvedFixRow = command.verdict === "reviewed"
        ? revised(before, command.at, {
            state: "reviewed",
            marks: [{ reviewer: command.actor, revision: before.revision + 1, at: command.at }] as OneMark,
          }) as ShelvedFixRow
        : revised(before, command.at, {
            state: "conditions",
            conditions: command.conditions ?? "",
            marks: [] as NoMark,
          }) as ShelvedFixRow;
      return [event(before, after)];
    }

    case "check-in.approve": {
      if (state.policy === "report-only") reject("policy", "report-only runs cannot check in fixes");
      if (!state.reportCheckpoint) reject("invalid-state", "record the final report before approving a Check-in");
      if (state.mode === "single" && command.executor === "B") {
        reject("actor", "seat B is only the fresh diff reviewer and cannot execute a single-seat Check-in");
      }
      requireSha256(command.notesHash, "Check-in notes hash");
      if (command.notesHash !== state.reportCheckpoint.notesHash) {
        reject("stale-reference", "reviewer notes changed after the report was recorded");
      }
      ensureUniqueId(state, command.id);
      requireText(command.approval, "User approval");
      const shelvedFixRefs = refsForShelvedFixes(state, command.shelvedFixIds);
      const linkedIssueIds = issueIdsForProposedFixRefs(
        state,
        shelvedFixRefs.flatMap((ref) => rowOfKind(state, ref.id, "Shelved fix").proposedFixRefs),
      );
      const heldIssue = linkedIssueIds.find((id) => issueTake(state, id));
      if (heldIssue) reject("invalid-state", `release ${heldIssue} before approving its Check-in`);
      const row: CheckInRow = {
        id: command.id,
        kind: "Check-in",
        author: "master",
        revision: 0,
        createdAt: command.at,
        updatedAt: command.at,
        stateChangedAt: command.at,
        shelvedFixRefs,
        executor: command.executor,
        approval: command.approval,
        state: "approved",
        marks: [],
      };
      return [event(null, row)];
    }

    case "check-in.record": {
      const before = rowOfKind(state, command.id, "Check-in");
      expectRevision(before, command.expectedRevision);
      if (before.state !== "approved") reject("invalid-state", `${before.id} is not approved`);
      if (command.actor !== before.executor) reject("actor", `${before.executor} must perform this Check-in`);
      if (!refsCurrent(state, before.shelvedFixRefs, "Shelved fix")) {
        reject("stale-reference", `${before.id} refers to an old Shelved fix revision`);
      }
      requireText(command.changeset, "Check-in changeset");
      requireText(command.departures, "Check-in departures (use 'none' when there are none)");
      const after = revised(before, command.at, {
        state: "checked in",
        changeset: command.changeset,
        departures: command.departures,
      }) as CheckInRow;
      return [event(before, after)];
    }

    case "check-in.drop": {
      const before = rowOfKind(state, command.id, "Check-in");
      expectRevision(before, command.expectedRevision);
      if (before.state !== "approved") reject("invalid-state", `${before.id} is not approved`);
      requireText(command.reason, "Check-in drop reason");
      return [event(before, revised(before, command.at, {
        state: "dropped",
        reason: command.reason,
      }) as CheckInRow)];
    }

    case "checkout.take": {
      if (state.checkout) reject("checkout", `checkout is held by ${state.checkout.holder}`);
      requireText(command.purpose, "Checkout purpose");
      requireList(command.rowIds, "Checkout rows");
      if (new Set(command.rowIds).size !== command.rowIds.length) {
        reject("checkout", "Checkout rows must be distinct");
      }
      for (const id of command.rowIds) {
        const row = rowById(state, id);
        if (!checkoutTargetEligible(state, row, command.actor, command.rowIds)) {
          reject("checkout", `${id} is not ready checkout work for ${command.actor}`);
        }
      }
      const checkout: CheckoutHold = {
        holder: command.actor,
        purpose: command.purpose,
        rowIds: command.rowIds,
        targets: command.rowIds.map((id): CheckoutTarget => {
          const row = rowById(state, id);
          const current = row.kind === "Proposed fix"
            ? proposedFixIsCurrent(state, row)
            : row.kind === "Shelved fix"
              ? shelvedFixIsCurrent(state, row)
              : true;
          return { id, revision: row.revision, state: row.state, current };
        }),
        takenAt: command.at,
      };
      return [{
        type: "checkout.changed",
        command: command.type,
        actor: command.actor,
        at: command.at,
        from: "free",
        to: "held",
        checkout,
        baseline: state.baseline,
      }];
    }

    case "checkout.baseline": {
      checkoutHeldBy(state, command.actor);
      if (state.baseline) reject("invalid-state", "the checkout baseline is already recorded");
      requireText(command.buildLog, "Checkout baseline build log");
      requireText(command.testLog, "Checkout baseline test log");
      const baseline: Baseline = {
        recordedBy: command.actor,
        buildLog: command.buildLog,
        testLog: command.testLog,
        recordedAt: command.at,
      };
      return [{
        type: "checkout.changed",
        command: command.type,
        actor: command.actor,
        at: command.at,
        from: "held",
        to: "held",
        checkout: state.checkout,
        baseline,
      }];
    }

    case "checkout.release": {
      const hold = state.checkout;
      if (!hold) reject("checkout", "checkout is not held");
      const forced = command.actor === "master";
      if (command.actor !== hold.holder) {
        if (!forced) reject("actor", `checkout is held by ${hold.holder}`);
        requireText(command.reason ?? "", "Forced checkout release reason");
      }
      if (!forced) {
        if (!command.probesRemoved) reject("checkout", "remove every probe before releasing checkout");
        if (!command.shelvesRecorded) reject("checkout", "record every shelve before releasing checkout");
        if (!state.baseline) reject("checkout", "record the first-holder baseline before releasing checkout");
        if (!checkoutWorkRecorded(state, hold)) {
          reject("checkout", "record the checkout's probe or Shelved fix before releasing checkout");
        }
      }
      return [{
        type: "checkout.changed",
        command: command.type,
        actor: command.actor,
        at: command.at,
        from: "held",
        to: "free",
        checkout: null,
        baseline: state.baseline,
        release: forced
          ? { forced: true, reason: command.reason ?? "" }
          : { forced: false },
      }];
    }

    case "report.record": {
      if (state.mode === "cold") reject("invalid-state", "cold passes import instead of reporting");
      if (state.mode === "joint" && command.actor !== "master") {
        reject("actor", "the master records a joint report");
      }
      if (state.mode === "single" && command.actor !== "A") {
        reject("actor", "seat A records a single-seat report");
      }
      if (state.checkout || state.issueTakes.length > 0) {
        reject("ready-work", "release checkout and every Issue take before recording the report");
      }
      if (state.mode === "joint") {
        if (!state.imports.A || !state.imports.B || !state.handoffs.A || !state.handoffs.B) {
          reject("ready-work", "both imported reviewers must hand off before recording the report");
        }
      }
      const unfinishedReviewerWork = [...readyWork(state, "A"), ...readyWork(state, "B")]
        .filter((item) => item.command !== "report.record");
      if (unfinishedReviewerWork.length > 0) {
        reject("ready-work", "reviewer ready work remains before the report");
      }
      requireSha256(command.notesHash, "Report notes hash");
      if (state.reportCheckpoint?.notesHash === command.notesHash) {
        reject("invalid-state", "the report is already recorded with this notes hash");
      }
      const checkpoint: ReportCheckpoint = {
        recordedBy: command.actor,
        recordedAt: command.at,
        notesHash: command.notesHash,
      };
      return [{
        type: "report.changed",
        command: command.type,
        actor: command.actor,
        at: command.at,
        from: state.reportCheckpoint ? "reported" : "unreported",
        to: "reported",
        checkpoint,
      }];
    }

    case "handoff": {
      if (state.mode !== "joint") reject("invalid-state", `${state.mode} runs report or import instead of handing off`);
      if (!state.imports.A || !state.imports.B) {
        reject("ready-work", "both cold passes must be imported before handoff");
      }
      if (state.handoffs[command.actor]) reject("invalid-state", `${command.actor} already handed off`);
      if (state.checkout?.holder === command.actor) {
        reject("checkout", `${command.actor} must release checkout before handoff`);
      }
      if (state.issueTakes.some((take) => take.holder === command.actor)) {
        reject("ready-work", `${command.actor} must release every Issue take before handoff`);
      }
      if (readyWork(state, command.actor).length > 0) {
        reject("ready-work", `${command.actor} still has ready work`);
      }
      const handoff: Handoff = { seat: command.actor, at: command.at };
      return [{
        type: "handoff.changed",
        command: command.type,
        actor: command.actor,
        at: command.at,
        from: state.handoffs[command.actor] ? "handed-off" : "working",
        to: "handed-off",
        seat: command.actor,
        handoff,
      }];
    }
  }
}

function invalidationEvents(
  beforeState: ProtocolState,
  currentState: ProtocolState,
  command: ProtocolCommand,
  primaryEvents: readonly DomainEvent[],
): DomainEvent[] {
  const events: DomainEvent[] = [];
  const changedRows = primaryEvents.filter(
    (event): event is Extract<DomainEvent, { type: "row.changed" }> => event.type === "row.changed",
  );
  const editedIssues = changedRows.filter((event) =>
    event.rowKind === "Issue" && event.before !== null && event.after.revision !== event.before.revision,
  );
  const editedProposed = changedRows.filter((event) =>
    event.rowKind === "Proposed fix" && event.before !== null && event.after.revision !== event.before.revision,
  );

  let working = currentState;
  const emit = (
    before: LedgerRow,
    after: LedgerRow,
    reason: Extract<DomainEvent, { type: "row.changed" }>["reason"] = "revision-invalidation",
  ): void => {
    const next = rowChanged(command, before, after, reason);
    events.push(next);
    working = applyEvent(working, next);
  };

  for (const changed of editedIssues) {
    const issueId = changed.rowId as IssueId;
    const take = issueTake(working, issueId);
    if (take) {
      const released: DomainEvent = {
        type: "issue-take.changed",
        command: command.type,
        actor: command.actor,
        at: command.at,
        from: "taken",
        to: "free",
        issueId,
        take: null,
      };
      events.push(released);
      working = applyEvent(working, released);
    }
    for (const proposed of proposedFixesForIssue(working, issueId)) {
      const cleared = proposed.state === "marked"
        ? revised(proposed, command.at, { state: "draft", marks: [] as NoMark }) as ProposedFixRow
        : ({ ...proposed, marks: [] as NoMark, updatedAt: command.at } as ProposedFixRow);
      if (proposed.state === "marked" || proposed.marks.length > 0) emit(proposed, cleared);
      for (const shelved of shelvedFixesForProposedFix(working, proposed.id)) {
        if (shelved.state === "reviewed" || shelved.marks.length > 0) {
          emit(shelved, revised(shelved, command.at, {
            state: "shelved",
            marks: [] as NoMark,
          }) as ShelvedFixRow);
        }
      }
    }
  }

  for (const changed of editedProposed) {
    const id = changed.rowId as ProposedFixId;
    for (const shelved of shelvedFixesForProposedFix(working, id)) {
      if (shelved.state === "reviewed" || shelved.marks.length > 0) {
        emit(shelved, revised(shelved, command.at, {
          state: "shelved",
          marks: [] as NoMark,
        }) as ShelvedFixRow);
      }
    }
  }

  // Any upstream revision change makes a pending user approval stale. Preserve
  // the history by dropping, rather than silently retaining, the Check-in row.
  for (const checkIn of working.rows.filter(
    (row): row is CheckInRow => row.kind === "Check-in" && row.state === "approved",
  )) {
    const current = checkIn.shelvedFixRefs.every((ref) => {
      const shelved = working.rows.find(
        (row): row is ShelvedFixRow => row.kind === "Shelved fix" && row.id === ref.id,
      );
      return shelved !== undefined &&
        shelved.revision === ref.revision &&
        shelved.state === "reviewed" &&
        hasCurrentMark(shelved) &&
        shelvedFixIsCurrent(working, shelved);
    });
    if (!current) {
      emit(checkIn, revised(checkIn, command.at, {
        state: "dropped",
        reason: "upstream Issue, Proposed fix, or Shelved fix changed after approval",
        marks: [] as NoMark,
      }) as CheckInRow);
    }
  }

  // An Issue content edit clears its own agreement without reopening its verdict.
  for (const changed of editedIssues) {
    const current = rowOfKind(working, changed.rowId, "Issue");
    if (current.marks.length > 0) {
      emit(current, { ...current, marks: [], updatedAt: command.at } as IssueRow);
    }
  }

  // Recording a Check-in gives every linked Issue its check-in exit in the same touch.
  const checkedIn = changedRows.find(
    (event) => event.rowKind === "Check-in" && event.to === "checked in",
  );
  if (checkedIn) {
    const checkIn = checkedIn.after as CheckInRow;
    for (const shelvedRef of checkIn.shelvedFixRefs) {
      const shelved = rowOfKind(working, shelvedRef.id, "Shelved fix");
      for (const proposedRef of shelved.proposedFixRefs) {
        const proposed = rowOfKind(working, proposedRef.id, "Proposed fix");
        for (const issueRef of proposed.issueRefs) {
          const issue = rowOfKind(working, issueRef.id, "Issue");
          if (!issue.exit) {
            emit(issue, {
              ...issue,
              exit: { kind: "check-in", checkInId: checkIn.id },
              updatedAt: command.at,
            } as IssueRow, "check-in");
          }
        }
      }
    }
  }

  void beforeState;
  return events;
}

function addReady(
  work: ReadyWork[],
  actor: Actor,
  command: CommandType,
  reason: string,
  rowId?: RowId,
): void {
  work.push(rowId ? { actor, command, rowId, reason } : { actor, command, reason });
}

/** Parse public cluster lists without treating `(N/N)` progress annotations as clusters. */
export function parseClusterTokens(value: string): readonly string[] {
  const withoutProgress = value.replace(/\(\d+\/\d+\)(?=[\s,]|$)/g, " ");
  return [...new Set(withoutProgress.split(/[\s,]+/).map((token) => token.trim()).filter(Boolean))];
}

function coverageTargetMatches(
  kind: CoverageCommon["coverageKind"],
  observed: string,
  declared: string,
): boolean {
  if (kind !== "cluster") return observed === declared;
  const observedTokens = new Set(parseClusterTokens(observed));
  const declaredTokens = parseClusterTokens(declared);
  return declaredTokens.length > 0 && declaredTokens.every((token) => observedTokens.has(token));
}

/** Compare declared coverage as exact kind and target tokens, never substrings. */
export function coverageResults(state: ProtocolState): readonly CoverageResult[] {
  return state.declaredCoverage.map((declared) => {
    const observations = state.rows.filter((row): row is CoverageRow =>
      row.kind === "Coverage" &&
      row.coverageKind === declared.coverageKind &&
      coverageTargetMatches(declared.coverageKind, row.target, declared.target),
    );
    const explainedByIssue = state.mode !== "cold" && declared.coverageKind === "cluster" && state.rows.some((row) =>
      row.kind === "Issue" &&
      (row.state === "verified" || row.state === "assumed") &&
      row.clusters.some((cluster) => coverageTargetMatches("cluster", cluster, declared.target)),
    );
    const result: CoverageState = observations.some((row) => row.state === "gap")
      ? "gap"
      : explainedByIssue || observations.some((row) => row.state === "covered")
        ? "covered"
        : "open";
    return { ...declared, state: result };
  });
}

export function readyWork(state: ProtocolState, actor: Actor): readonly ReadyWork[] {
  const work: ReadyWork[] = [];
  if (state.mode === "cold" && actor !== state.coldSeat) return work;
  if (actor === "master") {
    for (const row of state.rows) {
      if (row.kind === "Question" && row.state === "open") {
        addReady(work, actor, "question.answer", "The user must answer this Question", row.id);
      }
      if (row.kind === "Check-in" && row.state === "approved" && row.executor === actor) {
        addReady(work, actor, "check-in.record", "Record the approved Check-in", row.id);
      }
    }
    const jointReady = state.mode === "joint" &&
      state.imports.A && state.imports.B &&
      state.handoffs.A !== null && state.handoffs.B !== null;
    if (
      !state.reportCheckpoint &&
      jointReady &&
      !state.checkout &&
      state.issueTakes.length === 0 &&
      readyWork(state, "A").length === 0 &&
      readyWork(state, "B").length === 0
    ) {
      addReady(work, actor, "report.record", "Record the final report checkpoint");
    }
    return work;
  }

  if (state.mode === "joint" && (!state.imports.A || !state.imports.B)) return work;

  if (state.mode === "single" && actor === "B") {
    for (const row of state.rows) {
      if (
        row.kind === "Shelved fix" &&
        row.author !== actor &&
        row.state === "shelved" &&
        shelvedFixIsSubstantive(state, row) &&
        shelvedFixIsCurrent(state, row)
      ) {
        addReady(work, actor, "shelved-fix.review", "Freshly review the single-seat Shelved fix", row.id);
      }
    }
    return work;
  }

  for (const declared of state.declaredCoverage) {
    const exists = state.rows.some((row) =>
      (row.kind === "Coverage" &&
        row.coverageKind === declared.coverageKind &&
        coverageTargetMatches(declared.coverageKind, row.target, declared.target)) ||
      (state.mode !== "cold" &&
        declared.coverageKind === "cluster" &&
        row.kind === "Issue" &&
        (row.state === "verified" || row.state === "assumed") &&
        row.clusters.some((cluster) => coverageTargetMatches("cluster", cluster, declared.target))),
    );
    const assignedHere = state.mode === "cold" || actor === "A";
    if (!exists && assignedHere) {
      addReady(work, actor, "coverage.add", `Cover ${declared.coverageKind} '${declared.target}'`);
    }
  }

  if (state.checkout?.holder === actor && !state.baseline) {
    addReady(work, actor, "checkout.baseline", "Record the first-holder build and test baseline");
  } else if (state.checkout?.holder === actor && checkoutWorkRecorded(state, state.checkout)) {
    addReady(work, actor, "checkout.release", "Release checkout after removing probes and recording shelves");
  }

  for (const row of state.rows) {
    if (state.mode === "cold" && row.author !== actor) continue;
    if (row.kind === "Coverage" && row.author === actor && row.state === "open") {
      addReady(work, actor, "coverage.cover", "Finish this coverage observation", row.id);
      continue;
    }

    if (row.kind === "Issue" && !row.exit) {
      const issueProposals = proposedFixesForIssue(state, row.id);
      const completedShelf = issueProposals.some((proposed) =>
        shelvedFixesForProposedFix(state, proposed.id).some((shelved) =>
          shelved.state !== "conditions" && shelvedFixIsCurrent(state, shelved),
        ),
      );
      const completedReportOnlyProposal = state.policy === "report-only" && issueProposals.some((proposed) =>
        proposedFixIsCurrent(state, proposed) && !proposedFixHasDispositionedIssue(state, proposed),
      );
      if (issueTake(state, row.id)?.holder === actor && (completedShelf || completedReportOnlyProposal)) {
        const recordedWork = completedShelf ? "Shelved fix" : "Proposed fix";
        addReady(work, actor, "issue.release", `Release this Issue take after recording its ${recordedWork}`, row.id);
        continue;
      }
      if (row.label === "Hardening" || row.label === "Nit" || row.label === "telemetry-quality") continue;
      if (state.mode !== "cold" && row.state === "disproved" && row.revisionAuthor === actor) {
        addReady(work, actor, "issue.exit", "Record the disproved Issue's comment-or-assert exit", row.id);
      } else if (row.state === "new" && row.revisionAuthor === actor) {
        addReady(work, actor, "issue.verify", "Verify or otherwise dispose this Issue", row.id);
      } else if ((row.state === "verified" || row.state === "assumed") && row.revisionAuthor !== actor && !hasCurrentMark(row)) {
        addReady(work, actor, "issue.mark", "Check the other reviewer's Issue", row.id);
      } else if (row.state === "contested" && row.contestCount >= 2 && row.contestedBy === actor) {
        if (!state.checkout) {
          addReady(work, actor, "checkout.take", "Take checkout and run the named probe", row.id);
        } else if (state.checkout.holder === actor) {
          addReady(work, actor, "issue.probe", "Run and record the named probe", row.id);
        }
      } else if (row.state === "contested" && row.contestCount < 2 && row.revisionAuthor !== actor) {
        addReady(work, actor, "issue.edit", "Answer the contest with one Issue edit", row.id);
      }

      const needsEveryStep = row.label === "Bug" || row.label === "Restructure";
      const settled = (row.state === "verified" || row.state === "assumed") &&
        (state.mode === "single" || hasCurrentMark(row));
      if (state.mode !== "cold" && settled && needsEveryStep && !hasOpenQuestion(state, row.id)) {
        const proposed = proposedFixesForIssue(state, row.id);
        const activeProposals = proposed.filter((candidate) => !proposedFixHasDispositionedIssue(state, candidate));
        const implementationProposals = activeProposals.filter((candidate) => candidate.proposalKind === "proposal");
        if (implementationProposals.length === 0 && (state.policy !== "report-only" || activeProposals.length === 0)) {
          const take = issueTake(state, row.id);
          if (!take) {
            addReady(work, actor, "issue.take", "Take this Issue before writing its Proposed fix", row.id);
          } else if (take.holder === actor) {
            addReady(work, actor, "proposed-fix.add", "Write a Proposed fix for the Issue you took", row.id);
          }
        } else {
          const shelved = implementationProposals.some(
            (candidate) => shelvedFixesForProposedFix(state, candidate.id).length > 0,
          );
          const take = issueTake(state, row.id);
          const readyToShelve = state.policy !== "report-only" && implementationProposals.some((candidate) =>
            proposedFixIsCurrent(state, candidate) &&
            (candidate.state === "marked" || (candidate.state === "draft" && !candidate.priorMarkRequired)) &&
            (normalizedAnswer(candidate.fix.testLocation ?? "") !== "none" ||
              allowsNoRedRun(state, [{ id: candidate.id, revision: candidate.revision }])),
          );
          if (state.policy === "report-only" && take?.holder === actor) {
            addReady(work, actor, "issue.release", "Release this Issue take after recording its Proposed fix", row.id);
          } else if (shelved && take?.holder === actor) {
            addReady(work, actor, "issue.release", "Release this Issue take after recording its Shelved fix", row.id);
          } else if (!shelved && readyToShelve && !take) {
            addReady(work, actor, "issue.take", "Take this Issue before writing its Shelved fix", row.id);
          }
        }
      } else if (issueTake(state, row.id)?.holder === actor && hasOpenQuestion(state, row.id)) {
        addReady(work, actor, "issue.release", "Release this Issue take while the user answers", row.id);
      }
      continue;
    }

    if (row.kind === "Proposed fix") {
      if (!proposedFixIsSubstantive(state, row)) continue;
      if (proposedFixHasDispositionedIssue(state, row)) continue;
      const current = refsCurrent(state, row.issueRefs, "Issue");
      const answered = hasAnsweredShapeDecision(state, row);
      const proposalRef = [{ id: row.id, revision: row.revision }] as const;
      const noRedQuestion = currentNoRedQuestion(state, row);
      const lacksNoRedDecision =
        row.proposalKind === "proposal" &&
        normalizedAnswer(row.fix.testLocation ?? "") === "none" &&
        (row.state === "marked" || (row.state === "draft" && !row.priorMarkRequired)) &&
        noRedQuestion === undefined;
      const noRedDenied = noRedQuestion?.state === "answered" &&
        !allowsNoRedRun(state, proposalRef);
      if (!current && row.author === actor) {
        addReady(work, actor, "proposed-fix.edit", "Refresh the stale Issue revisions", row.id);
      } else if (row.shapeEditCount >= 2 && !answered && row.author === actor) {
        addReady(work, actor, "question.add", "Ask the user after two Proposed fix edits", row.id);
      } else if (noRedDenied && row.author === actor) {
        addReady(work, actor, "proposed-fix.edit", "Add a reachable test after the no-red exception was denied", row.id);
      } else if (lacksNoRedDecision && row.author === actor) {
        addReady(work, actor, "question.add", "Ask for a no-red architecture exception", row.id);
      } else if (
        row.state === "draft" &&
        row.priorMarkRequired &&
        row.author !== actor &&
        !proposedFixHasOpenQuestion(state, row) &&
        (row.shapeEditCount < 2 || answered)
      ) {
        addReady(work, actor, "proposed-fix.mark", "Mark or reject the Proposed fix", row.id);
      } else if (row.state === "rejected" && row.author === actor) {
        addReady(work, actor, "proposed-fix.edit", "Revise the rejected Proposed fix", row.id);
      } else if (
        state.policy !== "report-only" &&
        row.proposalKind === "proposal" &&
        !proposedFixHasOpenQuestion(state, row) &&
        (row.state === "marked" || (row.state === "draft" && !row.priorMarkRequired)) &&
        shelvedFixesForProposedFix(state, row.id).length === 0 &&
        row.issueRefs.every((ref) => issueTake(state, ref.id)?.holder === actor)
      ) {
        if (!state.checkout) {
          addReady(work, actor, "checkout.take", "Take checkout and write this fix", row.id);
        } else if (state.checkout.holder === actor && state.baseline) {
          addReady(work, actor, "shelved-fix.add", "Record the red run, fix, green run, and Shelved fix", row.id);
        }
      }
      continue;
    }

    if (row.kind === "Shelved fix") {
      if (!shelvedFixIsSubstantive(state, row)) continue;
      if (shelvedFixHasOpenQuestion(state, row)) continue;
      const dispositioned = row.proposedFixRefs.some((ref) => {
        const proposed = state.rows.find(
          (candidate): candidate is ProposedFixRow => candidate.kind === "Proposed fix" && candidate.id === ref.id,
        );
        return proposed === undefined || proposedFixHasDispositionedIssue(state, proposed);
      });
      if (dispositioned) continue;
      const current = shelvedFixIsCurrent(state, row);
      const authorCorrection = row.author === actor && (!current || row.state === "conditions");
      if (authorCorrection) {
        const issueIds = issueIdsForShelvedFix(state, row);
        const blocked = issueIds.some((id) => {
          const take = issueTake(state, id);
          return take !== null && take.holder !== actor;
        });
        if (blocked) continue;
        const missing = issueIds.filter((id) => !issueTake(state, id));
        for (const id of missing) {
          addReady(work, actor, "issue.take", `Take ${id} before correcting ${row.id}`, id);
        }
        if (missing.length > 0) {
          if (row.state === "conditions" && !shelvedFixHasCurrentQuestion(state, row)) {
            addReady(work, actor, "question.add", "Ask the user if review conditions require a product decision", row.id);
          }
          continue;
        }
      }
      if (!current) {
        if (row.author === actor) {
          if (!state.checkout) {
            addReady(work, actor, "checkout.take", "Take checkout to refresh this stale Shelved fix", row.id);
          } else if (state.checkout.holder === actor && state.baseline) {
            addReady(work, actor, "shelved-fix.edit", "Refresh this Shelved fix after its Proposed fix changed", row.id);
          }
        }
      } else if (
        row.state === "shelved" &&
        row.author !== actor &&
        !checkoutTouchesShelvedFix(state, row)
      ) {
        addReady(work, actor, "shelved-fix.review", "Review the other reviewer's Shelved fix", row.id);
      } else if (row.state === "conditions" && row.author === actor) {
        if (!shelvedFixHasCurrentQuestion(state, row)) {
          addReady(work, actor, "question.add", "Ask the user if review conditions require a product decision", row.id);
        }
        if (!state.checkout) {
          addReady(work, actor, "checkout.take", "Take checkout and satisfy the review conditions", row.id);
        } else if (state.checkout.holder === actor && state.baseline) {
          addReady(work, actor, "shelved-fix.edit", "Update the Shelved fix to satisfy its conditions", row.id);
        }
      }
      continue;
    }

    if (row.kind === "Check-in" && row.state === "approved" && row.executor === actor) {
      addReady(work, actor, "check-in.record", "Record the approved Check-in", row.id);
    }
  }
  if (state.mode === "cold" && work.length === 0) {
    addReady(work, actor, "cold.import", "Import this finished cold pass into the shared run");
  }
  if (
    state.mode === "single" &&
    actor === "A" &&
    !state.reportCheckpoint &&
    work.length === 0 &&
    !state.checkout &&
    state.issueTakes.length === 0 &&
    readyWork(state, "B").length === 0
  ) {
    addReady(work, actor, "report.record", "Print and record the final single-seat report");
  }
  return work;
}

function workflowEvents(
  before: ProtocolState,
  afterCore: ProtocolState,
  command: ProtocolCommand,
): DomainEvent[] {
  const events: DomainEvent[] = [];
  let working = afterCore;

  const preservesReportCheckpoint =
    command.type === "report.record" ||
    command.type === "check-in.approve" ||
    command.type === "check-in.record" ||
    command.type === "check-in.drop";
  if (before.reportCheckpoint && !preservesReportCheckpoint) {
    const staleReport: DomainEvent = {
      type: "report.changed",
      command: command.type,
      actor: command.actor,
      at: command.at,
      from: "reported",
      to: "stale",
      checkpoint: null,
    };
    events.push(staleReport);
    working = applyEvent(working, staleReport);
  }

  const notificationSeats: readonly Seat[] = before.mode === "joint"
    ? (working.imports.A && working.imports.B ? ["A", "B"] : [])
    : before.mode === "single"
      ? ["A", "B"]
      : [];
  for (const seat of notificationSeats) {
    const readyBefore = readyWork(before, seat);
    const readyAfter = readyWork(working, seat);
    const hasHold = working.checkout?.holder === seat || working.issueTakes.some((take) => take.holder === seat);
    if (working.handoffs[seat] && (readyAfter.length > 0 || hasHold)) {
      const event: DomainEvent = {
        type: "handoff.changed",
        command: command.type,
        actor: command.actor,
        at: command.at,
        from: "handed-off",
        to: "working",
        seat,
        handoff: null,
      };
      events.push(event);
      working = applyEvent(working, event);
    }
    if (readyBefore.length === 0 && readyAfter.length > 0) {
      const rowIds = readyAfter.flatMap((item) => item.rowId ? [item.rowId] : []);
      const notification: Notification = {
        recipient: seat,
        kind: "ready-work",
        message: `ready: ${rowIds.join(", ") || "campaign"}; next: "$LEDGER_DIR/bin/ledger.ts" status`,
        rowIds,
        at: command.at,
      };
      events.push({
        type: "notification.requested",
        command: command.type,
        actor: command.actor,
        at: command.at,
        from: "not-requested",
        to: "requested",
        notification,
      });
    }
  }

  if (before.mode !== "cold" && command.type === "question.add") {
    const openQuestions = working.rows.filter(
      (row): row is QuestionRow => row.kind === "Question" && row.state === "open",
    );
    const questionDetails = openQuestions.map((row) => {
      const answerHint = row.purpose === "no-red" ? ALLOW_NO_RED_ANSWER : "...";
      return [
        `question: ${row.id} ${row.question}`,
        `options: ${row.options.join(" | ")}`,
        `user_effect: ${row.userEffect}`,
        `code_cost: ${row.codeCost}`,
        `recommendation: ${row.recommendation}`,
        `linked: ${[
          ...row.issueIds,
          ...(row.proposedFixRef ? [row.proposedFixRef.id] : []),
          ...(row.shelvedFixRef ? [row.shelvedFixRef.id] : []),
        ].join(", ")}`,
        `next: "$LEDGER_DIR/bin/ledger.ts" question answer ${row.id} rev=${row.revision} answer=${answerHint}`,
      ].join("; ");
    });
    const notification: Notification = {
      recipient: "master",
      kind: "question",
      message: questionDetails.join("\n"),
      rowIds: openQuestions.map((row) => row.id),
      at: command.at,
    };
    events.push({
      type: "notification.requested",
      command: command.type,
      actor: command.actor,
      at: command.at,
      from: "not-requested",
      to: "requested",
      notification,
    });
  }

  if (before.mode !== "cold" && command.type === "question.answer") {
    const question = rowOfKind(working, command.id, "Question");
    const recordedAnswer = question.state === "answered" ? question.answer : command.answer;
    const notification: Notification = {
      recipient: question.author,
      kind: "answer",
      message: `answered: ${command.id}; answer: ${recordedAnswer}; linked: ${[
        ...question.issueIds,
        ...(question.proposedFixRef ? [question.proposedFixRef.id] : []),
        ...(question.shelvedFixRef ? [question.shelvedFixRef.id] : []),
      ].join(", ")}; next: "$LEDGER_DIR/bin/ledger.ts" status`,
      rowIds: [
        command.id,
        ...question.issueIds,
        ...(question.proposedFixRef ? [question.proposedFixRef.id] : []),
        ...(question.shelvedFixRef ? [question.shelvedFixRef.id] : []),
      ],
      at: command.at,
    };
    events.push({
      type: "notification.requested",
      command: command.type,
      actor: command.actor,
      at: command.at,
      from: "not-requested",
      to: "requested",
      notification,
    });
  }

  if (command.type === "handoff") {
    const receiver = otherSeat(command.actor);
    const awaiting = readyWork(working, receiver);
    const notification: Notification = {
      recipient: receiver,
      kind: "handoff",
      message: `handoff: ${command.actor}; awaiting: ${awaiting.flatMap((item) => item.rowId ? [item.rowId] : []).join(", ") || "none"}; next: "$LEDGER_DIR/bin/ledger.ts" status`,
      rowIds: awaiting.flatMap((item) => item.rowId ? [item.rowId] : []),
      at: command.at,
    };
    events.push({
      type: "notification.requested",
      command: command.type,
      actor: command.actor,
      at: command.at,
      from: "not-requested",
      to: "requested",
      notification,
    });
    const handoffNotice = events.at(-1);
    if (handoffNotice) working = applyEvent(working, handoffNotice);

    if (
      working.imports.A &&
      working.imports.B &&
      working.handoffs.A &&
      working.handoffs.B &&
      !working.checkout &&
      working.issueTakes.length === 0 &&
      readyWork(working, "A").length === 0 &&
      readyWork(working, "B").length === 0
    ) {
      const done: Notification = {
        recipient: "master",
        kind: "no-ready-work-left",
        message: "Both reviewers handed off with no ready work left; next: \"$LEDGER_DIR/bin/ledger.ts\" report",
        rowIds: [],
        at: command.at,
      };
      events.push({
        type: "notification.requested",
        command: command.type,
        actor: command.actor,
        at: command.at,
        from: "not-requested",
        to: "requested",
        notification: done,
      });
    }
  }

  if (before.mode === "single") {
    const reviewerWork = (snapshot: ProtocolState, seat: Seat): readonly ReadyWork[] =>
      readyWork(snapshot, seat).filter((item) => item.command !== "report.record");
    const beforeHadWork = reviewerWork(before, "A").length > 0 ||
      reviewerWork(before, "B").length > 0 ||
      before.checkout !== null ||
      before.issueTakes.length > 0;
    const afterHasWork = reviewerWork(working, "A").length > 0 ||
      reviewerWork(working, "B").length > 0 ||
      working.checkout !== null ||
      working.issueTakes.length > 0;
    if (beforeHadWork && !afterHasWork) {
      const done: Notification = {
        recipient: "master",
        kind: "no-ready-work-left",
        message: "Single-seat run has no ready work left; next: \"$LEDGER_DIR/bin/ledger.ts\" report",
        rowIds: [],
        at: command.at,
      };
      events.push({
        type: "notification.requested",
        command: command.type,
        actor: command.actor,
        at: command.at,
        from: "not-requested",
        to: "requested",
        notification: done,
      });
    }
  }

  return events;
}

/**
 * Validate one command, emit its complete event batch, and return the evolved
 * state. The caller persists the batch atomically or persists none of it.
 */
export function transition(state: ProtocolState, command: ProtocolCommand): TransitionResult {
  try {
    const primary = decideCommand(state, command);
    let working = primary.reduce(applyEvent, state);
    const invalidations = invalidationEvents(state, working, command, primary);
    working = invalidations.reduce(applyEvent, working);
    const workflow = workflowEvents(state, working, command);
    working = workflow.reduce(applyEvent, working);
    return { ok: true, state: working, events: [...primary, ...invalidations, ...workflow] };
  } catch (error) {
    if (error instanceof Rejected) {
      return { ok: false, error: { code: error.code, message: error.message, command: command.type } };
    }
    throw error;
  }
}

export function timeline(state: ProtocolState, events: readonly DomainEvent[]): Readonly<Record<Actor, readonly DomainEvent[]>> {
  void state;
  return {
    A: events.filter((event) => event.actor === "A"),
    B: events.filter((event) => event.actor === "B"),
    master: events.filter((event) => event.actor === "master"),
  };
}

/**
 * Shared assertion for table-driven and property tests. The exhaustive command
 * registry above makes a newly added command a compile error until tests can
 * name it. Every accepted command must emit at least one event with its actor,
 * timestamp, and explicit from/to states.
 */
export function assertTransitionAudit(
  command: ProtocolCommand,
  result: TransitionResult,
): asserts result is Extract<TransitionResult, { ok: true }> {
  if (!result.ok) throw new Error(`${command.type} was rejected: ${result.error.message}`);
  if (result.events.length === 0) throw new Error(`${command.type} emitted no event`);
  for (const event of result.events) {
    if (event.command !== command.type) throw new Error(`${command.type} emitted an event for ${event.command}`);
    if (event.actor !== command.actor) throw new Error(`${command.type} lost actor ${command.actor}`);
    if (event.at !== command.at) throw new Error(`${command.type} lost timestamp ${command.at}`);
    if (event.from === undefined || event.to === undefined) {
      throw new Error(`${command.type} emitted an event without from/to state`);
    }
  }
}

export class ProtocolDecodeError extends Error {
  override readonly name = "ProtocolDecodeError";
}

function decodeFailure(path: string, expected: string): never {
  throw new ProtocolDecodeError(`${path} must be ${expected}`);
}

function objectAt(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return decodeFailure(path, "an object");
  }
  return value as Record<string, unknown>;
}

function stringAt(value: unknown, path: string): string {
  if (typeof value !== "string") return decodeFailure(path, "a string");
  return value;
}

function nonemptyAt(value: unknown, path: string): string {
  const result = stringAt(value, path);
  if (!result.trim()) return decodeFailure(path, "a non-empty string");
  return result;
}

function integerAt(value: unknown, path: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) return decodeFailure(path, "a non-negative integer");
  return value as number;
}

function booleanAt(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") return decodeFailure(path, "a boolean");
  return value;
}

function arrayAt(value: unknown, path: string): readonly unknown[] {
  if (!Array.isArray(value)) return decodeFailure(path, "an array");
  return value;
}

function oneOfAt<const Values extends readonly string[]>(
  value: unknown,
  values: Values,
  path: string,
): Values[number] {
  if (typeof value !== "string" || !values.includes(value)) {
    return decodeFailure(path, `one of ${values.join(", ")}`);
  }
  return value as Values[number];
}

function timestampAt(value: unknown, path: string): string {
  const result = stringAt(value, path);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(result) || new Date(result).toISOString() !== result) {
    return decodeFailure(path, "a canonical ISO timestamp");
  }
  return result;
}

function idAt(value: unknown, kind: RowKind, path: string): RowId {
  const id = stringAt(value, path);
  const patterns: Record<RowKind, RegExp> = {
    Coverage: /^C-[AB]-[1-9]\d*$/,
    Issue: /^I-[AB]-[1-9]\d*$/,
    Question: /^Q-[AB]-[1-9]\d*$/,
    "Proposed fix": /^P-[AB]-[1-9]\d*$/,
    "Shelved fix": /^S-[AB]-[1-9]\d*$/,
    "Check-in": /^K-M-[1-9]\d*$/,
  };
  if (!patterns[kind].test(id)) return decodeFailure(path, `a ${kind} id`);
  return id as RowId;
}

function actorAt(value: unknown, path: string): Actor {
  return oneOfAt(value, ACTORS, path);
}

function seatAt(value: unknown, path: string): Seat {
  return oneOfAt(value, ["A", "B"] as const, path);
}

function stringsAt(value: unknown, path: string): readonly string[] {
  return arrayAt(value, path).map((item, index) => stringAt(item, `${path}[${index}]`));
}

function marksAt(value: unknown, path: string): readonly Mark[] {
  const marks = arrayAt(value, path).map((item, index) => {
    const mark = objectAt(item, `${path}[${index}]`);
    return {
      reviewer: seatAt(mark.reviewer, `${path}[${index}].reviewer`),
      revision: integerAt(mark.revision, `${path}[${index}].revision`),
      at: timestampAt(mark.at, `${path}[${index}].at`),
    };
  });
  if (marks.length > 1) return decodeFailure(path, "zero or one mark");
  return marks;
}

function refsAt(value: unknown, kind: RowKind, path: string): readonly RevisionRef[] {
  return arrayAt(value, path).map((item, index) => {
    const ref = objectAt(item, `${path}[${index}]`);
    return {
      id: idAt(ref.id, kind, `${path}[${index}].id`),
      revision: integerAt(ref.revision, `${path}[${index}].revision`),
    };
  });
}

function factsAt(value: unknown, path: string): void {
  const facts = objectAt(value, path);
  for (const field of ["proposition", "site", "trigger", "cause", "scope", "frequency", "impact"] as const) {
    stringAt(facts[field], `${path}.${field}`);
  }
}

function rowBaseAt(row: Record<string, unknown>, kind: RowKind, path: string): void {
  idAt(row.id, kind, `${path}.id`);
  if (row.kind !== kind) decodeFailure(`${path}.kind`, kind);
  actorAt(row.author, `${path}.author`);
  integerAt(row.revision, `${path}.revision`);
  timestampAt(row.createdAt, `${path}.createdAt`);
  timestampAt(row.updatedAt, `${path}.updatedAt`);
  timestampAt(row.stateChangedAt, `${path}.stateChangedAt`);
}

function decodeRow(value: unknown, path: string): LedgerRow {
  const row = objectAt(value, path);
  const kind = oneOfAt(row.kind, ROW_KINDS, `${path}.kind`);
  rowBaseAt(row, kind, path);
  const marks = marksAt(row.marks, `${path}.marks`);
  const revision = integerAt(row.revision, `${path}.revision`);
  const author = actorAt(row.author, `${path}.author`);
  const markAuthor = kind === "Issue"
    ? seatAt(row.revisionAuthor, `${path}.revisionAuthor`)
    : author;
  for (const mark of marks) {
    if (mark.reviewer === markAuthor) decodeFailure(`${path}.marks`, "independent marks only");
    if (mark.revision !== revision) decodeFailure(`${path}.marks`, `marks on revision ${revision}`);
  }

  switch (kind) {
    case "Coverage": {
      seatAt(row.author, `${path}.author`);
      oneOfAt(row.coverageKind, ["hunk", "symptom", "cluster", "scenario"] as const, `${path}.coverageKind`);
      nonemptyAt(row.target, `${path}.target`);
      if (row.issueId !== undefined) idAt(row.issueId, "Issue", `${path}.issueId`);
      const state = oneOfAt(row.state, COVERAGE_STATES, `${path}.state`);
      if (marks.length !== 0) decodeFailure(`${path}.marks`, "empty");
      if (state === "covered") nonemptyAt(row.evidence, `${path}.evidence`);
      if (state === "gap") nonemptyAt(row.reason, `${path}.reason`);
      break;
    }
    case "Issue": {
      seatAt(row.author, `${path}.author`);
      seatAt(row.revisionAuthor, `${path}.revisionAuthor`);
      const label = oneOfAt(row.label, ISSUE_LABELS, `${path}.label`);
      if (row.labelChangeReason !== undefined) {
        nonemptyAt(row.labelChangeReason, `${path}.labelChangeReason`);
      }
      factsAt(row.facts, `${path}.facts`);
      const issueFacts = objectAt(row.facts, `${path}.facts`);
      if (issueFacts.impactRank !== undefined) {
        const impactRank = integerAt(issueFacts.impactRank, `${path}.facts.impactRank`);
        if (impactRank < 1 || impactRank > 5) decodeFailure(`${path}.facts.impactRank`, "1 through 5");
      }
      if ((issueFacts.detector === undefined) !== (issueFacts.detectorGap === undefined)) {
        decodeFailure(`${path}.facts`, "detector and detectorGap together");
      }
      if (issueFacts.detector !== undefined) nonemptyAt(issueFacts.detector, `${path}.facts.detector`);
      if (issueFacts.detectorGap !== undefined) nonemptyAt(issueFacts.detectorGap, `${path}.facts.detectorGap`);
      refsAt(arrayAt(row.parentIssueIds, `${path}.parentIssueIds`).map((id) => ({ id, revision: 0 })), "Issue", `${path}.parentIssueIds`);
      stringsAt(row.clusters, `${path}.clusters`);
      integerAt(row.contestCount, `${path}.contestCount`);
      integerAt(row.editCount, `${path}.editCount`);
      const state = oneOfAt(row.state, ISSUE_STATES, `${path}.state`);
      const certainty = integerAt(row.certainty, `${path}.certainty`);
      if (certainty < 1 || certainty > 5) decodeFailure(`${path}.certainty`, "1 through 5");
      if (state === "verified") {
        if (issueFacts.impactRank === undefined) decodeFailure(`${path}.facts.impactRank`, "1 through 5");
        if (certainty < 4) decodeFailure(`${path}.certainty`, "4 or 5 for verified");
        nonemptyAt(row.evidence, `${path}.evidence`);
      }
      if (state === "assumed") {
        if (issueFacts.impactRank === undefined) decodeFailure(`${path}.facts.impactRank`, "1 through 5");
        nonemptyAt(row.assumption, `${path}.assumption`);
        nonemptyAt(row.noProbeReason, `${path}.noProbeReason`);
      }
      if (state === "contested") {
        nonemptyAt(row.probe, `${path}.probe`);
        seatAt(row.contestedBy, `${path}.contestedBy`);
      }
      if (state === "disproved") nonemptyAt(row.evidence, `${path}.evidence`);
      if (state === "duplicate") idAt(row.duplicateOf, "Issue", `${path}.duplicateOf`);
      if (state === "accepted") {
        if (label !== "Nit") decodeFailure(`${path}.label`, "Nit when accepted");
        nonemptyAt(row.reason, `${path}.reason`);
      }
      if (row.exit !== undefined) {
        const exit = objectAt(row.exit, `${path}.exit`);
        const exitKind = oneOfAt(
          exit.kind,
          ["comment-or-assert", "ruling-or-baseline", "todo", "user-drop", "check-in"] as const,
          `${path}.exit.kind`,
        );
        if (exitKind === "check-in") idAt(exit.checkInId, "Check-in", `${path}.exit.checkInId`);
        else if (exitKind === "user-drop") nonemptyAt(exit.reason, `${path}.exit.reason`);
        else nonemptyAt(exit.reference, `${path}.exit.reference`);
      }
      break;
    }
    case "Question": {
      seatAt(row.author, `${path}.author`);
      const issueIds = arrayAt(row.issueIds, `${path}.issueIds`);
      if (issueIds.length === 0) decodeFailure(`${path}.issueIds`, "non-empty");
      refsAt(issueIds.map((id) => ({ id, revision: 0 })), "Issue", `${path}.issueIds`);
      const issueRefs = refsAt(row.issueRefs, "Issue", `${path}.issueRefs`);
      if (issueRefs.length !== issueIds.length) decodeFailure(`${path}.issueRefs`, "one ref per issue id");
      for (const id of issueIds) {
        if (!issueRefs.some((ref) => ref.id === id)) decodeFailure(`${path}.issueRefs`, `a ref for ${String(id)}`);
      }
      const purpose = oneOfAt(row.purpose, ["decision", "no-red"] as const, `${path}.purpose`);
      if (row.proposedFixRef !== undefined) {
        const ref = objectAt(row.proposedFixRef, `${path}.proposedFixRef`);
        idAt(ref.id, "Proposed fix", `${path}.proposedFixRef.id`);
        integerAt(ref.revision, `${path}.proposedFixRef.revision`);
      }
      if (row.shelvedFixRef !== undefined) {
        const ref = objectAt(row.shelvedFixRef, `${path}.shelvedFixRef`);
        idAt(ref.id, "Shelved fix", `${path}.shelvedFixRef.id`);
        integerAt(ref.revision, `${path}.shelvedFixRef.revision`);
      }
      if (row.proposedFixRef !== undefined && row.shelvedFixRef !== undefined) {
        decodeFailure(path, "at most one Proposed-fix or Shelved-fix link");
      }
      if (purpose === "no-red" && row.proposedFixRef === undefined) {
        decodeFailure(`${path}.proposedFixRef`, "required on a no-red Question");
      }
      if (purpose === "no-red" && row.shelvedFixRef !== undefined) {
        decodeFailure(`${path}.shelvedFixRef`, "absent on a no-red Question");
      }
      nonemptyAt(row.question, `${path}.question`);
      const options = stringsAt(row.options, `${path}.options`);
      if (options.length < 2) decodeFailure(`${path}.options`, "at least two options");
      if (options.some((option) => !option.trim())) decodeFailure(`${path}.options`, "non-empty options");
      if (new Set(options.map(normalizedAnswer)).size !== options.length) {
        decodeFailure(`${path}.options`, "distinct options");
      }
      if (purpose === "no-red" && !options.some((option) => normalizedAnswer(option) === ALLOW_NO_RED_ANSWER)) {
        decodeFailure(`${path}.options`, `an exact '${ALLOW_NO_RED_ANSWER}' option`);
      }
      nonemptyAt(row.recommendation, `${path}.recommendation`);
      const recommendation = stringAt(row.recommendation, `${path}.recommendation`);
      if (!mapsToQuestionOption(options, recommendation)) {
        decodeFailure(`${path}.recommendation`, "a mapping to an offered option");
      }
      nonemptyAt(row.userEffect, `${path}.userEffect`);
      nonemptyAt(row.codeCost, `${path}.codeCost`);
      const state = oneOfAt(row.state, QUESTION_STATES, `${path}.state`);
      if (state === "answered") {
        nonemptyAt(row.answer, `${path}.answer`);
        if (!mapsToQuestionOption(options, stringAt(row.answer, `${path}.answer`))) {
          decodeFailure(`${path}.answer`, "a mapping to an offered option");
        }
        timestampAt(row.answeredAt, `${path}.answeredAt`);
      }
      if (marks.length !== 0) decodeFailure(`${path}.marks`, "empty");
      break;
    }
    case "Proposed fix": {
      seatAt(row.author, `${path}.author`);
      const proposalKind = oneOfAt(row.proposalKind, ["proposal", "direction"] as const, `${path}.proposalKind`);
      if (arrayAt(row.issueRefs, `${path}.issueRefs`).length === 0) decodeFailure(`${path}.issueRefs`, "non-empty");
      refsAt(row.issueRefs, "Issue", `${path}.issueRefs`);
      const fix = objectAt(row.fix, `${path}.fix`);
      nonemptyAt(fix.shape, `${path}.fix.shape`);
      nonemptyAt(fix.cost, `${path}.fix.cost`);
      if (proposalKind === "proposal") {
        oneOfAt(fix.originClass, ["attention-miss", "self-consistency", "design-absence"] as const, `${path}.fix.originClass`);
        for (const field of ["sitesWalked", "rulingsChecked", "testLocation"] as const) {
          nonemptyAt(fix[field], `${path}.fix.${field}`);
        }
        if (normalizedAnswer(stringAt(fix.testLocation, `${path}.fix.testLocation`)) === "none" && fix.originClass !== "design-absence") {
          decodeFailure(`${path}.fix.testLocation`, "none only for design-absence architecture proposals");
        }
        for (const field of ["interfaceChange", "ownershipChange", "riskSurface"] as const) {
          booleanAt(fix[field], `${path}.fix.${field}`);
        }
        if (fix.originClass === "self-consistency") nonemptyAt(fix.guardrail, `${path}.fix.guardrail`);
      }
      if (fix.coordination !== undefined) nonemptyAt(fix.coordination, `${path}.fix.coordination`);
      booleanAt(row.priorMarkRequired, `${path}.priorMarkRequired`);
      integerAt(row.shapeEditCount, `${path}.shapeEditCount`);
      const state = oneOfAt(row.state, PROPOSED_FIX_STATES, `${path}.state`);
      if (state === "marked" && marks.length !== 1) decodeFailure(`${path}.marks`, "one mark when marked");
      if (state !== "marked" && marks.length !== 0) decodeFailure(`${path}.marks`, "empty unless marked");
      if (state === "rejected") nonemptyAt(row.reason, `${path}.reason`);
      break;
    }
    case "Shelved fix": {
      seatAt(row.author, `${path}.author`);
      if (arrayAt(row.proposedFixRefs, `${path}.proposedFixRefs`).length === 0) decodeFailure(`${path}.proposedFixRefs`, "non-empty");
      refsAt(row.proposedFixRefs, "Proposed fix", `${path}.proposedFixRefs`);
      nonemptyAt(row.artifact, `${path}.artifact`);
      if (row.redRun !== null) nonemptyAt(objectAt(row.redRun, `${path}.redRun`).path, `${path}.redRun.path`);
      nonemptyAt(objectAt(row.greenRun, `${path}.greenRun`).path, `${path}.greenRun.path`);
      if (
        row.redRun !== null &&
        objectAt(row.redRun, `${path}.redRun`).path === objectAt(row.greenRun, `${path}.greenRun`).path
      ) {
        decodeFailure(`${path}.redRun.path`, "different from greenRun.path");
      }
      const state = oneOfAt(row.state, SHELVED_FIX_STATES, `${path}.state`);
      if (state === "conditions") nonemptyAt(row.conditions, `${path}.conditions`);
      if (state === "reviewed" && marks.length !== 1) decodeFailure(`${path}.marks`, "one mark when reviewed");
      if (state !== "reviewed" && marks.length !== 0) decodeFailure(`${path}.marks`, "empty unless reviewed");
      break;
    }
    case "Check-in": {
      if (row.author !== "master") decodeFailure(`${path}.author`, "master");
      if (arrayAt(row.shelvedFixRefs, `${path}.shelvedFixRefs`).length === 0) decodeFailure(`${path}.shelvedFixRefs`, "non-empty");
      refsAt(row.shelvedFixRefs, "Shelved fix", `${path}.shelvedFixRefs`);
      actorAt(row.executor, `${path}.executor`);
      nonemptyAt(row.approval, `${path}.approval`);
      const state = oneOfAt(row.state, CHECK_IN_STATES, `${path}.state`);
      if (state === "checked in") {
        nonemptyAt(row.changeset, `${path}.changeset`);
        nonemptyAt(row.departures, `${path}.departures`);
      }
      if (state === "dropped") nonemptyAt(row.reason, `${path}.reason`);
      if (marks.length !== 0) decodeFailure(`${path}.marks`, "empty");
      break;
    }
  }
  return row as unknown as LedgerRow;
}

/** Decode a persisted state and refuse old, partial, or malformed protocol data. */
export function decodeProtocolState(input: unknown): ProtocolState {
  const state = objectAt(input, "state");
  if (state.schemaVersion !== PROTOCOL_SCHEMA_VERSION) {
    decodeFailure("state.schemaVersion", `${PROTOCOL_SCHEMA_VERSION}`);
  }
  nonemptyAt(state.campaignId, "state.campaignId");
  oneOfAt(state.mode, RUN_MODES, "state.mode");
  booleanAt(state.deep, "state.deep");
  if (state.mode !== "single" && state.deep !== true) {
    decodeFailure("state.deep", "true for joint and cold runs");
  }
  if (state.mode === "cold") seatAt(state.coldSeat, "state.coldSeat");
  else if (state.coldSeat !== null) decodeFailure("state.coldSeat", "null outside a cold run");
  const route = oneOfAt(state.route, ROUTES, "state.route");
  oneOfAt(state.policy, POLICIES, "state.policy");
  if (state.reportPath !== null) stringAt(state.reportPath, "state.reportPath");
  const names = objectAt(state.names, "state.names");
  for (const actor of ACTORS) nonemptyAt(names[actor], `state.names.${actor}`);
  const declaredCoverage = arrayAt(state.declaredCoverage, "state.declaredCoverage").map((value, index) => {
    const declared = objectAt(value, `state.declaredCoverage[${index}]`);
    return {
      coverageKind: oneOfAt(declared.coverageKind, ["hunk", "symptom", "cluster", "scenario"] as const, `state.declaredCoverage[${index}].coverageKind`),
      target: nonemptyAt(declared.target, `state.declaredCoverage[${index}].target`),
    };
  });
  if (!hasRequiredCoverageDeclaration(route, state.deep as boolean, declaredCoverage)) {
    decodeFailure(
      "state.declaredCoverage",
      route === "diagnose"
        ? "at least one declared symptom or cluster"
        : "at least one declared hunk or scenario for a deep review",
    );
  }

  const rows = arrayAt(state.rows, "state.rows").map((row, index) => decodeRow(row, `state.rows[${index}]`));
  const ids = new Set<RowId>();
  for (const row of rows) {
    if (state.mode === "cold") {
      if (row.kind !== "Coverage" && row.kind !== "Issue") {
        decodeFailure(`state.rows.${row.id}`, "Coverage or Issue only in a cold pass");
      }
      if (row.author !== state.coldSeat) {
        decodeFailure(`state.rows.${row.id}.author`, `cold seat ${String(state.coldSeat)}`);
      }
    }
    if (ids.has(row.id)) decodeFailure("state.rows", `unique ids; ${row.id} repeats`);
    ids.add(row.id);
  }
  const requireExisting = (id: RowId, kind: RowKind, path: string): void => {
    const target = rows.find((row) => row.id === id);
    if (!target || target.kind !== kind) decodeFailure(path, `an existing ${kind} id`);
  };
  for (const row of rows) {
    if (row.kind === "Coverage" && row.issueId) requireExisting(row.issueId, "Issue", `${row.id}.issueId`);
    if (row.kind === "Issue") {
      row.parentIssueIds.forEach((id, index) => requireExisting(id, "Issue", `${row.id}.parentIssueIds[${index}]`));
      if (row.state === "duplicate") {
        requireExisting(row.duplicateOf, "Issue", `${row.id}.duplicateOf`);
        const target = rows.find((candidate): candidate is IssueRow => candidate.id === row.duplicateOf && candidate.kind === "Issue");
        if (target?.state === "duplicate") decodeFailure(`${row.id}.duplicateOf`, "a non-duplicate Issue");
      }
      if (row.exit?.kind === "check-in") requireExisting(row.exit.checkInId, "Check-in", `${row.id}.exit.checkInId`);
    }
    if (row.kind === "Question") {
      row.issueIds.forEach((id, index) => requireExisting(id, "Issue", `${row.id}.issueIds[${index}]`));
      row.issueRefs.forEach((ref, index) => requireExisting(ref.id, "Issue", `${row.id}.issueRefs[${index}]`));
      if (row.proposedFixRef) {
        requireExisting(row.proposedFixRef.id, "Proposed fix", `${row.id}.proposedFixRef.id`);
      }
      if (row.shelvedFixRef) {
        requireExisting(row.shelvedFixRef.id, "Shelved fix", `${row.id}.shelvedFixRef.id`);
      }
    }
    if (row.kind === "Proposed fix") {
      row.issueRefs.forEach((ref, index) => requireExisting(ref.id, "Issue", `${row.id}.issueRefs[${index}]`));
      if (row.fix.originClass === "design-absence") {
        const reachesRestructure = (issueId: IssueId, seen = new Set<IssueId>()): boolean => {
          if (seen.has(issueId)) return false;
          seen.add(issueId);
          const issue = rows.find((candidate): candidate is IssueRow => candidate.kind === "Issue" && candidate.id === issueId);
          return issue !== undefined && (
            issue.label === "Restructure" ||
            issue.parentIssueIds.some((parentId) => reachesRestructure(parentId, seen))
          );
        };
        if (!row.issueRefs.some((ref) => reachesRestructure(ref.id))) {
          decodeFailure(`${row.id}.fix.originClass`, "design-absence linked to a Restructure Issue");
        }
      }
    }
    if (row.kind === "Shelved fix") {
      row.proposedFixRefs.forEach((ref, index) => requireExisting(ref.id, "Proposed fix", `${row.id}.proposedFixRefs[${index}]`));
      for (const ref of row.proposedFixRefs) {
        const proposed = rows.find(
          (candidate): candidate is ProposedFixRow => candidate.kind === "Proposed fix" && candidate.id === ref.id,
        );
        if (proposed?.proposalKind === "direction") {
          decodeFailure(`${row.id}.proposedFixRefs`, "only proposals, never directions");
        }
      }
    }
    if (row.kind === "Check-in") {
      row.shelvedFixRefs.forEach((ref, index) => requireExisting(ref.id, "Shelved fix", `${row.id}.shelvedFixRefs[${index}]`));
    }
  }

  if (state.checkout !== null) {
    const checkout = objectAt(state.checkout, "state.checkout");
    seatAt(checkout.holder, "state.checkout.holder");
    nonemptyAt(checkout.purpose, "state.checkout.purpose");
    const checkoutRowIds = arrayAt(checkout.rowIds, "state.checkout.rowIds").map((id, index) => {
      const value = stringAt(id, `state.checkout.rowIds[${index}]`) as RowId;
      if (!ids.has(value)) decodeFailure(`state.checkout.rowIds[${index}]`, "an existing row id");
      return value;
    });
    if (checkoutRowIds.length === 0 || new Set(checkoutRowIds).size !== checkoutRowIds.length) {
      decodeFailure("state.checkout.rowIds", "a non-empty distinct row-id list");
    }
    const targets = arrayAt(checkout.targets, "state.checkout.targets");
    if (targets.length !== checkoutRowIds.length) {
      decodeFailure("state.checkout.targets", "one target snapshot per checkout row");
    }
    targets.forEach((value, index) => {
      const target = objectAt(value, `state.checkout.targets[${index}]`);
      const id = stringAt(target.id, `state.checkout.targets[${index}].id`) as RowId;
      if (id !== checkoutRowIds[index]) {
        decodeFailure(`state.checkout.targets[${index}].id`, String(checkoutRowIds[index]));
      }
      integerAt(target.revision, `state.checkout.targets[${index}].revision`);
      oneOfAt(target.state, [
        ...COVERAGE_STATES,
        ...ISSUE_STATES,
        ...QUESTION_STATES,
        ...PROPOSED_FIX_STATES,
        ...SHELVED_FIX_STATES,
        ...CHECK_IN_STATES,
      ] as const, `state.checkout.targets[${index}].state`);
      booleanAt(target.current, `state.checkout.targets[${index}].current`);
    });
    timestampAt(checkout.takenAt, "state.checkout.takenAt");
  }

  const issueTakeIds = new Set<IssueId>();
  arrayAt(state.issueTakes, "state.issueTakes").forEach((value, index) => {
    const take = objectAt(value, `state.issueTakes[${index}]`);
    const id = idAt(take.issueId, "Issue", `state.issueTakes[${index}].issueId`) as IssueId;
    if (issueTakeIds.has(id)) decodeFailure("state.issueTakes", `one take per Issue; ${id} repeats`);
    issueTakeIds.add(id);
    const issue = rows.find((row): row is IssueRow => row.kind === "Issue" && row.id === id);
    if (!issue) decodeFailure(`state.issueTakes[${index}].issueId`, "an existing Issue id");
    const revision = integerAt(take.issueRevision, `state.issueTakes[${index}].issueRevision`);
    if (revision !== issue.revision) decodeFailure(`state.issueTakes[${index}].issueRevision`, `${issue.revision}`);
    seatAt(take.holder, `state.issueTakes[${index}].holder`);
    timestampAt(take.takenAt, `state.issueTakes[${index}].takenAt`);
  });

  if (state.baseline !== null) {
    const baseline = objectAt(state.baseline, "state.baseline");
    seatAt(baseline.recordedBy, "state.baseline.recordedBy");
    nonemptyAt(baseline.buildLog, "state.baseline.buildLog");
    nonemptyAt(baseline.testLog, "state.baseline.testLog");
    timestampAt(baseline.recordedAt, "state.baseline.recordedAt");
  }
  const handoffs = objectAt(state.handoffs, "state.handoffs");
  for (const seat of ["A", "B"] as const) {
    if (handoffs[seat] !== null) {
      const handoff = objectAt(handoffs[seat], `state.handoffs.${seat}`);
      if (handoff.seat !== seat) decodeFailure(`state.handoffs.${seat}.seat`, seat);
      timestampAt(handoff.at, `state.handoffs.${seat}.at`);
    }
  }
  const imports = objectAt(state.imports, "state.imports");
  for (const seat of ["A", "B"] as const) booleanAt(imports[seat], `state.imports.${seat}`);
  if (state.reportCheckpoint !== null) {
    const checkpoint = objectAt(state.reportCheckpoint, "state.reportCheckpoint");
    const recordedBy = oneOfAt(checkpoint.recordedBy, ["A", "master"] as const, "state.reportCheckpoint.recordedBy");
    if (state.mode === "single" && recordedBy !== "A") {
      decodeFailure("state.reportCheckpoint.recordedBy", "A in a single-seat run");
    }
    if (state.mode === "joint" && recordedBy !== "master") {
      decodeFailure("state.reportCheckpoint.recordedBy", "master in a joint run");
    }
    if (state.mode === "cold") decodeFailure("state.reportCheckpoint", "null in a cold run");
    timestampAt(checkpoint.recordedAt, "state.reportCheckpoint.recordedAt");
    const notesHash = stringAt(checkpoint.notesHash, "state.reportCheckpoint.notesHash");
    if (!/^[0-9a-f]{64}$/.test(notesHash)) {
      decodeFailure("state.reportCheckpoint.notesHash", "a lowercase SHA-256");
    }
  }
  arrayAt(state.notifications, "state.notifications").forEach((value, index) => {
    const notice = objectAt(value, `state.notifications[${index}]`);
    actorAt(notice.recipient, `state.notifications[${index}].recipient`);
    oneOfAt(notice.kind, ["ready-work", "handoff", "question", "answer", "no-ready-work-left"] as const, `state.notifications[${index}].kind`);
    nonemptyAt(notice.message, `state.notifications[${index}].message`);
    stringsAt(notice.rowIds, `state.notifications[${index}].rowIds`);
    timestampAt(notice.at, `state.notifications[${index}].at`);
  });
  const decoded = input as ProtocolState;
  for (const row of rows) {
    if (row.kind === "Question" && row.state === "open") {
      if (!refsCurrent(decoded, row.issueRefs, "Issue")) {
        decodeFailure(`${row.id}.issueRefs`, "current Issue revisions while open");
      }
      if (row.proposedFixRef && !refsCurrent(decoded, [row.proposedFixRef], "Proposed fix")) {
        decodeFailure(`${row.id}.proposedFixRef`, "a current Proposed-fix revision while open");
      }
      if (row.shelvedFixRef && !refsCurrent(decoded, [row.shelvedFixRef], "Shelved fix")) {
        decodeFailure(`${row.id}.shelvedFixRef`, "a current Shelved-fix revision while open");
      }
    }
    if (row.kind === "Shelved fix") {
      const noTestRefs = row.proposedFixRefs.filter((ref) =>
        normalizedAnswer(rowOfKind(decoded, ref.id, "Proposed fix").fix.testLocation ?? "") === "none"
      );
      if (noTestRefs.some((ref) => !allowsNoRedRun(decoded, [ref]))) {
        decodeFailure(`${row.id}.redRun`, `a current '${ALLOW_NO_RED_ANSWER}' answer for every no-test proposal`);
      }
      if (noTestRefs.length < row.proposedFixRefs.length && row.redRun === null) {
        decodeFailure(`${row.id}.redRun`, "a failing run for every testable proposal");
      }
      if (noTestRefs.length === row.proposedFixRefs.length && row.redRun !== null) {
        decodeFailure(`${row.id}.redRun`, "null when every proposal has a no-red exception");
      }
    }
  }
  return decoded;
}

export type LedgerState = ProtocolState;
export type ReduceResult = TransitionResult;
export const reduce = transition;
