// Attention is derived from decisions; no graph edge asserts engineering truth.
import { type Actor, type Dispatch, type State, type Task, type Wait } from "./protocol.ts"

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
/** Internal waits derive readiness from their resolver; no clearing mutation is needed. */
export function pendingWait(state: State, task: Task): Wait | null {
  if (task.wait?.kind === "checkout" && (!state.checkout || state.checkout.holder === task.owner)) return null
  return task.wait
}
export function eligibility(state: State, task: Task, actor: Actor): Eligibility {
  const blockers: string[] = []
  if (!Object.hasOwn(state.names, actor)) blockers.push(`unknown actor ${actor}`)
  if (task.owner !== actor) blockers.push(task.owner === null ? "task is unassigned; claim it first" : `task belongs to ${task.owner}`)
  if (task.conclusion) blockers.push(`task is ${task.conclusion.disposition}`)
  for (const id of task.dependsOn) if (!state.tasks.some((dependency) => dependency.id === id && dependency.conclusion)) blockers.push(`needs outcome from ${id}`)
  const wait = pendingWait(state, task)
  if (wait) blockers.push(`waiting on ${wait.kind}: ${wait.reason}`)
  if (state.scope.mode === "report-only" && task.permission !== "read") blockers.push("scope is report-only")
  if (activeDispatch(state, task.id)) blockers.push("active dispatch must be reconciled first")
  return { allowed: blockers.length === 0, blockers }
}
export interface WorkSignal { readonly key: string; readonly basis: string; readonly reason: string }
export function workSignals(state: State, actor: Actor): readonly WorkSignal[] {
  const signals: WorkSignal[] = []
  for (const task of state.tasks) {
    if (task.conclusion && state.investigators.includes(actor) && !task.conclusion.agreedBy.includes(actor)) {
      signals.push({ key: `agree:${task.id}`, basis: JSON.stringify([task.version, task.conclusion.record, task.conclusion.disposition, task.conclusion.children]), reason: "read the conclusion and evidence; agree, revise, or reopen" })
    }
    if (!task.conclusion && task.owner === actor && eligibility(state, task, actor).allowed) {
      signals.push({ key: `task:${task.id}`, basis: JSON.stringify([task.version, state.scope.rev, task.dependsOn.map((id) => [id, state.tasks.find((dependency) => dependency.id === id)?.version])]), reason: task.next })
    }
    if (!task.conclusion && task.owner === null && state.investigators.includes(actor) && eligibility(state, { ...task, owner: actor }, actor).allowed) {
      signals.push({ key: `claim:${task.id}`, basis: JSON.stringify([task.version, state.scope.rev, task.dependsOn.map((id) => [id, state.tasks.find((dependency) => dependency.id === id)?.version])]), reason: `claim before working: ${task.next}` })
    }
    if (actor !== "master") continue
    if (task.attention > task.acknowledged) signals.push({ key: `outcome:${task.id}`, basis: String(task.attention), reason: "read the retained outcome or blocker and acknowledge; update the user only for a new consequential result, decision, limitation or blocker; group related updates" })
    if (!task.conclusion && !activeDispatch(state, task.id)) {
      const authority = eligibility(state, task, task.owner ?? actor).blockers.filter((reason) => reason.startsWith("scope"))
      if (authority.length) signals.push({ key: `authority:${task.id}`, basis: JSON.stringify([task.version, state.scope.rev, authority]), reason: authority.join("; ") })
    }
  }
  if (actor === "master" && runComplete(state)) {
    signals.push({ key: "run-results-ready", basis: JSON.stringify(state.tasks.map((task) => [task.id, task.version, task.conclusion])), reason: "all conclusions and replacements have investigator agreement; report outcomes and limits, not inferred successful delivery" })
  }
  return signals
}
