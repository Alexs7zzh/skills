// Explicit commitments and retained evidence. No command executes project work.
import { createHash } from "node:crypto"
import { activeDispatch, eligibility, taskCurrent } from "./work.ts"

export const SCHEMA = 10
export type Actor = string
export type ScopeMode = "report-only" | "fix" | "check-in"
export type Permission = "read" | "write" | "check-in"
export interface RecordRef { readonly id: string; readonly rev: number }
/** Version tracks the promised result; task rev also changes for notes and ownership. */
export interface TaskDependency { readonly id: string; readonly version: number }
export interface Wait { readonly kind: "user" | "external"; readonly reason: string }
export interface Assessment { readonly subject: RecordRef; readonly verdict: "clean" | "conditions"; readonly conditions: string; readonly dispatch?: string }
export interface ArtifactRecord extends RecordRef {
  readonly kind: string
  readonly title: string
  readonly content: string
  readonly path: string
  readonly digest: string
  readonly authors: readonly Actor[]
  readonly inputs: readonly RecordRef[]
  readonly assessment: Assessment | null
  readonly by: Actor
  readonly at: string
  readonly sequence: number
}
export interface Task {
  readonly id: string
  readonly rev: number
  readonly version: number
  readonly title: string
  readonly outcome: string
  readonly owner: Actor | null
  readonly state: "open" | "done" | "cancelled"
  readonly started: boolean
  readonly note: string
  readonly next: string
  readonly permission: Permission
  readonly inputs: readonly RecordRef[]
  readonly requires: readonly TaskDependency[]
  readonly wait: Wait | null
  readonly review: { readonly subject: RecordRef } | null
  readonly result: RecordRef | null
  readonly reason: string
  readonly created: string
  readonly updated: string
}
export interface WorkerIdentity { readonly name: string; readonly pane: string; readonly session: string | null }
export interface Dispatch {
  readonly id: string
  readonly rev: number
  readonly task: string
  readonly taskVersion: number
  readonly inputs: readonly RecordRef[]
  readonly subject: RecordRef | null
  readonly parent: Actor
  readonly worker: WorkerIdentity | null
  readonly state: "reserved" | "running" | "finished" | "stopped"
  readonly inspectAfter: string
  readonly observations: readonly { readonly at: string; readonly by: Actor; readonly detail: string }[]
  readonly created: string
  readonly updated: string
}
export interface Scope { readonly mode: ScopeMode; readonly rev: number; readonly source: string; readonly by: Actor; readonly at: string }
export interface Authorization { readonly task: string; readonly version: number; readonly inputs: readonly RecordRef[]; readonly scopeRev: number; readonly executor: Actor; readonly source: string; readonly by: Actor; readonly at: string }
export interface State {
  readonly schema: typeof SCHEMA
  readonly revision: number
  readonly goal: string
  readonly names: Readonly<Record<Actor, string>>
  readonly scope: Scope
  readonly tasks: readonly Task[]
  readonly records: readonly ArtifactRecord[]
  readonly dispatches: readonly Dispatch[]
  readonly checkout: { readonly holder: Actor; readonly purpose: string; readonly since: string; readonly rev: number } | null
  readonly checkoutRev: number
  readonly authorizations: readonly Authorization[]
}

export function initialState(options: { goal: string; names: Readonly<Record<Actor, string>>; scope: ScopeMode; source: string; at?: string }): State {
  nonempty(options.goal, "goal"); nonempty(options.source, "scope source")
  if (!Object.hasOwn(options.names, "master") || !options.names.master) refuse("names must include master")
  for (const [actor, name] of Object.entries(options.names)) {
    nonempty(actor, "actor"); nonempty(name, "worker name")
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(actor) || actor in Object.prototype) refuse(`unsafe actor id ${actor}`)
  }
  if (new Set(Object.values(options.names)).size !== Object.keys(options.names).length) refuse("worker names must be unique")
  oneOf(options.scope, ["report-only", "fix", "check-in"], "scope")
  return { schema: SCHEMA, revision: 0, goal: options.goal, names: { ...options.names }, scope: { mode: options.scope, rev: 1, source: options.source, by: "master", at: options.at ?? new Date().toISOString() }, tasks: [], records: [], dispatches: [], checkout: null, checkoutRev: 0, authorizations: [] }
}

interface Envelope<T extends string> { readonly type: T; readonly actor: Actor; readonly at: string }
interface Target { readonly id: string; readonly rev: number }
export interface TaskFields {
  readonly title: string
  readonly outcome: string
  readonly next: string
  readonly note?: string
  readonly permission?: Permission
  readonly inputs?: readonly RecordRef[]
  readonly requires?: readonly TaskDependency[]
  readonly wait?: Wait | null
  readonly review?: { readonly subject: RecordRef } | null
}
export type Command =
  | (Envelope<"task.add"> & TaskFields & { readonly id: string; readonly owner?: Actor | null })
  | (Envelope<"task.set"> & Target & Partial<TaskFields> & { readonly reason?: string; readonly resolution?: RecordRef })
  | (Envelope<"task.claim"> & Target & { readonly owner?: Actor })
  | (Envelope<"task.release"> & Target & { readonly note: string; readonly next: string })
  | (Envelope<"task.start"> & Target)
  | (Envelope<"task.finish"> & Target & { readonly result: RecordRef })
  | (Envelope<"task.cancel" | "task.reopen"> & Target & { readonly reason: string; readonly next?: string })
  | (Envelope<"record.save"> & Target & { readonly kind: string; readonly title: string; readonly content: string; readonly path?: string; readonly authors?: readonly Actor[]; readonly inputs?: readonly RecordRef[]; readonly assessment?: Assessment | null })
  | (Envelope<"checkout.take"> & { readonly rev: number; readonly purpose: string })
  | (Envelope<"checkout.release"> & { readonly rev: number; readonly reason: string })
  | (Envelope<"checkout.recover"> & { readonly rev: number; readonly stopped: string; readonly preserved: string })
  | (Envelope<"dispatch.reserve"> & { readonly id: string; readonly task: string; readonly taskRev: number; readonly inspectAfter: string })
  | (Envelope<"dispatch.update"> & Target & { readonly state: Dispatch["state"]; readonly worker?: WorkerIdentity; readonly inspectAfter?: string; readonly observation: string })
  | (Envelope<"scope.set"> & { readonly rev: number; readonly mode: ScopeMode; readonly source: string })
  | (Envelope<"scope.authorize"> & { readonly id: string; readonly rev: number; readonly scopeRev: number; readonly executor: Actor; readonly inputs: readonly RecordRef[]; readonly source: string })
export type CommandType = Command["type"]
export interface Event { readonly at: string; readonly actor: Actor; readonly command: CommandType | "init"; readonly row: string; readonly note: string; readonly data?: Command }
export interface Moment extends Event { readonly sequence: number; readonly revision: number }
export type Result = { readonly ok: true; readonly state: State; readonly events: readonly Event[] } | { readonly ok: false; readonly error: string }
export class Refused extends Error {}
function refuse(message: string): never { throw new Refused(message) }
function nonempty(value: string, label: string): void { if (typeof value !== "string" || !value.trim()) refuse(`${label} must be nonempty`) }
function oneOf(value: string, values: readonly string[], label: string): void { if (!values.includes(value)) refuse(`invalid ${label}: ${value}`) }
function revision(actual: number, expected: number, label: string): void { if (!Number.isInteger(expected) || actual !== expected) refuse(`${label} is at rev ${actual}; you read rev ${expected}`) }
function knownActor(state: State, actor: Actor): void { if (!Object.hasOwn(state.names, actor)) refuse(`unknown actor ${actor}`) }
function master(actor: Actor): void { if (actor !== "master") refuse("only master records user authority or recovery") }
function owner(task: Task, actor: Actor): void { if (task.owner !== actor && actor !== "master") refuse(`${task.id} belongs to ${task.owner ?? "no one"}`) }
export function taskById(state: State, id: string): Task | undefined { return state.tasks.find((task) => task.id === id) }
export function recordByRef(state: State, ref: RecordRef): ArtifactRecord | undefined { return state.records.find((record) => record.id === ref.id && record.rev === ref.rev) }
export function latestRecord(state: State, id: string): ArtifactRecord | undefined { return state.records.filter((record) => record.id === id).at(-1) }
export function sameRefs(a: readonly RecordRef[], b: readonly RecordRef[]): boolean {
  const keys = (refs: readonly RecordRef[]) => refs.map((ref) => `${ref.id}@${ref.rev}`).sort()
  return JSON.stringify(keys(a)) === JSON.stringify(keys(b))
}
function checkRefs(state: State, refs: readonly RecordRef[]): void {
  if (new Set(refs.map((ref) => ref.id)).size !== refs.length) refuse("input ids must be unique")
  for (const ref of refs) if (!recordByRef(state, ref)) refuse(`missing record ${ref.id}@${ref.rev}`)
}
function getTask(state: State, target: Target): Task {
  const task = taskById(state, target.id)
  if (!task) refuse(`missing task ${target.id}`)
  revision(task.rev, target.rev, task.id)
  return task
}
function checkTask(state: State, task: Task, checkDependencyVersions = true): void {
  nonempty(task.title, "title"); nonempty(task.outcome, "outcome"); nonempty(task.next, "next action")
  oneOf(task.permission, ["read", "write", "check-in"], "permission")
  if (task.owner !== null) knownActor(state, task.owner)
  checkRefs(state, task.inputs)
  if (task.review) {
    checkRefs(state, [task.review.subject])
    if (task.permission !== "read") refuse("a review task must have read permission; assign source edits or check-in separately")
  }
  if (task.wait) { oneOf(task.wait.kind, ["user", "external"], "wait kind"); nonempty(task.wait.reason, "wait reason") }
  if (new Set(task.requires.map((ref) => ref.id)).size !== task.requires.length) refuse("dependency ids must be unique")
  for (const dependency of task.requires) {
    const prerequisite = taskById(state, dependency.id)
    if (!prerequisite) refuse(`missing prerequisite ${dependency.id}`)
    if (checkDependencyVersions && dependency.version !== prerequisite.version) refuse(`${dependency.id} is at version ${prerequisite.version}; reconcile the dependency`)
    const visit = (id: string, seen: Set<string>): boolean => {
      if (id === task.id) return true
      if (seen.has(id)) return false
      seen.add(id)
      return (taskById(state, id)?.requires ?? []).some((ref) => visit(ref.id, seen))
    }
    if (visit(dependency.id, new Set())) refuse(`dependency cycle through ${dependency.id}`)
  }
}
function updateTask(state: State, task: Task): State { return { ...state, tasks: state.tasks.map((old) => old.id === task.id ? task : old) } }
function idleTask(state: State, task: Task): void { if (activeDispatch(state, task.id)) refuse(`${task.id} has an active dispatch; reconcile it first`) }
function guard(state: State, task: Task, actor: Actor, action: "start" | "finish" | "dispatch"): void {
  const result = eligibility(state, task, actor, action)
  if (!result.allowed) refuse(result.blockers.join("; "))
}

/** Pure, atomic transition: failed commands return no state or events. */
export function transition(before: State, command: Command): Result {
  try {
    if (before.schema !== SCHEMA) refuse(`schema ${before.schema} requires its pinned helper`)
    knownActor(before, command.actor); nonempty(command.at, "timestamp")
    let state = before
    const row = "id" in command ? command.id : ""
    let note = ""
    const actor = command.actor, at = command.at
    switch (command.type) {
      case "task.add": {
        nonempty(command.id, "task id")
        if (taskById(state, command.id)) refuse(`task ${command.id} already exists`)
        const task: Task = { id: command.id, rev: 1, version: 1, title: command.title, outcome: command.outcome, owner: command.owner === undefined ? actor : command.owner, state: "open", started: false, note: command.note ?? "", next: command.next, permission: command.permission ?? "read", inputs: command.inputs ?? [], requires: command.requires ?? [], wait: command.wait ?? null, review: command.review ?? null, result: null, reason: "", created: at, updated: at }
        if (task.owner !== actor && task.owner !== null) master(actor)
        checkTask(state, task)
        state = { ...state, tasks: [...state.tasks, task] }; note = task.outcome
        break
      }
      case "task.set": {
        const task = getTask(state, command); owner(task, actor)
        const resolvesUserWait = task.wait?.kind === "user" && command.wait !== undefined && command.wait?.kind !== "user"
        let inputs = command.inputs ?? task.inputs
        if (resolvesUserWait) {
          master(actor)
          const resolution = command.resolution
          if (!resolution || typeof resolution !== "object" || typeof resolution.id !== "string" || !Number.isSafeInteger(resolution.rev) || resolution.rev < 1) refuse("resolution must name an exact retained ruling record reference")
          const ruling = recordByRef(state, resolution)
          if (!ruling) refuse(`missing ruling ${resolution.id}@${resolution.rev}`)
          if (ruling.kind !== "ruling" || ruling.by !== "master") refuse("resolution must reference a ruling recorded by master")
          if (recordCurrent(state, resolution).length) refuse("resolution ruling is historical; retain and reference the current ruling")
          inputs = [...inputs.filter((ref) => ref.id !== resolution.id), resolution]
        } else if (command.resolution !== undefined) refuse("resolution applies only when resolving an existing user wait")
        const material = resolvesUserWait || ["outcome", "permission", "inputs", "requires", "review"].some((key) => Object.hasOwn(command, key) && JSON.stringify(command[key as keyof typeof command]) !== JSON.stringify(task[key as keyof Task]))
        if (material) { idleTask(state, task); if (task.state !== "open") refuse("reopen a terminal task before changing its promised result"); if (!resolvesUserWait) nonempty(command.reason ?? "", "reconciliation reason") }
        const next: Task = { ...task, rev: task.rev + 1, version: task.version + Number(material), updated: at, title: command.title ?? task.title, outcome: command.outcome ?? task.outcome, note: command.note ?? task.note, next: command.next ?? task.next, permission: command.permission ?? task.permission, inputs, requires: command.requires ?? task.requires, wait: command.wait === undefined ? task.wait : command.wait, review: command.review === undefined ? task.review : command.review, started: material ? false : task.started }
        checkTask(state, next, command.requires !== undefined); state = updateTask(state, next); note = command.resolution ? `user ruling ${command.resolution.id}@${command.resolution.rev}` : command.reason ?? next.note
        break
      }
      case "task.claim": {
        const task = getTask(state, command); idleTask(state, task)
        if (task.state !== "open") refuse("only open tasks can be claimed")
        const claimant = command.owner ?? actor; knownActor(state, claimant)
        if (claimant !== actor || task.owner !== null && task.owner !== actor) master(actor)
        state = updateTask(state, { ...task, owner: claimant, rev: task.rev + 1, updated: at }); note = `assigned to ${claimant}`
        break
      }
      case "task.release": {
        const task = getTask(state, command); owner(task, actor); idleTask(state, task)
        if (task.state !== "open") refuse("only open tasks can be released")
        nonempty(command.note, "handoff note"); nonempty(command.next, "next action")
        state = updateTask(state, { ...task, owner: null, note: command.note, next: command.next, rev: task.rev + 1, updated: at }); note = command.note
        break
      }
      case "task.start": {
        const task = getTask(state, command); guard(state, task, actor, "start")
        state = updateTask(state, { ...task, started: true, rev: task.rev + 1, updated: at }); note = task.next
        break
      }
      case "task.finish": {
        const task = getTask(state, command); guard(state, task, actor, "finish"); checkRefs(state, [command.result])
        const result = recordByRef(state, command.result)!
        if (!sameRefs(result.inputs, task.inputs)) refuse("result inputs must exactly match the task's promised inputs")
        if (!task.review && recordCurrent(state, command.result).length) refuse("result has historical inputs or was superseded; retain a current result")
        if (task.review) {
          const assessment = result.assessment
          if (!assessment || !sameRefs([assessment.subject], [task.review.subject]) || !sameRefs(result.inputs, task.inputs)) refuse("review result must assess the pinned subject and exact task inputs")
          if (assessment.dispatch) {
            const dispatch = state.dispatches.find((item) => item.id === assessment.dispatch)
            if (!dispatch || dispatch.task !== task.id || dispatch.taskVersion !== task.version || dispatch.state !== "finished") refuse("review result must come from this task version's finished dispatch")
          } else if (result.by !== actor) refuse("direct review result must be attributable to the finishing actor")
        }
        state = updateTask(state, { ...task, state: "done", result: command.result, rev: task.rev + 1, updated: at }); note = `delivered ${result.id}@${result.rev}`
        break
      }
      case "task.cancel": {
        const task = getTask(state, command); owner(task, actor); idleTask(state, task); nonempty(command.reason, "cancellation reason")
        if (task.state === "cancelled") refuse("task is already cancelled")
        state = updateTask(state, { ...task, state: "cancelled", reason: command.reason, version: task.version + 1, rev: task.rev + 1, updated: at }); note = command.reason
        break
      }
      case "task.reopen": {
        const task = getTask(state, command); owner(task, actor); idleTask(state, task); nonempty(command.reason, "reopening reason")
        if (task.state === "open") refuse("task is already open")
        nonempty(command.next ?? task.next, "next action")
        state = updateTask(state, { ...task, state: "open", started: false, result: null, next: command.next ?? task.next, reason: command.reason, version: task.version + 1, rev: task.rev + 1, updated: at }); note = command.reason
        break
      }
      case "record.save": {
        nonempty(command.id, "record id"); nonempty(command.kind, "record kind"); nonempty(command.title, "record title"); nonempty(command.content, "record content")
        const previous = latestRecord(state, command.id); revision(previous?.rev ?? 0, command.rev, command.id)
        const inputs = command.inputs ?? []; checkRefs(state, inputs)
        const assessment = command.assessment ?? null
        let assessor = actor
        if (assessment?.dispatch) {
          const dispatch = state.dispatches.find((item) => item.id === assessment.dispatch)
          if (!dispatch || dispatch.state !== "finished" || !dispatch.worker) refuse("delegated assessment needs a finished dispatch with actual worker identity")
          if (actor !== dispatch.parent && actor !== "master") refuse("only the dispatch parent or master can retain its assessment")
          if (!dispatch.subject || !sameRefs([dispatch.subject], [assessment.subject]) || !sameRefs(dispatch.inputs, inputs)) refuse("delegated assessment must cover the dispatch's pinned subject and inputs")
          assessor = dispatch.worker.name
        }
        const authors = [...new Set([assessor, ...assessment ? [] : previous?.authors ?? [], ...command.authors ?? []])]
        for (const author of command.authors ?? []) knownActor(state, author)
        if (assessment) {
          checkRefs(state, [assessment.subject]); oneOf(assessment.verdict, ["clean", "conditions"], "assessment verdict")
          const subject = recordByRef(state, assessment.subject)!
          const identity = (author: string) => state.names[author] ?? author
          if (subject.authors.some((author) => authors.some((assessor) => identity(author) === identity(assessor)))) refuse("assessment must be independent of the subject's authors")
          if (assessment.verdict === "conditions") nonempty(assessment.conditions, "assessment conditions")
          if (assessment.verdict === "clean" && assessment.conditions.trim()) refuse("clean assessment cannot carry unresolved conditions")
          if (previous?.assessment && previous.by !== actor) refuse("another assessor must use a separate record id")
        }
        const record: ArtifactRecord = { id: command.id, rev: command.rev + 1, kind: command.kind, title: command.title, content: command.content, path: command.path ?? "", digest: createHash("sha256").update(command.content).digest("hex"), authors, inputs, assessment, by: actor, at, sequence: state.revision + 1 }
        state = { ...state, records: [...state.records, record] }; note = `${record.kind}: ${record.title}`
        break
      }
      case "checkout.take": {
        revision(state.checkoutRev, command.rev, "checkout"); nonempty(command.purpose, "checkout purpose")
        if (state.scope.mode === "report-only") refuse("report-only scope does not permit shared source edits")
        if (state.checkout) refuse(`checkout held by ${state.checkout.holder}; explicit release or recovery required`)
        state = { ...state, checkoutRev: state.checkoutRev + 1, checkout: { holder: actor, purpose: command.purpose, since: at, rev: state.checkoutRev + 1 } }; note = command.purpose
        break
      }
      case "checkout.release": {
        revision(state.checkoutRev, command.rev, "checkout"); nonempty(command.reason, "release reason")
        if (!state.checkout || state.checkout.holder !== actor) refuse("only the checkout holder can release; master must use recovery")
        state = { ...state, checkout: null, checkoutRev: state.checkoutRev + 1 }; note = command.reason
        break
      }
      case "checkout.recover": {
        master(actor); revision(state.checkoutRev, command.rev, "checkout")
        if (!state.checkout) refuse("checkout has no holder")
        nonempty(command.stopped, "evidence old writer stopped"); nonempty(command.preserved, "evidence work preserved")
        state = { ...state, checkout: null, checkoutRev: state.checkoutRev + 1 }; note = `writer stopped: ${command.stopped}; work preserved: ${command.preserved}`
        break
      }
      case "dispatch.reserve": {
        nonempty(command.id, "dispatch id"); if (state.dispatches.some((item) => item.id === command.id)) refuse("dispatch id already exists")
        const task = getTask(state, { id: command.task, rev: command.taskRev })
        if (task.owner !== actor) refuse("only the task owner can reserve its execution")
        guard(state, task, actor, "dispatch"); timestamp(command.inspectAfter)
        const dispatch: Dispatch = { id: command.id, rev: 1, task: task.id, taskVersion: task.version, inputs: task.inputs, subject: task.review?.subject ?? null, parent: actor, worker: null, state: "reserved", inspectAfter: command.inspectAfter, observations: [], created: at, updated: at }
        state = { ...state, dispatches: [...state.dispatches, dispatch] }; note = `reserved ${task.id} for ${actor}`
        break
      }
      case "dispatch.update": {
        const dispatch = state.dispatches.find((item) => item.id === command.id)
        if (!dispatch) refuse(`missing dispatch ${command.id}`)
        revision(dispatch.rev, command.rev, dispatch.id)
        if (actor !== dispatch.parent && actor !== "master") refuse("only dispatch parent or master can reconcile execution")
        nonempty(command.observation, "retained observation")
        oneOf(command.state, ["reserved", "running", "finished", "stopped"], "dispatch state")
        const allowed: Record<Dispatch["state"], readonly Dispatch["state"][]> = { reserved: ["reserved", "running", "finished", "stopped"], running: ["running", "finished", "stopped"], finished: [], stopped: [] }
        if (!allowed[dispatch.state].includes(command.state)) refuse(`cannot move ${dispatch.state} dispatch to ${command.state}`)
        const worker = command.worker ?? dispatch.worker
        if (worker) { nonempty(worker.name, "worker name"); nonempty(worker.pane, "worker pane"); if (worker.session !== null) nonempty(worker.session, "worker session") }
        if (dispatch.worker && command.worker && JSON.stringify(dispatch.worker) !== JSON.stringify(command.worker)) refuse("worker identity cannot change; reconcile this dispatch and reserve another")
        if (command.state === "running" && !worker) refuse("running execution needs its actual worker identity")
        if (command.inspectAfter) timestamp(command.inspectAfter)
        const next: Dispatch = { ...dispatch, rev: dispatch.rev + 1, worker, state: command.state, inspectAfter: command.inspectAfter ?? dispatch.inspectAfter, observations: [...dispatch.observations, { at, by: actor, detail: command.observation }], updated: at }
        state = { ...state, dispatches: state.dispatches.map((item) => item.id === next.id ? next : item) }; note = command.observation
        break
      }
      case "scope.set": {
        master(actor); revision(state.scope.rev, command.rev, "scope"); oneOf(command.mode, ["report-only", "fix", "check-in"], "scope"); nonempty(command.source, "human instruction source")
        state = { ...state, scope: { mode: command.mode, rev: state.scope.rev + 1, source: command.source, by: actor, at } }; note = command.source
        break
      }
      case "scope.authorize": {
        master(actor); revision(state.scope.rev, command.scopeRev, "scope")
        const task = getTask(state, command); knownActor(state, command.executor)
        if (state.scope.mode !== "check-in" || task.permission !== "check-in") refuse("check-in authorization requires check-in scope and task permission")
        if (task.state !== "open") refuse("authorize an open task")
        checkRefs(state, command.inputs); if (!sameRefs(command.inputs, task.inputs)) refuse("authorization inputs must exactly match task inputs")
        nonempty(command.source, "explicit human authorization source")
        state = { ...state, authorizations: [...state.authorizations, { task: task.id, version: task.version, inputs: command.inputs, scopeRev: state.scope.rev, executor: command.executor, source: command.source, by: actor, at }] }; note = command.source
        break
      }
      default: refuse(`unknown command ${(command as { type: string }).type}`)
    }
    state = { ...state, revision: before.revision + 1 }
    return { ok: true, state, events: [{ at, actor, command: command.type, row, note, data: structuredClone(command) }] }
  } catch (error) {
    if (error instanceof Refused) return { ok: false, error: error.message }
    throw error
  }
}
function timestamp(value: string): void { if (!value || !Number.isFinite(Date.parse(value))) refuse("inspection time must be a timestamp") }

/** Latest means latest assertion, not latest assertion whose verdict is convenient. */
export function latestAssessment(state: State, subjectId: string): { record: ArtifactRecord; applicable: boolean; reasons: readonly string[] } | null {
  const record = state.records.filter((item) => item.assessment?.subject.id === subjectId).at(-1)
  if (!record?.assessment) return null
  const reasons: string[] = []
  for (const ref of [record.assessment.subject, ...record.inputs]) reasons.push(...recordCurrent(state, ref))
  return { record, applicable: reasons.length === 0, reasons: [...new Set(reasons)] }
}
/** Declared evidence dependencies remain material even when the outer record is unchanged. */
export function recordCurrent(state: State, ref: RecordRef, visited = new Set<string>()): string[] {
  const key = `${ref.id}@${ref.rev}`
  if (visited.has(key)) return []
  const path = new Set(visited).add(key)
  const record = recordByRef(state, ref)
  if (!record) return [`missing record ${key}`]
  const reasons = latestRecord(state, ref.id)?.rev === ref.rev ? [] : [`${key} is historical`]
  for (const input of [...record.inputs, ...record.assessment ? [record.assessment.subject] : []]) reasons.push(...recordCurrent(state, input, path))
  return [...new Set(reasons)]
}
export function completedResultCurrent(state: State, task: Task): boolean { return task.state === "done" && taskCurrent(state, task).length === 0 }
