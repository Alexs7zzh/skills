import {
  CHECK_IN_STATES,
  COVERAGE_STATES,
  ISSUE_STATES,
  PROPOSED_FIX_STATES,
  QUESTION_STATES,
  SHELVED_FIX_STATES,
  allowsNoRedRun,
  parseClusterTokens,
  readyWork,
  type Actor,
  type CheckInRow,
  type CoverageCommon,
  type CoverageRow,
  type DomainEvent,
  type IssueId,
  type IssueRow,
  type LedgerRow,
  type Mark,
  type ProposedFixRow,
  type ProtocolState,
  type ReadyWork,
  type RowId,
  type Seat,
  type ShelvedFixRow,
} from "./protocol.js";
import type { TimelineEvent } from "./store.js";

export type ReportEvent = DomainEvent | TimelineEvent;
export type ReportNotes = Readonly<Partial<Record<Seat, string>>>;

export interface ReportContext {
  /** Immutable audit events read from the run database. */
  readonly events?: readonly ReportEvent[];
  /** Notes are deliberately supplied by the caller; projections never read files. */
  readonly notes?: ReportNotes;
  /** The seat whose next command should be expanded in status output. */
  readonly actor?: Actor;
}

const ISSUE_ORDER = ["Bug", "Restructure", "Hardening", "telemetry-quality", "Nit"] as const;

function escapeCell(value: unknown): string {
  return String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll("|", "\\|")
    .replace(/\r?\n/g, "<br>");
}

function code(value: string): string {
  return `\`${value.replaceAll("`", "\\`")}\``;
}

function table(headers: readonly string[], rows: readonly (readonly unknown[])[]): string {
  const lines = [
    `| ${headers.map(escapeCell).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(escapeCell).join(" | ")} |`),
  ];
  return lines.join("\n");
}

function joinOrNone(values: readonly string[]): string {
  return values.length > 0 ? values.join(", ") : "none";
}

function rowById(state: ProtocolState, id: RowId): LedgerRow | undefined {
  return state.rows.find((row) => row.id === id);
}

function issueById(state: ProtocolState, id: IssueId): IssueRow | undefined {
  const row = rowById(state, id);
  return row?.kind === "Issue" ? row : undefined;
}

function currentMark(row: IssueRow | ProposedFixRow | ShelvedFixRow): Mark | undefined {
  return row.marks.find((mark) => mark.revision === row.revision);
}

function markSummary(state: ProtocolState, row: IssueRow | ProposedFixRow | ShelvedFixRow): string {
  const mark = currentMark(row);
  if (state.mode === "single" && row.kind !== "Shelved fix" && mark === undefined) return "single-seat";
  return mark ? `${mark.reviewer} at ${mark.at}` : "open";
}

/**
 * Cluster fields are comma-delimited tokens. A progress annotation such as
 * `(5/6)` belongs to the token before it and is not part of that token's name.
 */
export function splitExactTokens(value: string): readonly string[] {
  return parseClusterTokens(value);
}

function coverageTokens(item: Pick<CoverageCommon, "coverageKind" | "target">): readonly string[] {
  return item.coverageKind === "cluster" ? splitExactTokens(item.target) : [item.target.trim()];
}

function coverageMatches(
  declared: Pick<CoverageCommon, "coverageKind" | "target">,
  observed: Pick<CoverageCommon, "coverageKind" | "target">,
): boolean {
  if (declared.coverageKind !== observed.coverageKind) return false;
  const observedTokens = new Set(coverageTokens(observed));
  return coverageTokens(declared).every((token) => observedTokens.has(token));
}

function coverageStateFor(
  state: ProtocolState,
  declared: Pick<CoverageCommon, "coverageKind" | "target">,
): "open" | "covered" | "gap" {
  const matching = state.rows.filter(
    (row): row is CoverageRow => row.kind === "Coverage" && coverageMatches(declared, row),
  );
  if (matching.some((row) => row.state === "gap")) return "gap";
  const explainedByIssue = declared.coverageKind === "cluster" && state.rows.some((row) =>
    row.kind === "Issue" &&
    (row.state === "verified" || row.state === "assumed") &&
    row.clusters.some((cluster) => coverageMatches(declared, { coverageKind: "cluster", target: cluster })),
  );
  if (explainedByIssue || matching.some((row) => row.state === "covered")) return "covered";
  return "open";
}

function activeIssueClusterTokens(state: ProtocolState): ReadonlySet<string> {
  return new Set(
    state.rows.flatMap((row) => {
      if (row.kind !== "Issue" || (row.state !== "verified" && row.state !== "assumed")) return [];
      return row.clusters.flatMap(splitExactTokens);
    }),
  );
}

/** Declared diagnosis clusters for which no verified or assumed Issue exists. */
export function uncoveredDeclaredClusters(state: ProtocolState): readonly string[] {
  const explained = activeIssueClusterTokens(state);
  return state.declaredCoverage
    .filter((item) => item.coverageKind === "cluster")
    .flatMap((item) => splitExactTokens(item.target))
    .filter((target, index, all) => all.indexOf(target) === index && !explained.has(target));
}

function countRows(state: ProtocolState, kind: LedgerRow["kind"], rowState: string): number {
  return state.rows.filter((row) => row.kind === kind && row.state === rowState).length;
}

function stateCountRows(state: ProtocolState): readonly (readonly unknown[])[] {
  const groups = [
    ["Coverage", COVERAGE_STATES],
    ["Issue", ISSUE_STATES],
    ["Question", QUESTION_STATES],
    ["Proposed fix", PROPOSED_FIX_STATES],
    ["Shelved fix", SHELVED_FIX_STATES],
    ["Check-in", CHECK_IN_STATES],
  ] as const;
  return groups.flatMap(([kind, states]) =>
    states.map((rowState) => [kind, rowState, countRows(state, kind, rowState)] as const),
  );
}

function revisionForReady(state: ProtocolState, item: ReadyWork): number | undefined {
  return item.rowId === undefined ? undefined : rowById(state, item.rowId)?.revision;
}

function readyCommand(state: ProtocolState, item: ReadyWork): string {
  const id = item.rowId;
  const row = id === undefined ? undefined : rowById(state, id);
  const rev = revisionForReady(state, item);
  const target = id === undefined ? "" : ` ${id}${rev === undefined ? "" : ` rev=${rev}`}`;

  switch (item.command) {
    case "coverage.cover":
      return `ledger coverage set${target} state=covered evidence=<path>`;
    case "coverage.gap":
      return `ledger coverage set${target} state=gap reason=<reason>`;
    case "issue.verify":
      if (row?.kind === "Issue") {
        const facts = [
          ["trigger", row.facts.trigger],
          ["cause", row.facts.cause],
          ["scope", row.facts.scope],
          ["frequency", row.facts.frequency],
          ["impact", row.facts.impact],
        ].filter(([, value]) => !value).map(([field]) => `${field}=<${field}>`);
        if (row.facts.impactRank === undefined) facts.push("impact_rank=<1-5>");
        const prefix = `ledger issue set${target}${facts.length === 0 ? "" : ` ${facts.join(" ")}`}`;
        return `${prefix} state=verified certainty=4 evidence=<path> | ${prefix} state=assumed certainty=<1-5> assumption=<fact> no_probe_reason=<reason> | ledger issue disprove${target} certainty=<2-5> evidence=<path>`;
      }
      return `ledger issue set${target} state=verified certainty=4 evidence=<path>`;
    case "issue.assume":
      return `ledger issue set${target} state=assumed certainty=<1-5> assumption=<fact> no_probe_reason=<reason>`;
    case "issue.edit":
      return `ledger issue set${target} <changed-field>=<value>`;
    case "issue.mark":
      return `ledger issue agree${target} | ledger issue contest${target} probe=<probe> | ledger issue disprove${target} certainty=<2-5> evidence=<path> | ledger issue duplicate${target} of=<issue-id> | ledger issue set${target} <correction>=<value>`;
    case "issue.contest":
      return `ledger issue contest${target} probe=<command-or-path>`;
    case "issue.disprove":
      return `ledger issue disprove${target} certainty=4 evidence=<path>`;
    case "issue.duplicate":
      return `ledger issue duplicate${target} of=<issue-id>`;
    case "issue.accept":
      return `ledger issue accept${target} reason=<reason>`;
    case "issue.take":
      return `ledger issue take${target}`;
    case "issue.release":
      return `ledger issue release${target}`;
    case "issue.probe":
      return `ledger issue probe${target} verdict=<verified-or-disproved> certainty=<4-5> evidence=<path>`;
    case "question.answer":
      return `ledger question answer${target} answer=<answer>`;
    case "question.add":
      if (row?.kind === "Proposed fix") {
        const noRed = row.fix.originClass === "design-absence" && row.fix.testLocation?.trim().toLowerCase() === "none";
        return `ledger question add issues=${row.issueRefs.map((reference) => reference.id).join(",")} proposed_fix=${row.id} purpose=${noRed ? "no-red" : "decision"} question=<question> options=${noRed ? "'(a) allow-no-red (b) require-test'" : "<options>"} recommendation=<choice> user_effect=<effect> code_cost=<cost>`;
      }
      if (row?.kind === "Shelved fix") {
        const issueIds = [...new Set(row.proposedFixRefs.flatMap((reference) => {
          const proposed = rowById(state, reference.id);
          return proposed?.kind === "Proposed fix" ? proposed.issueRefs.map((issueRef) => issueRef.id) : [];
        }))];
        return `ledger question add issues=${issueIds.join(",")} shelved_fix=${row.id} purpose=decision question=<question> options=<options> recommendation=<choice> user_effect=<effect> code_cost=<cost>`;
      }
      return "ledger question add issues=<issue-ids> purpose=decision question=<question> options=<options> recommendation=<choice> user_effect=<effect> code_cost=<cost>";
    case "proposed-fix.add":
      return `ledger proposed-fix add issues=${id ?? "<issue-ids>"} kind=<proposal|direction> shape=<shape> cost=<cost> [origin_class=<class> sites=<sites> rulings=<rulings> test=<location> guardrail=<if-required> coordination=<if-needed>]`;
    case "proposed-fix.edit":
      return `ledger proposed-fix set${target} <changed-field>=<value>`;
    case "proposed-fix.mark":
      return `ledger proposed-fix mark${target} | ledger proposed-fix reject${target} reason=<condition>`;
    case "proposed-fix.reject":
      return `ledger proposed-fix reject${target} reason=<reason>`;
    case "shelved-fix.add":
      return `ledger shelved-fix add proposed_fixes=${id ?? "<ids>"} artifact=<shelve>${row?.kind === "Proposed fix" && allowsNoRedRun(state, [{ id: row.id, revision: row.revision }]) ? "" : " red=<path>"} green=<path>`;
    case "shelved-fix.edit":
      return `ledger shelved-fix set${target} artifact=<shelve>${row?.kind === "Shelved fix" && allowsNoRedRun(state, row.proposedFixRefs) ? "" : " red=<path>"} green=<path>`;
    case "shelved-fix.review":
      return `ledger shelved-fix review${target} | ledger shelved-fix conditions${target} conditions=<condition>`;
    case "check-in.record":
      return `ledger check-in record${target} changeset=<id> departures=<none-or-text>`;
    case "check-in.drop":
      return `ledger check-in drop${target} reason=<reason>`;
    case "checkout.take":
      if (row?.kind === "Issue" && row.state !== "contested") return `ledger issue take${target}`;
      return `ledger checkout take purpose=<purpose>${id === undefined ? "" : ` rows=${id}`}`;
    case "checkout.baseline":
      return "ledger checkout baseline build=<path> test=<path>";
    case "checkout.release":
      return "ledger checkout release";
    case "handoff":
      return "ledger handoff";
    case "cold.import":
      return "ledger import";
    case "report.record":
      return "ledger report";
    case "coverage.add": {
      const match = item.reason.match(/^Cover (hunk|symptom|cluster|scenario) '(.+)'$/);
      return match === null
        ? "ledger coverage add kind=<kind> target=<target> state=covered evidence=<what-was-checked> | ledger coverage add kind=<kind> target=<target> state=gap reason=<gap>"
        : `ledger coverage add kind=${match[1]} target=${JSON.stringify(match[2])} state=covered evidence=<what-was-checked> | ledger coverage add kind=${match[1]} target=${JSON.stringify(match[2])} state=gap reason=<gap>`;
    }
    case "issue.add":
    case "check-in.approve":
      // These commands are never generated by readyWork today. Keep a useful,
      // public spelling if a future protocol version does return one.
      return `ledger ${item.command.replace(".", " ")}${target}`;
    case "issue.exit":
      return `ledger issue exit${target} kind=comment-or-assert reference=<comment-or-assert>`;
    default:
      return `ledger ${String(item.command).replace(".", " ")}${target}`;
  }
}

function readyForProjection(state: ProtocolState, actor: Actor): readonly ReadyWork[] {
  return readyWork(state, actor).filter((item) => {
    if (item.rowId === undefined) return true;
    const row = rowById(state, item.rowId);
    return row?.kind !== "Issue" ||
      (row.label !== "Hardening" && row.label !== "Nit" && row.label !== "telemetry-quality");
  });
}

function formatReadyCommands(command: string): string {
  return command
    .split(" | ")
    .map((candidate) => candidate.replace(/^ledger\b/, '"$LEDGER_DIR/bin/ledger.ts"'))
    .map(code)
    .join(" or ");
}

const pinnedCommand = (arguments_: string): string => `"$LEDGER_DIR/bin/ledger.ts" ${arguments_}`;

function readyBlock(state: ProtocolState, actor: Actor): string {
  const ready = readyForProjection(state, actor);
  if (ready.length > 0) {
    return ready
      .map((item) => `- ${item.rowId ? `${code(item.rowId)}: ` : ""}${escapeCell(item.reason)} — ${formatReadyCommands(readyCommand(state, item))}`)
      .join("\n");
  }

  if (state.reportCheckpoint !== null) {
    return `- Final report recorded at ${state.reportCheckpoint.recordedAt}; await the user's check-in decision.`;
  }

  if (actor === "master") {
    if (state.mode === "single") return "- No master action is ready in a single-reviewer run.";
    const complete = state.handoffs.A !== null && state.handoffs.B !== null;
    return complete
      ? `- No reviewer-ready work remains. Next: ${code(pinnedCommand("report"))}`
      : "- No master action is ready. Wait for a Question or both reviewer handoffs.";
  }
  if (state.checkout?.holder === actor) {
    return `- Release the checkout before handoff: ${code(pinnedCommand("checkout release"))}`;
  }
  const takes = state.issueTakes.filter((take) => take.holder === actor);
  if (takes.length > 0) {
    return takes
      .map((take) => {
        const revision = issueById(state, take.issueId)?.revision;
        const command = pinnedCommand(`issue release ${take.issueId}${revision === undefined ? "" : ` rev=${revision}`}`);
        return `- Release ${code(take.issueId)} before handoff: ${code(command)}`;
      })
      .join("\n");
  }
  if (state.handoffs[actor] !== null) {
    return "- Handed off; remain idle until the ledger sends new ready work.";
  }
  if (state.mode === "single") {
    return actor === "A"
      ? readyForProjection(state, "B").length > 0
        ? `- Dispatch the fresh diff reviewer and give it seat B's command above.`
        : `- No ready work. Next: ${code(pinnedCommand("report"))}`
      : "- No fresh diff review is ready.";
  }
  if (state.mode === "cold") return `- Cold work complete. Next: ${code(pinnedCommand("import"))}`;
  return `- No ready work. Next: ${code(pinnedCommand("handoff"))}`;
}

function openQuestions(state: ProtocolState): readonly Extract<LedgerRow, { kind: "Question" }>[] {
  return state.rows.filter(
    (row): row is Extract<LedgerRow, { kind: "Question" }> => row.kind === "Question" && row.state === "open",
  );
}

function displayOptions(options: readonly string[]): string {
  return options
    .map((option, index) => /^\s*\([a-z]\)\s+/i.test(option)
      ? option
      : `(${String.fromCharCode(97 + index)}) ${option}`)
    .join("<br>");
}

function renderOpenQuestions(state: ProtocolState): string {
  const questions = openQuestions(state);
  if (questions.length === 0) return "None.";
  return table(
    ["ID", "State", "Asked by", "Issues", "Fix revision", "Question", "Options", "User effect", "Code cost", "Recommendation"],
    questions.map((row) => [
      row.id,
      "open",
      state.names[row.author],
      joinOrNone(row.issueRefs.map((reference) => `${reference.id}@r${reference.revision}`)),
      row.proposedFixRef !== undefined
        ? `${row.proposedFixRef.id}@r${row.proposedFixRef.revision}`
        : row.shelvedFixRef !== undefined
          ? `${row.shelvedFixRef.id}@r${row.shelvedFixRef.revision}`
          : "none",
      row.question,
      displayOptions(row.options),
      row.userEffect,
      row.codeCost,
      row.recommendation,
    ]),
  );
}

function renderStatusIssues(state: ProtocolState): string {
  const issues = state.rows.filter((row): row is IssueRow => row.kind === "Issue");
  if (issues.length === 0) return "None.";
  return table(
    ["Issue", "Label", "State", "Take"],
    issues.map((issue) => {
      const take = state.issueTakes.find((candidate) => candidate.issueId === issue.id);
      return [
        `${issue.id} r${issue.revision}`,
        issue.label,
        issueStateSummary(issue),
        take === undefined
          ? "none"
          : `taken by ${take.holder} for r${take.issueRevision} since ${take.takenAt}; no expiry`,
      ];
    }),
  );
}

export function renderStatus(state: ProtocolState, context: ReportContext = {}): string {
  const actor = context.actor;
  const readyA = readyForProjection(state, "A");
  const readyB = readyForProjection(state, "B");
  const checkout = state.checkout === null
    ? "free"
    : `${state.names[state.checkout.holder]} (${state.checkout.holder}) — ${state.checkout.purpose}; since ${state.checkout.takenAt}; rows: ${joinOrNone(state.checkout.rowIds)}; no expiry`;
  const takes = state.issueTakes.length === 0
    ? "None."
    : table(
      ["Issue", "Taken by", "Since", "Expiry"],
      state.issueTakes.map((take) => [
        `${take.issueId}@r${take.issueRevision}`,
        `${state.names[take.holder]} (${take.holder})`,
        take.takenAt,
        "none",
      ]),
    );

  const lines = [
    "# Ledger status",
    "",
    `Run: ${state.deep ? "deep " : state.route === "review" ? "quick " : "plain "}${state.route}; how far: ${state.policy}; topology: ${state.mode}.`,
    state.mode === "cold"
      ? "Cold independence: this is an isolated cold-pass database; shared derived coverage and peer rows are intentionally unavailable."
      : state.mode === "single"
        ? "Single-reviewer run: no cold peer import is required; seat B is used only for the fresh diff review of a Shelved fix."
        : `Cold imports: A ${state.imports.A ? "imported" : "pending"}; B ${state.imports.B ? "imported" : "pending"}.`,
    `A ready work: ${readyA.length}; B ready work: ${readyB.length}.`,
    state.mode === "single"
      ? "Handoff: not used in a single-reviewer run."
      : `Handoffs: A ${state.handoffs.A?.at ?? "working"}; B ${state.handoffs.B?.at ?? "working"}.`,
    `Checkout: ${checkout}.`,
    "",
    "## Rows by state",
    "",
    table(["Row", "State", "Count"], stateCountRows(state)),
    "",
    "## Issue takes",
    "",
    takes,
    "",
    "## Issues",
    "",
    renderStatusIssues(state),
    "",
    "## Open questions",
    "",
    renderOpenQuestions(state),
    "",
    `## ${state.names.A} (A) ready work`,
    "",
    readyBlock(state, "A"),
    "",
    `## ${state.names.B} (B) ready work`,
    "",
    readyBlock(state, "B"),
  ];

  if (actor !== undefined) {
    lines.push("", `## Your next step (${state.names[actor]})`, "", readyBlock(state, actor));
  }

  return `${lines.join("\n")}\n`;
}

interface NormalizedEvent {
  readonly sequence: number;
  readonly at: string;
  readonly actor: string;
  readonly action: string;
  readonly rowKind: string;
  readonly rowId: string;
  readonly from: string;
  readonly to: string;
  readonly detail: string;
}

function isStoredEvent(event: ReportEvent): event is TimelineEvent {
  return "occurredAt" in event;
}

function friendlyAction(action: string): string {
  const names: Readonly<Record<string, string>> = {
    "coverage.cover": "coverage set",
    "coverage.gap": "coverage set",
    "issue.edit": "issue set",
    "issue.verify": "issue set",
    "issue.assume": "issue set",
    "issue.mark": "issue agree",
    "proposed-fix.edit": "proposed-fix set",
    "shelved-fix.edit": "shelved-fix set",
  };
  return names[action] ?? action.replace(".", " ");
}

function eventDetail(event: DomainEvent): string {
  switch (event.type) {
    case "run.changed":
      return `depth escalated; declared coverage now has ${event.declaredCoverage.length} targets`;
    case "row.changed":
      return event.reason;
    case "checkout.changed":
      if (event.checkout !== null) return event.checkout.purpose;
      return event.release?.forced
        ? `forced release: ${event.release.reason ?? "reason not recorded"}`
        : "released";
    case "handoff.changed":
      return event.handoff === null ? "work resumed" : "handed off";
    case "import.changed":
      return event.imported ? "cold rows imported" : "import cleared";
    case "issue-take.changed":
      return event.take === null ? "released" : `taken by ${event.take.holder}`;
    case "report.changed":
      return event.checkpoint === null ? "report checkpoint invalidated" : `report recorded by ${event.checkpoint.recordedBy}`;
    case "notification.requested":
      return `${event.notification.kind} → ${event.notification.recipient}`;
  }
}

function storedEventDetail(value: unknown): string {
  if (value === null || typeof value !== "object") return value === undefined ? "" : String(value);
  const detail = value as Partial<DomainEvent> & Record<string, unknown>;
  switch (detail.type) {
    case "run.changed": {
      const declaredCoverage = Array.isArray(detail.declaredCoverage) ? detail.declaredCoverage : [];
      return `depth escalated; declared coverage now has ${declaredCoverage.length} targets`;
    }
    case "row.changed":
      return String(detail.reason ?? "command");
    case "checkout.changed": {
      const checkout = detail.checkout as { readonly purpose?: unknown } | null | undefined;
      if (checkout?.purpose !== undefined) return String(checkout.purpose);
      const release = detail.release as { readonly forced?: unknown; readonly reason?: unknown } | undefined;
      return release?.forced
        ? `forced release: ${String(release.reason ?? "reason not recorded")}`
        : "released";
    }
    case "handoff.changed":
      return detail.handoff == null ? "work resumed" : "handed off";
    case "import.changed":
      return detail.imported ? "cold rows imported" : "import cleared";
    case "issue-take.changed": {
      const take = detail.take as { readonly holder?: unknown } | null | undefined;
      return take?.holder === undefined ? "released" : `taken by ${String(take.holder)}`;
    }
    case "report.changed": {
      const checkpoint = detail.checkpoint as { readonly recordedBy?: unknown } | null | undefined;
      return checkpoint === null
        ? "report checkpoint invalidated"
        : `report recorded by ${String(checkpoint?.recordedBy ?? "unknown")}`;
    }
    case "notification.requested": {
      const notification = detail.notification as { readonly kind?: unknown; readonly recipient?: unknown } | undefined;
      return `${String(notification?.kind ?? "notification")} → ${String(notification?.recipient ?? "unknown")}`;
    }
    default:
      return JSON.stringify(value);
  }
}

function normalizeEvents(events: readonly ReportEvent[]): readonly NormalizedEvent[] {
  return events.map((event, index) => {
    if (isStoredEvent(event)) {
      return {
        sequence: event.sequence,
        at: event.occurredAt,
        actor: event.actor,
        action: friendlyAction(event.action),
        rowKind: event.rowKind ?? "—",
        rowId: event.rowId ?? "—",
        from: event.fromState ?? "—",
        to: event.toState ?? "—",
        detail: storedEventDetail(event.detail),
      };
    }
    return {
      sequence: index + 1,
      at: event.at,
      actor: event.actor,
      action: friendlyAction(event.command),
      rowKind: event.type === "row.changed" ? event.rowKind : event.type.replace(".changed", ""),
      rowId: event.type === "row.changed"
        ? event.rowId
        : event.type === "issue-take.changed"
          ? event.issueId
          : "—",
      from: event.from ?? "—",
      to: event.to ?? "—",
      detail: eventDetail(event),
    };
  }).sort((left, right) => left.sequence - right.sequence);
}

export function renderTimeline(
  state: ProtocolState,
  events: readonly ReportEvent[],
  actor?: Actor,
): string {
  const actors = actor === undefined ? (["A", "B", "master"] as const) : ([actor] as const);
  const normalized = normalizeEvents(events);
  const sections = actors.flatMap((who) => {
    const own = normalized.filter((event) => event.actor === who);
    return [
      `## ${state.names[who]} (${who})`,
      "",
      own.length === 0
        ? "No recorded transitions."
        : table(
          ["#", "Timestamp", "Action", "Row", "From", "To", "Detail"],
          own.map((event) => [
            event.sequence,
            event.at,
            `${event.action} (${event.rowKind})`,
            event.rowId,
            event.from,
            event.to,
            event.detail,
          ]),
        ),
      "",
    ];
  });
  return `${sections.join("\n").trimEnd()}\n`;
}

function proposedFixesForIssue(state: ProtocolState, issue: IssueRow): readonly ProposedFixRow[] {
  return state.rows.filter(
    (row): row is ProposedFixRow =>
      row.kind === "Proposed fix" &&
      row.issueRefs.some((reference) => reference.id === issue.id && reference.revision === issue.revision),
  );
}

function shelvesForProposedFix(state: ProtocolState, proposed: ProposedFixRow): readonly ShelvedFixRow[] {
  return state.rows.filter(
    (row): row is ShelvedFixRow =>
      row.kind === "Shelved fix" &&
      row.proposedFixRefs.some((reference) => reference.id === proposed.id && reference.revision === proposed.revision),
  );
}

function issueStateSummary(issue: IssueRow): string {
  if (issue.exit !== undefined) return `${issue.state}; exited by ${issue.exit.kind}`;
  if (issue.state === "disproved" || issue.state === "duplicate" || issue.state === "accepted") {
    return issue.state;
  }
  return `open: ${issue.state}`;
}

function issueDisposition(issue: IssueRow): string {
  const details: string[] = [];
  if (issue.labelChangeReason) details.push(`downgrade: ${issue.labelChangeReason}`);
  if (issue.exit?.kind === "user-drop") details.push(`user drop: ${issue.exit.reason}`);
  else if (issue.exit?.kind === "check-in") details.push(`checked in by ${issue.exit.checkInId}`);
  else if (issue.exit) details.push(`${issue.exit.kind}: ${issue.exit.reference}`);
  return details.length === 0 ? "none" : details.join("; ");
}

function issueEvidence(issue: IssueRow): string {
  switch (issue.state) {
    case "verified":
    case "disproved":
      return issue.evidence;
    case "assumed":
      return `${issue.assumption}; no probe: ${issue.noProbeReason}`;
    case "contested":
      return `probe: ${issue.probe}`;
    case "duplicate":
      return `duplicate of ${issue.duplicateOf}`;
    case "accepted":
      return issue.reason;
    case "new":
      return "open";
  }
}

function renderCoverage(state: ProtocolState): string {
  const declared = state.declaredCoverage.map((item) => [
    item.coverageKind,
    item.target,
    coverageStateFor(state, item),
  ]);
  const gaps = state.rows.filter(
    (row): row is Extract<CoverageRow, { state: "gap" }> => row.kind === "Coverage" && row.state === "gap",
  );
  const uncovered = uncoveredDeclaredClusters(state);
  return [
    declared.length === 0
      ? "No declared coverage targets."
      : table(["Kind", "Declared target", "Coverage state"], declared),
    "",
    `Coverage gaps: ${gaps.length === 0 ? "none" : gaps.map((row) => `${row.id} (${row.target}: ${row.reason})`).join("; ")}.`,
    `Uncovered declared clusters: ${uncovered.length === 0 ? "none" : uncovered.join(", ")}.`,
  ].join("\n");
}

function sortIssues(issues: readonly IssueRow[]): readonly IssueRow[] {
  return [...issues].sort((left, right) => {
    const rank = (left.facts.impactRank ?? 6) - (right.facts.impactRank ?? 6);
    if (rank !== 0) return rank;
    const label = ISSUE_ORDER.indexOf(left.label) - ISSUE_ORDER.indexOf(right.label);
    return label === 0 ? left.id.localeCompare(right.id) : label;
  });
}

function issueTable(state: ProtocolState, issues: readonly IssueRow[]): string {
  if (issues.length === 0) return "None.";
  return table(
    [
      "ID",
      "Label",
      "Impact rank",
      "Certainty",
      "State",
      "Disposition / downgrade",
      "Issue",
      "Site / trigger",
      "Cause",
      "Scope / frequency",
      "Detector / gap",
      "Clusters / parents",
      "Impact",
      "Evidence",
      "Mark",
      "Proposed fixes",
      "Shelved fixes",
      "Take",
    ],
    sortIssues(issues).map((issue) => {
      const proposed = proposedFixesForIssue(state, issue);
      const shelves = proposed.flatMap((fix) => shelvesForProposedFix(state, fix));
      const take = state.issueTakes.find((candidate) => candidate.issueId === issue.id);
      return [
        `${issue.id} r${issue.revision}`,
        issue.label,
        issue.facts.impactRank ?? "open",
        `step ${issue.certainty}`,
        issueStateSummary(issue),
        issueDisposition(issue),
        issue.facts.proposition,
        `${issue.facts.site}; ${issue.facts.trigger}`,
        issue.facts.cause,
        `${issue.facts.scope}; ${issue.facts.frequency}`,
        issue.facts.detector === undefined
          ? "not recorded"
          : `${issue.facts.detector}; missed because: ${issue.facts.detectorGap}`,
        `clusters: ${joinOrNone(issue.clusters)}; parents: ${joinOrNone(issue.parentIssueIds)}`,
        issue.facts.impact,
        issueEvidence(issue),
        markSummary(state, issue),
        joinOrNone(proposed.map((fix) => `${fix.id} (${fix.state})`)),
        joinOrNone(shelves.map((shelf) => `${shelf.id} (${shelf.state}; ${shelf.artifact})`)),
        take === undefined
          ? "none"
          : `taken by ${take.holder} for r${take.issueRevision} since ${take.takenAt}; no expiry`,
      ];
    }),
  );
}

function renderIssues(state: ProtocolState): string {
  const issues = state.rows.filter((row): row is IssueRow => row.kind === "Issue");
  if (issues.length === 0) return "None.";
  if (state.route === "diagnose") {
    const verified = issues.filter((issue) => issue.state === "verified");
    const hypotheses = issues.filter((issue) => issue.state === "new" || issue.state === "assumed" || issue.state === "contested");
    const dispositions = issues.filter((issue) => issue.state === "disproved" || issue.state === "duplicate" || issue.state === "accepted");
    return [
      "### Verified causes",
      "",
      issueTable(state, verified),
      "",
      "### Open and assumed hypotheses",
      "",
      issueTable(state, hypotheses),
      "",
      "### Dispositions",
      "",
      issueTable(state, dispositions),
    ].join("\n");
  }
  const substantive = issues.filter((issue) => issue.label === "Bug" || issue.label === "Restructure");
  const batches = (["Hardening", "telemetry-quality", "Nit"] as const).flatMap((label) => {
    const rows = issues.filter((issue) => issue.label === label);
    return rows.length === 0 ? [] : ["", `### ${label} batch`, "", issueTable(state, rows)];
  });
  return ["### Issues ranked by user impact", "", issueTable(state, substantive), ...batches].join("\n");
}

function renderQuestions(state: ProtocolState): string {
  const questions = state.rows.filter((row) => row.kind === "Question");
  if (questions.length === 0) return "None.";
  return table(
    ["ID", "State", "Issues", "Fix revision", "Question", "Options", "User effect", "Code cost", "Recommendation", "Answer"],
    questions.map((row) => [
      `${row.id} r${row.revision}`,
      row.state === "open" ? "open" : "answered",
      joinOrNone(row.issueRefs.map((reference) => `${reference.id}@r${reference.revision}`)),
      row.proposedFixRef !== undefined
        ? `${row.proposedFixRef.id}@r${row.proposedFixRef.revision}`
        : row.shelvedFixRef !== undefined
          ? `${row.shelvedFixRef.id}@r${row.shelvedFixRef.revision}`
          : "none",
      row.question,
      displayOptions(row.options),
      row.userEffect,
      row.codeCost,
      row.recommendation,
      row.state === "answered" ? row.answer : "open",
    ]),
  );
}

function renderShelvedFixes(state: ProtocolState): string {
  const rows = state.rows.filter((row): row is ShelvedFixRow => row.kind === "Shelved fix");
  if (rows.length === 0) return "None.";
  return table(
    ["ID", "State / review", "Proposed fixes", "Artifact", "Red", "Green", "Conditions"],
    rows.map((row) => [
      `${row.id} r${row.revision}`,
      `${row.state}; ${markSummary(state, row)}`,
      joinOrNone(row.proposedFixRefs.map((reference) => `${reference.id}@r${reference.revision}`)),
      row.artifact,
      row.redRun?.path ?? "user-authorized no-red architecture case",
      row.greenRun.path,
      row.state === "conditions" ? row.conditions : "none",
    ]),
  );
}

function renderCheckIns(state: ProtocolState): string {
  const rows = state.rows.filter((row): row is CheckInRow => row.kind === "Check-in");
  if (rows.length === 0) return "None.";
  return table(
    ["ID", "State", "Shelved fixes", "Executor", "Approval", "Result"],
    rows.map((row) => [
      `${row.id} r${row.revision}`,
      row.state,
      joinOrNone(row.shelvedFixRefs.map((reference) => `${reference.id}@r${reference.revision}`)),
      state.names[row.executor],
      row.approval,
      row.state === "checked in"
        ? `${row.changeset}; departures: ${row.departures || "none"}`
        : row.state === "dropped"
          ? row.reason
          : "open",
    ]),
  );
}

function renderNotes(state: ProtocolState, notes: ReportContext["notes"]): string {
  const seats: readonly Seat[] = state.mode === "single" ? ["A"] : ["A", "B"];
  return seats
    .map((seat) => {
      const body = notes?.[seat]?.trim();
      return `## Reviewer ${state.names[seat]} (${seat}) notes\n\n${body || "Notes not supplied."}`;
    })
    .join("\n\n");
}

function eventAction(event: ReportEvent): string {
  return isStoredEvent(event) ? event.action : event.command;
}

function noRedQuestionIds(state: ProtocolState, shelf: ShelvedFixRow): readonly string[] {
  if (!allowsNoRedRun(state, shelf.proposedFixRefs)) return [];
  return shelf.proposedFixRefs.flatMap((proposedRef) => {
    const proposed = rowById(state, proposedRef.id);
    if (proposed?.kind !== "Proposed fix") return [];
    const question = state.rows.find((row) =>
      row.kind === "Question" &&
      row.purpose === "no-red" &&
      row.state === "answered" &&
      row.answer.trim().toLowerCase() === "allow-no-red" &&
      row.proposedFixRef?.id === proposedRef.id &&
      row.proposedFixRef.revision === proposedRef.revision &&
      proposed.issueRefs.every((issueRef) => row.issueRefs.some(
        (questionRef) => questionRef.id === issueRef.id && questionRef.revision === issueRef.revision,
      )),
    );
    return question === undefined ? [] : [question.id];
  });
}

function renderValidation(state: ProtocolState, events: readonly ReportEvent[]): string {
  const facts: string[] = [];
  if (state.baseline === null) {
    facts.push("Baseline build and test logs: not recorded.");
  } else {
    facts.push(`Baseline build ran; result retained in ${state.baseline.buildLog}.`);
    facts.push(`Baseline owning tests ran; result retained in ${state.baseline.testLog}.`);
  }

  const shelves = state.rows.filter((row): row is ShelvedFixRow => row.kind === "Shelved fix");
  if (shelves.length === 0) {
    facts.push("Shelved-fix run logs: none recorded.");
  } else {
    for (const shelf of shelves) {
      const red = shelf.redRun === null
        ? `no red log; authorization Questions: ${joinOrNone(noRedQuestionIds(state, shelf))}`
        : `red run failed on the unfixed code as recorded in ${shelf.redRun.path}`;
      facts.push(`${shelf.id}: ${red}; green run passed as recorded in ${shelf.greenRun.path}.`);
    }
  }

  if (state.checkout !== null) {
    facts.push(
      `Checkout: held by ${state.checkout.holder} for ${state.checkout.purpose} since ${state.checkout.takenAt}; no probe-free claim is available while held.`,
    );
  } else {
    const releases = events.filter((event) => eventAction(event) === "checkout.release");
    const lastRelease = releases.at(-1);
    if (lastRelease === undefined) {
      facts.push("Checkout: free; no normal release declaration is recorded, so no probe-free claim is made.");
    } else if (lastRelease.actor === "A" || lastRelease.actor === "B") {
      facts.push(`Checkout: free; ${lastRelease.actor}'s recorded normal release declares that no probe remains.`);
    } else {
      facts.push("Checkout: free after a master release; no normal-release probe claim is inferred.");
    }
  }

  return `${facts.map((fact) => `- ${fact}`).join("\n")}\n\nValidation: ${facts.join(" ")}`;
}

function renderFixTable(state: ProtocolState): string {
  const fixes = state.rows.filter((row): row is ProposedFixRow => row.kind === "Proposed fix");
  if (fixes.length === 0) return "None.";
  return table(
    [
      "Proposed fix",
      "Kind",
      "Issues",
      "State / mark",
      "Origin",
      "Shape",
      "Sites walked",
      "Rulings checked",
      "Structural flags",
      "Guardrail / coordination",
      "Test",
      "Cost",
      "Shelved fixes",
    ],
    fixes.map((fix) => {
      const shelves = shelvesForProposedFix(state, fix);
      return [
        `${fix.id} r${fix.revision}`,
        fix.proposalKind,
        joinOrNone(fix.issueRefs.map((reference) => {
          const issue = issueById(state, reference.id);
          return `${reference.id}@r${reference.revision}${issue?.revision === reference.revision ? "" : " (stale)"}`;
        })),
        `${fix.state}; ${markSummary(state, fix)}`,
        fix.fix.originClass ?? "direction",
        fix.fix.shape,
        fix.fix.sitesWalked ?? "not applicable",
        fix.fix.rulingsChecked ?? "not applicable",
        `interface=${fix.fix.interfaceChange ?? false}; ownership=${fix.fix.ownershipChange ?? false}; risk=${fix.fix.riskSurface ?? false}`,
        `guardrail: ${fix.fix.guardrail ?? "none"}; coordination: ${fix.fix.coordination ?? "none"}`,
        fix.fix.testLocation ?? "not applicable",
        fix.fix.cost,
        joinOrNone(shelves.map((shelf) => `${shelf.id} (${shelf.state}; ${shelf.artifact})`)),
      ];
    }),
  );
}

export function renderReport(state: ProtocolState, context: ReportContext = {}): string {
  const title = state.route === "review" ? "Review report" : "Diagnosis report";
  const checkout = state.checkout === null
    ? "free"
    : `${state.checkout.holder}: ${state.checkout.purpose} since ${state.checkout.takenAt}; no expiry`;
  const lines = [
    `# ${title}`,
    "",
    table(
      ["Route", "Depth", "How far", "Topology", "Checkout", "A ready", "B ready"],
      [[
        state.route,
        state.deep ? "deep" : state.route === "review" ? "quick" : "plain",
        state.policy,
        state.mode,
        checkout,
        readyForProjection(state, "A").filter((item) => item.command !== "report.record").length,
        readyForProjection(state, "B").filter((item) => item.command !== "report.record").length,
      ]],
    ),
    ...(state.mode === "cold"
      ? ["", "Cold independence: this report contains only the isolated cold pass; it does not use shared derived coverage or peer rows."]
      : []),
    "",
    "## Coverage",
    "",
    renderCoverage(state),
    "",
    "## Issues",
    "",
    renderIssues(state),
    "",
    "## Questions",
    "",
    renderQuestions(state),
    "",
    "## Shelved fixes",
    "",
    renderShelvedFixes(state),
    "",
    "## Check-ins",
    "",
    renderCheckIns(state),
    "",
    "## Per-agent timeline",
    "",
    renderTimeline(state, context.events ?? []).trimEnd(),
  ];
  if (state.route === "review") {
    lines.push(
      "",
      "## Validation",
      "",
      renderValidation(state, context.events ?? []),
      ...(state.deep ? ["", renderNotes(state, context.notes)] : []),
      "",
      "## Fix table",
      "",
      renderFixTable(state),
    );
  } else {
    lines.push(
      "",
      renderNotes(state, context.notes),
      "",
      "## Fix table",
      "",
      renderFixTable(state),
      "",
      "## Validation",
      "",
      renderValidation(state, context.events ?? []),
    );
  }
  return `${lines.join("\n")}\n`;
}
