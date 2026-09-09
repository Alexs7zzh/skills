// Attention is derived from decisions; no graph edge asserts engineering truth.
import { sameRefs, type Actor, type Dispatch, type State, type Task, type Wait } from "./protocol.ts"

export function activeDispatch(state: State, taskId: string): Dispatch | undefined {
  return state.dispatches.find((dispatch) => dispatch.task === taskId && (dispatch.state === "reserved" || dispatch.state === "running"))
}
export function overdueDispatches(state: State, at: string): readonly Dispatch[] {
  return state.dispatches.filter((dispatch) => (dispatch.state === "reserved" || dispatch.state === "running") && Date.parse(dispatch.inspectAfter) <= Date.parse(at))
}
export function agreed(state: State, task: Task): boolean {
  return !!task.conclusion && state.investigators.every((actor) => task.conclusion!.agreedBy.includes(actor))
}
export function runComplete(state: State): boolean {
  return state.tasks.length > 0 && state.tasks.every((task) => agreed(state, task)) && !state.checkout && !state.dispatches.some((dispatch) => dispatch.state === "reserved" || dispatch.state === "running")
}
export interface Eligibility { readonly allowed: boolean; readonly blockers: readonly string[] }
/** Checkout availability is an observed condition, not a second state to clear on release. */
export function pendingWait(state: State, task: Task): Wait | null {
  if (task.wait?.kind === "checkout" && (!state.checkout || state.checkout.holder === task.owner)) return null
  return task.wait
}
export function eligibility(state: State, task: Task, actor: Actor, action: "start" | "dispatch"): Eligibility {
  const blockers: string[] = []
  if (!Object.hasOwn(state.names, actor)) blockers.push(`unknown actor ${actor}`)
  if (task.owner !== actor) blockers.push(task.owner === null ? "task is unassigned; claim it first" : `task belongs to ${task.owner}`)
  if (task.state !== "open") blockers.push(`task is ${task.state}`)
  const wait = pendingWait(state, task)
  if (wait) blockers.push(`waiting on ${wait.kind}: ${wait.reason}`)
  if (state.scope.mode === "report-only" && task.permission !== "read") blockers.push("scope is report-only")
  if (task.permission === "check-in") {
    if (state.scope.mode !== "check-in") blockers.push("scope does not permit check-in")
    const authorization = [...state.authorizations].reverse().find((entry) => entry.task === task.id)
    if (!authorization || authorization.scopeRev !== state.scope.rev || authorization.version !== task.version || authorization.executor !== actor || !sameRefs(authorization.inputs, task.inputs)) blockers.push("explicit current check-in authorization required")
  }
  if (activeDispatch(state, task.id)) blockers.push("active dispatch must be reconciled first")
  if (action === "start" && task.started) blockers.push("task already started")
  return { allowed: blockers.length === 0, blockers }
}
export interface WorkSignal { readonly key: string; readonly basis: string; readonly reason: string }
export function workSignals(state: State, actor: Actor): readonly WorkSignal[] {
  const signals: WorkSignal[] = []
  for (const task of state.tasks) {
    if (task.conclusion && state.investigators.includes(actor) && !task.conclusion.agreedBy.includes(actor)) {
      signals.push({ key: `agree:${task.id}`, basis: JSON.stringify([task.version, task.conclusion.record, task.conclusion.disposition, task.conclusion.children]), reason: "read the conclusion and evidence; agree, revise, or reopen" })
    }
    if (task.state === "open" && task.owner === actor && eligibility(state, task, actor, "dispatch").allowed) {
      signals.push({ key: `task:${task.id}`, basis: JSON.stringify([task.version, state.scope.rev]), reason: task.next })
    }
    if (actor !== "master") continue
    if (task.attention > task.acknowledged) signals.push({ key: `outcome:${task.id}`, basis: String(task.attention), reason: "read the retained outcome or blocker, summarize consequential changes, then acknowledge" })
    if (task.state === "open" && task.owner === null) signals.push({ key: `unassigned:${task.id}`, basis: String(task.version), reason: "assign this continuing investigation" })
    if (task.state === "open" && !activeDispatch(state, task.id)) {
      const authority = eligibility(state, task, task.owner ?? actor, "dispatch").blockers.filter((reason) => reason.startsWith("scope") || reason.startsWith("explicit current"))
      if (authority.length) signals.push({ key: `authority:${task.id}`, basis: JSON.stringify([task.version, state.scope.rev, authority]), reason: authority.join("; ") })
    }
  }
  if (actor === "master" && runComplete(state)) {
    signals.push({ key: "run-results-ready", basis: JSON.stringify(state.tasks.map((task) => [task.id, task.version, task.conclusion])), reason: "all conclusions and replacements have investigator agreement; report outcomes and limits, not inferred successful delivery" })
  }
  return signals
}
