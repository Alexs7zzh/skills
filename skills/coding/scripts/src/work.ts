// One eligibility query drives transition guards and runnable-work projections.
import { latestAssessment, recordCurrent, sameRefs, taskById, type Actor, type Dispatch, type State, type Task } from "./protocol.ts"

export function activeDispatch(state: State, taskId: string): Dispatch | undefined {
  return state.dispatches.find((dispatch) => dispatch.task === taskId && (dispatch.state === "reserved" || dispatch.state === "running"))
}
export function overdueDispatches(state: State, at: string): readonly Dispatch[] {
  return state.dispatches.filter((dispatch) => (dispatch.state === "reserved" || dispatch.state === "running") && Date.parse(dispatch.inspectAfter) <= Date.parse(at))
}
/** Historical completion remains recorded, but cannot silently satisfy current work. */
export function taskCurrent(state: State, task: Task, visited = new Set<string>()): string[] {
  const blockers: string[] = []
  if (visited.has(task.id)) return [`dependency cycle at ${task.id}`]
  const path = new Set(visited).add(task.id)
  const inputReasons = new Set([...task.inputs, ...task.review ? [task.review.subject] : []].flatMap((ref) => recordCurrent(state, ref)))
  for (const reason of inputReasons) blockers.push(`input ${reason}; reconcile ${task.id}`)
  if (task.result) {
    for (const reason of recordCurrent(state, task.result)) if (!inputReasons.has(reason)) blockers.push(`result ${reason}; reconcile ${task.id}`)
    if (task.review) {
      const latest = latestAssessment(state, task.review.subject.id)
      if (latest && !sameRefs([latest.record], [task.result])) blockers.push(`result assessment superseded by ${latest.record.id}@${latest.record.rev}; reconcile ${task.id}`)
    }
  }
  for (const ref of task.requires) {
    const dependency = taskById(state, ref.id)
    if (!dependency) { blockers.push(`missing prerequisite ${ref.id}`); continue }
    if (dependency.state === "cancelled") blockers.push(`prerequisite ${ref.id} cancelled; reconcile ${task.id}`)
    else if (dependency.version !== ref.version) blockers.push(`prerequisite ${ref.id} changed version; reconcile ${task.id}`)
    else if (dependency.state !== "done") blockers.push(`waiting for prerequisite ${ref.id}`)
    else if (taskCurrent(state, dependency, path).length) blockers.push(`prerequisite ${ref.id} has historical inputs or dependencies; reconcile ${task.id}`)
  }
  return blockers
}
export interface Eligibility { readonly allowed: boolean; readonly blockers: readonly string[] }
export function eligibility(state: State, task: Task, actor: Actor, action: "start" | "finish" | "dispatch"): Eligibility {
  const blockers: string[] = []
  if (!Object.hasOwn(state.names, actor)) blockers.push(`unknown actor ${actor}`)
  if (task.owner !== actor) blockers.push(task.owner === null ? "task is unassigned; claim it first" : `task belongs to ${task.owner}`)
  if (task.state !== "open") blockers.push(`task is ${task.state}`)
  if (task.wait) blockers.push(`waiting on ${task.wait.kind}: ${task.wait.reason}`)
  const current = taskCurrent(state, task)
  // A pinned review promises an assessment of these exact bytes, even if a newer
  // candidate arrives. Its result is retained and separately reported historical.
  blockers.push(...current.filter((reason) => !(task.review && reason.startsWith("input "))))
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
    if (task.state === "open" && task.owner === actor && eligibility(state, task, actor, task.started ? "finish" : "start").allowed) signals.push({ key: `task:${task.id}`, basis: JSON.stringify([task.version, state.scope.rev]), reason: task.next })
    const reasons = taskCurrent(state, task).filter((reason) => !reason.startsWith("waiting for prerequisite"))
    if (task.state === "open" && reasons.length && (actor === "master" || actor === task.owner) && !activeDispatch(state, task.id)) signals.push({ key: `reconcile:${task.id}`, basis: JSON.stringify([task.version, reasons]), reason: reasons.join("; ") })
    if (actor === "master") {
      if (task.state === "open" && task.owner === null) signals.push({ key: `unassigned:${task.id}`, basis: String(task.version), reason: "assign or explicitly cancel this commitment" })
      if (task.state === "open" && !activeDispatch(state, task.id)) {
        if (task.wait) signals.push({ key: `wait:${task.id}`, basis: JSON.stringify([task.version, task.wait]), reason: `waiting on ${task.wait.kind}: ${task.wait.reason}` })
        const authority = eligibility(state, task, task.owner ?? actor, "finish").blockers.filter((reason) => reason.startsWith("scope") || reason.startsWith("explicit current"))
        if (authority.length) signals.push({ key: `authority:${task.id}`, basis: JSON.stringify([task.version, state.scope.rev, authority]), reason: authority.join("; ") })
      }
    }
  }
  const checkout = state.checkout
  if (actor === "master" && checkout && !state.tasks.some((task) => task.state === "open" && task.owner === checkout.holder)) {
    signals.push({ key: "checkout", basis: String(state.checkoutRev), reason: `checkout still held by ${checkout.holder} with no unfinished assigned task; inspect with the holder, who must release it, or retain evidence for explicit recovery` })
  }
  if (actor === "master" && state.tasks.length && state.tasks.every((task) => task.state !== "open") && !checkout && !state.dispatches.some((dispatch) => dispatch.state === "reserved" || dispatch.state === "running")) {
    signals.push({ key: "run-results-ready", basis: JSON.stringify(state.tasks.map((task) => [task.id, task.version, task.state, task.result, task.reason])), reason: "all explicit tasks have delivered results or cancellation reasons; inspect the retained results and report their evidence and limits" })
  }
  return signals
}
