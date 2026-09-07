// Read-only views of explicit commitments; no engineering verdict inferred here.
import { latestAssessment, type Actor, type Moment, type State, type Task } from "./protocol.ts"
import { activeDispatch, eligibility, taskCurrent, workSignals } from "./work.ts"

function cell(value: unknown): string { return String(value ?? "-").replaceAll("|", "\\|").replaceAll(/\r?\n/g, " ") }
function table(headers: readonly string[], rows: readonly (readonly unknown[])[]): string {
  return rows.length ? [`| ${headers.join(" | ")} |`, `| ${headers.map(() => "---").join(" | ")} |`, ...rows.map((row) => `| ${row.map(cell).join(" | ")} |`)].join("\n") : "None."
}
function situation(state: State, task: Task): string {
  const historical = taskCurrent(state, task)
  if (task.state !== "open") return `${task.state}${historical.length && task.state === "done" ? " (historical inputs/result)" : ""}`
  const dispatch = activeDispatch(state, task.id)
  if (dispatch) return `child ${dispatch.state}: ${dispatch.id}; parent ${dispatch.parent}; inspect ${dispatch.inspectAfter}`
  if (!task.owner) return "unassigned"
  const gate = eligibility(state, task, task.owner, task.started ? "finish" : "start")
  return gate.allowed ? (task.started ? "in progress" : "eligible") : gate.blockers.join("; ")
}
export function renderStatus(state: State, actor: Actor): string {
  const tasks = state.tasks.filter((task) => task.state === "open")
  return [
    `Goal: ${state.goal}`,
    `Scope: ${state.scope.mode} @${state.scope.rev}. Tasks: ${tasks.length} open, ${state.tasks.filter((task) => task.state === "done").length} done, ${state.tasks.filter((task) => task.state === "cancelled").length} cancelled.`,
    `Checkout: ${state.checkout ? `${state.checkout.holder} — ${state.checkout.purpose}` : "free"} @${state.checkoutRev}`,
    `\nWork for ${actor}:\n`,
    table(["Task/action", "Reason"], workSignals(state, actor).map((signal) => [signal.key, signal.reason])),
    "\nOpen commitments:\n",
    table(["Task", "rev / version", "Owner", "State / blocker", "Next"], tasks.map((task) => [task.id, `${task.rev} / ${task.version}`, task.owner, situation(state, task), task.next])),
    "\nUnassigned tasks are opportunities, not assignments to every reviewer. Done means the promised result arrived, not engineering approval.",
  ].join("\n")
}
export function renderReport(state: State): string {
  const subjectIds = [...new Set(state.records.filter((record) => record.assessment).map((record) => record.assessment!.subject.id))]
  return [
    `# ${state.goal}\n`,
    `Scope: ${state.scope.mode}. Source: ${state.scope.source}\n`,
    `Checkout: ${state.checkout ? `${state.checkout.holder} — ${state.checkout.purpose}` : "free"} @${state.checkoutRev}\n`,
    "## Commitments\n",
    table(["Task", "Outcome", "Owner", "State", "Result", "Reason / note"], state.tasks.map((task) => [task.id, task.outcome, task.owner, situation(state, task), task.result ? `${task.result.id}@${task.result.rev}` : "", task.reason || task.note])),
    "\n## Latest assessments\n",
    table(["Subject", "Assessment", "Verdict", "Applicability", "Conditions"], subjectIds.map((id) => {
      const latest = latestAssessment(state, id)!
      return [id, `${latest.record.id}@${latest.record.rev}`, latest.record.assessment!.verdict, latest.applicable ? "declared inputs current" : latest.reasons.join("; "), latest.record.assessment!.conditions]
    })),
    "\n## Retained records\n",
    table(["Record", "Kind", "Authors", "Title", "Artifact"], state.records.map((record) => [`${record.id}@${record.rev}`, record.kind, record.authors.join(", "), record.title, record.path || "(inline content; use show)"])),
    "\n## Executions\n",
    table(["Dispatch", "Task", "Parent", "Worker", "State", "Inspect"], state.dispatches.map((dispatch) => [dispatch.id, dispatch.task, dispatch.parent, dispatch.worker?.name, dispatch.state, dispatch.inspectAfter])),
    "\nThis is the recorded state, not a claim that all findings are resolved. Check the retained results, conditions, open commitments and declared limits.",
  ].join("\n")
}
export function renderTimeline(events: readonly Moment[], chosen?: string): string {
  return table(["Sequence", "Time", "Actor", "Command", "Target", "Note"], events.filter((event) => !chosen || event.actor === chosen || event.row === chosen).map((event) => [event.sequence, event.at, event.actor, event.command, event.row, event.note]))
}
