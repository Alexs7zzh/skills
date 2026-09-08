// Read-only presentation of arguments, peer agreement and continuing work.
import { recordByRef, taskById, type Actor, type Moment, type State, type Task } from "./protocol.ts"
import { activeDispatch, agreed, eligibility, workSignals } from "./work.ts"

function cell(value: unknown): string { return String(value ?? "-").replaceAll("|", "\\|").replaceAll(/\r?\n/g, " ") }
function table(headers: readonly string[], rows: readonly (readonly unknown[])[]): string {
  return rows.length ? [`| ${headers.join(" | ")} |`, `| ${headers.map(() => "---").join(" | ")} |`, ...rows.map((row) => `| ${row.map(cell).join(" | ")} |`)].join("\n") : "None."
}
function agreement(state: State, task: Task): string {
  const conclusion = task.conclusion
  if (!conclusion) return "no conclusion"
  const missing = state.investigators.filter((actor) => !conclusion.agreedBy.includes(actor))
  return missing.length ? `author ${conclusion.author}; awaiting ${missing.join(", ")}` : `agreed by ${conclusion.agreedBy.join(", ")}`
}
function situation(state: State, task: Task): string {
  if (task.conclusion) return `${task.conclusion.disposition}; ${agreement(state, task)}`
  if (task.wait) return `waiting on ${task.wait.kind}: ${task.wait.reason}`
  const dispatch = activeDispatch(state, task.id)
  if (dispatch) return `child ${dispatch.state}: ${dispatch.id}; parent ${dispatch.parent}; inspect ${dispatch.inspectAfter}`
  if (!task.owner) return "unassigned"
  const gate = eligibility(state, task, task.owner, task.started ? "dispatch" : "start")
  return gate.allowed ? (task.started ? "in progress" : "eligible") : gate.blockers.join("; ")
}
/** Shared children display once; later parents keep a cross-reference. */
export function renderTree(state: State, rootId?: string): string {
  if (rootId && !taskById(state, rootId)) throw new Error(`no task ${rootId}`)
  const tasks = new Map(state.tasks.map((task) => [task.id, task]))
  const children = new Set(state.tasks.flatMap((task) => task.conclusion?.children ?? []))
  const roots = rootId ? [rootId] : state.tasks.filter((task) => !children.has(task.id)).map((task) => task.id)
  const seen = new Set<string>(), lines: string[] = []
  const visit = (id: string, depth: number) => {
    const task = tasks.get(id), indent = "  ".repeat(depth)
    if (!task) { lines.push(`${indent}- missing issue ${cell(id)}`); return }
    if (seen.has(id)) { lines.push(`${indent}- ↳ ${cell(id)} — shared issue; shown above`); return }
    seen.add(id)
    lines.push(`${indent}- ${cell(id)} @${task.rev}: ${cell(task.title)} — ${cell(situation(state, task))}; acting: ${cell(task.owner)}`)
    for (const child of task.conclusion?.children ?? []) visit(child, depth + 1)
  }
  for (const root of roots) visit(root, 0)
  if (!rootId) for (const task of state.tasks) if (!seen.has(task.id)) visit(task.id, 0)
  return lines.join("\n") || "None."
}
function argument(state: State, task: Task): string {
  if (!task.conclusion) return task.note || task.wait?.reason || ""
  const ref = task.conclusion.record, record = recordByRef(state, ref)
  return `${ref.id}@${ref.rev}: ${record ? record.path || record.content : "missing retained argument"}`
}
export function renderStatus(state: State, actor: Actor, rootId?: string): string {
  const published = state.tasks.filter((task) => task.conclusion)
  const settled = published.filter((task) => agreed(state, task))
  return [
    `Goal: ${state.goal}`,
    `Investigators: ${state.investigators.join(", ")}. Scope: ${state.scope.mode} @${state.scope.rev}.`,
    `Issues: ${state.tasks.length - published.length} open, ${published.length} published conclusions, ${settled.length} agreed.`,
    `Checkout: ${state.checkout ? `${state.checkout.holder} — ${state.checkout.purpose}` : "free"} @${state.checkoutRev}`,
    `\nAttention for ${actor}:\n`,
    table(["Issue/action", "Reason"], workSignals(state, actor).map((signal) => [signal.key, signal.reason])),
    `\n${rootId ? `Issue ${rootId}` : "Investigation"}:\n`, renderTree(state, rootId),
    "\nReplaced is not fixed. Read each replacement argument and its continuing issues. Agreement is not master acknowledgement.",
  ].join("\n")
}
export function renderReport(state: State): string {
  return [
    `# ${state.goal}\n`, `Investigators: ${state.investigators.join(", ")}. Scope: ${state.scope.mode}. Source: ${state.scope.source}\n`,
    `Checkout: ${state.checkout ? `${state.checkout.holder} — ${state.checkout.purpose}` : "free"} @${state.checkoutRev}\n`,
    "## Investigation\n", renderTree(state),
    "\n## Arguments and stops\n",
    table(["Issue", "Outcome", "Agreement", "Retained argument / note", "Master attention"], state.tasks.map((task) => [task.id, situation(state, task), agreement(state, task), argument(state, task), task.attention > task.acknowledged ? "unread change; inspect timeline before ack" : "acknowledged / no new stop"])),
    "\n## Retained records\n",
    table(["Record", "Kind", "Recorder", "Title", "Artifact"], state.records.map((record) => [`${record.id}@${record.rev}`, record.kind, record.by, record.title, record.path || "(inline; use show)"])),
    "\n## Executions\n",
    table(["Dispatch", "Rev", "Issue", "Parent", "Worker", "State", "Inspect"], state.dispatches.map((dispatch) => [dispatch.id, dispatch.rev, dispatch.task, dispatch.parent, dispatch.worker?.name, dispatch.state, dispatch.inspectAfter])),
    "\nThis is the recorded argument and agreement, not a machine proof of correctness. Summarize the original concerns, selected/rejected approaches, continuing work, impossible outcomes and user choices.",
  ].join("\n")
}
export function renderTimeline(events: readonly Moment[], chosen?: string): string {
  return table(["Sequence", "Time", "Actor", "Command", "Target", "Note"], events.filter((event) => !chosen || event.actor === chosen || event.row === chosen).map((event) => [event.sequence, event.at, event.actor, event.command, event.row, event.note]))
}
