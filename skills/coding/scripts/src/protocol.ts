// Explicit commitments and retained evidence. No command executes project work.
import { createHash } from "node:crypto"
import { activeDispatch, eligibility, pendingWait } from "./work.ts"

export const SCHEMA = 12
export type Actor = string
export type ScopeMode = "report-only" | "fix" | "check-in"
export type Permission = "read" | "write" | "check-in"
export interface RecordRef { readonly id: string; readonly rev: number }
export interface Wait { readonly kind: "user" | "external" | "checkout"; readonly reason: string }
export type Disposition = "done" | "stopped" | "cancelled" | "replaced"
export interface Conclusion { readonly record: RecordRef; readonly disposition: Disposition; readonly children: readonly string[]; readonly author: Actor; readonly agreedBy: readonly Actor[] }
export interface ArtifactRecord extends RecordRef {
  readonly kind: string
  readonly title: string
  readonly content: string
  readonly path: string
  readonly digest: string
  readonly authors: readonly Actor[]
  readonly inputs: readonly RecordRef[]
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
  readonly state: "open" | Disposition
  readonly started: boolean
  readonly note: string
  readonly next: string
  readonly permission: Permission
  readonly inputs: readonly RecordRef[]
  readonly wait: Wait | null
  readonly conclusion: Conclusion | null
  readonly attention: number
  readonly acknowledged: number
  readonly created: string
  readonly updated: string
}
export interface WorkerIdentity { readonly name: string; readonly pane: string | null; readonly session: string | null }
export interface Dispatch {
  readonly id: string
  readonly rev: number
  readonly task: string
  readonly taskVersion: number
  readonly inputs: readonly RecordRef[]
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
  readonly investigators: readonly Actor[]
  readonly scope: Scope
  readonly tasks: readonly Task[]
  readonly records: readonly ArtifactRecord[]
  readonly dispatches: readonly Dispatch[]
  readonly checkout: { readonly holder: Actor; readonly purpose: string; readonly since: string; readonly rev: number } | null
  readonly checkoutRev: number
  readonly authorizations: readonly Authorization[]
}

export function initialState(options: { goal: string; names: Readonly<Record<Actor, string>>; investigators?: readonly Actor[]; scope: ScopeMode; source: string; at?: string }): State {
  nonempty(options.goal, "goal"); nonempty(options.source, "scope source")
  if (!Object.hasOwn(options.names, "master") || !options.names.master) refuse("names must include master")
  for (const [actor, name] of Object.entries(options.names)) {
    nonempty(actor, "actor"); nonempty(name, "worker name")
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(actor) || actor in Object.prototype) refuse(`unsafe actor id ${actor}`)
  }
  if (new Set(Object.values(options.names)).size !== Object.keys(options.names).length) refuse("worker names must be unique")
  const peers = Object.keys(options.names).filter((actor) => actor !== "master")
  const investigators = options.investigators ?? (peers.length ? peers : ["master"])
  if (investigators.length < 1 || investigators.length > 2 || new Set(investigators).size !== investigators.length) refuse("name one local investigator or two equal investigators")
  for (const actor of investigators) if (!Object.hasOwn(options.names, actor)) refuse(`unknown investigator ${actor}`)
  if (investigators.length === 2 && investigators.includes("master")) refuse("master cannot substitute for a peer in a joint run")
  if (peers.length && (investigators.length !== peers.length || peers.some((peer) => !investigators.includes(peer)))) refuse("every named peer must be an investigator; omit auxiliary child identities from names")
  oneOf(options.scope, ["report-only", "fix", "check-in"], "scope")
  return { schema: SCHEMA, revision: 0, goal: options.goal, names: { ...options.names }, investigators: [...investigators], scope: { mode: options.scope, rev: 1, source: options.source, by: "master", at: options.at ?? new Date().toISOString() }, tasks: [], records: [], dispatches: [], checkout: null, checkoutRev: 0, authorizations: [] }
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
  readonly wait?: Wait | null
}
export type Command =
  | (Envelope<"task.add"> & TaskFields & { readonly id: string; readonly owner?: Actor | null })
  | (Envelope<"task.set"> & Target & Partial<TaskFields> & { readonly reason?: string; readonly resolution?: RecordRef })
  | (Envelope<"task.claim"> & Target & { readonly owner?: Actor })
  | (Envelope<"task.release"> & Target & { readonly note: string; readonly next: string })
  | (Envelope<"task.start"> & Target)
  | (Envelope<"task.publish"> & Target & { readonly result: RecordRef; readonly disposition: Disposition; readonly children?: readonly string[] })
  | (Envelope<"task.agree" | "task.ack"> & Target)
  | (Envelope<"task.reopen"> & Target & { readonly reason: string; readonly next?: string })
  | (Envelope<"record.save"> & Target & { readonly kind: string; readonly title: string; readonly content: string; readonly path?: string; readonly authors?: readonly Actor[]; readonly inputs?: readonly RecordRef[] })
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
function investigator(state: State, actor: Actor): void { if (!state.investigators.includes(actor)) refuse("only investigators publish or agree with conclusions") }
function owner(task: Task, actor: Actor): void { if (task.owner !== actor && actor !== "master") refuse(`${task.id} belongs to ${task.owner ?? "no one"}`) }
export function taskById(state: State, id: string): Task | undefined { return state.tasks.find((task) => task.id === id) }
export function recordByRef(state: State, ref: RecordRef): ArtifactRecord | undefined { return state.records.find((record) => record.id === ref.id && record.rev === ref.rev) }
export function latestRecord(state: State, id: string): ArtifactRecord | undefined { return state.records.filter((record) => record.id === id).at(-1) }
export function sameRefs(a: readonly RecordRef[], b: readonly RecordRef[]): boolean {
  const keys = (refs: readonly RecordRef[]) => refs.map((ref) => `${ref.id}@${ref.rev}`).sort()
  return JSON.stringify(keys(a)) === JSON.stringify(keys(b))
}
function checkRefs(state: State, refs: readonly RecordRef[]): void {
  if (new Set(refs.map((ref) => `${ref.id}@${ref.rev}`)).size !== refs.length) refuse("input references must be unique")
  for (const ref of refs) if (!recordByRef(state, ref)) refuse(`missing record ${ref.id}@${ref.rev}`)
}
function getTask(state: State, target: Target): Task {
  const task = taskById(state, target.id)
  if (!task) refuse(`missing task ${target.id}`)
  revision(task.rev, target.rev, task.id)
  return task
}
function checkTask(state: State, task: Task): void {
  nonempty(task.title, "title"); nonempty(task.outcome, "outcome"); nonempty(task.next, "next action")
  oneOf(task.permission, ["read", "write", "check-in"], "permission")
  if (task.owner !== null) knownActor(state, task.owner)
  checkRefs(state, task.inputs)
  if (task.wait) { oneOf(task.wait.kind, ["user", "external", "checkout"], "wait kind"); nonempty(task.wait.reason, "wait reason") }
}
function updateTask(state: State, task: Task): State { return { ...state, tasks: state.tasks.map((old) => old.id === task.id ? task : old) } }
function idleTask(state: State, task: Task): void { if (activeDispatch(state, task.id)) refuse(`${task.id} has an active dispatch; reconcile it first`) }
function guard(state: State, task: Task, actor: Actor, action: "start" | "dispatch"): void {
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
        const task: Task = { id: command.id, rev: 1, version: 1, title: command.title, outcome: command.outcome, owner: command.owner === undefined ? actor : command.owner, state: "open", started: false, note: command.note ?? "", next: command.next, permission: command.permission ?? "read", inputs: command.inputs ?? [], wait: command.wait ?? null, conclusion: null, attention: command.wait && command.wait.kind !== "checkout" ? state.revision + 1 : 0, acknowledged: 0, created: at, updated: at }
        if (task.owner !== actor && task.owner !== null) master(actor)
        checkTask(state, task)
        state = { ...state, tasks: [...state.tasks, task] }; note = task.wait ? `${task.outcome}; waiting on ${task.wait.kind}: ${task.wait.reason}` : task.outcome
        break
      }
      case "task.set": {
        const task = getTask(state, command)
        const sharedDiscussion = state.investigators.includes(actor) && task.state === "open"
          && !["outcome", "permission", "inputs", "next", "resolution"].some((key) => Object.hasOwn(command, key))
          && (command.wait === undefined || command.wait?.kind === "user")
        if (!sharedDiscussion) owner(task, actor)
        const resolvesUserWait = task.wait?.kind === "user" && command.wait !== undefined && command.wait?.kind !== "user"
        let inputs = command.inputs ?? task.inputs
        if (resolvesUserWait) {
          master(actor)
          const resolution = command.resolution
          if (!resolution || typeof resolution !== "object" || typeof resolution.id !== "string" || !Number.isSafeInteger(resolution.rev) || resolution.rev < 1) refuse("resolution must name an exact retained ruling record reference")
          const ruling = recordByRef(state, resolution)
          if (!ruling) refuse(`missing ruling ${resolution.id}@${resolution.rev}`)
          if (ruling.kind !== "ruling" || ruling.by !== "master") refuse("resolution must reference a ruling recorded by master")
          if (latestRecord(state, resolution.id)?.rev !== resolution.rev) refuse("resolution ruling is historical; retain and reference the current ruling")
          inputs = [...inputs.filter((ref) => ref.id !== resolution.id), resolution]
        } else if (command.resolution !== undefined) refuse("resolution applies only when resolving an existing user wait")
        const material = resolvesUserWait || ["outcome", "permission", "inputs"].some((key) => Object.hasOwn(command, key) && JSON.stringify(command[key as keyof typeof command]) !== JSON.stringify(task[key as keyof Task]))
        const waitChanged = command.wait !== undefined && JSON.stringify(command.wait) !== JSON.stringify(task.wait)
        if (material || waitChanged) { idleTask(state, task); if (task.state !== "open") refuse("reopen a terminal task before changing its promised result"); if (material && !resolvesUserWait) nonempty(command.reason ?? "", "reconciliation reason") }
        const reportedWaitChanged = waitChanged && [task.wait, command.wait].some((wait) => wait && wait.kind !== "checkout")
        const next: Task = { ...task, rev: task.rev + 1, version: task.version + Number(material), updated: at, title: command.title ?? task.title, outcome: command.outcome ?? task.outcome, note: command.note ?? task.note, next: command.next ?? task.next, permission: command.permission ?? task.permission, inputs, wait: command.wait === undefined ? task.wait : command.wait, attention: reportedWaitChanged ? state.revision + 1 : task.attention, started: material ? false : task.started }
        checkTask(state, next); state = updateTask(state, next)
        const describeWait = (wait: Wait | null) => wait ? `${wait.kind}: ${wait.reason}` : "none"
        note = [waitChanged ? `wait ${describeWait(task.wait)} -> ${describeWait(next.wait)}` : "", command.resolution ? `user ruling ${command.resolution.id}@${command.resolution.rev}` : "", command.reason ?? command.note ?? ""].filter(Boolean).join("; ")
        break
      }
      case "task.claim": {
        const task = getTask(state, command); idleTask(state, task)
        if (task.state !== "open") refuse("only open tasks can be claimed")
        const claimant = command.owner ?? actor; knownActor(state, claimant)
        if (claimant !== actor || task.owner !== null && task.owner !== actor) master(actor)
        state = updateTask(state, { ...task, owner: claimant, started: claimant === task.owner && task.started, rev: task.rev + 1, updated: at }); note = `assigned to ${claimant}`
        break
      }
      case "task.release": {
        const task = getTask(state, command); owner(task, actor); idleTask(state, task)
        if (task.state !== "open") refuse("only open tasks can be released")
        nonempty(command.note, "handoff note"); nonempty(command.next, "next action")
        state = updateTask(state, { ...task, owner: null, started: false, note: command.note, next: command.next, rev: task.rev + 1, updated: at }); note = command.note
        break
      }
      case "task.start": {
        const task = getTask(state, command); guard(state, task, actor, "start")
        state = updateTask(state, { ...task, started: true, rev: task.rev + 1, updated: at }); note = task.next
        break
      }
      case "task.publish": {
        const task = getTask(state, command); investigator(state, actor); idleTask(state, task)
        if (pendingWait(state, task)) refuse("resolve the wait before publishing a conclusion")
        oneOf(command.disposition, ["done", "stopped", "cancelled", "replaced"], "disposition")
        checkRefs(state, [command.result])
        const children = command.children ?? []
        if (command.disposition === "replaced") checkReplacement(state, task.id, children)
        else if (children.length) refuse("only a replacement conclusion has children")
        const conclusion: Conclusion = { record: command.result, disposition: command.disposition, children: [...children], author: actor, agreedBy: [actor] }
        state = updateTask(state, { ...task, state: command.disposition, conclusion, wait: null, started: false, rev: task.rev + 1, version: task.version + 1, attention: state.revision + 1, updated: at })
        note = `${command.disposition}: ${command.result.id}@${command.result.rev}`; break
      }
      case "task.agree": {
        const task = getTask(state, command); investigator(state, actor); idleTask(state, task)
        if (!task.conclusion) refuse("there is no published conclusion to agree with")
        if (task.conclusion.agreedBy.includes(actor)) refuse("this investigator already endorses the conclusion")
        state = updateTask(state, { ...task, conclusion: { ...task.conclusion, agreedBy: [...task.conclusion.agreedBy, actor] }, rev: task.rev + 1, attention: state.revision + 1, updated: at })
        note = "agreed with current conclusion"; break
      }
      case "task.ack": {
        master(actor); const task = getTask(state, command)
        if (task.attention <= task.acknowledged) refuse("no unread outcome to acknowledge")
        state = updateTask(state, { ...task, acknowledged: task.attention })
        note = "master read the outcome; this is not agreement"; break
      }
      case "task.reopen": {
        const task = getTask(state, command); investigator(state, actor); idleTask(state, task); nonempty(command.reason, "reopening reason")
        if (task.state === "open") refuse("task is already open")
        nonempty(command.next ?? task.next, "next action")
        state = updateTask(state, { ...task, state: "open", conclusion: null, started: false, next: command.next ?? task.next, note: command.reason, version: task.version + 1, rev: task.rev + 1, attention: state.revision + 1, updated: at })
        note = command.reason; break
      }
      case "record.save": {
        nonempty(command.id, "record id"); nonempty(command.kind, "record kind"); nonempty(command.title, "record title"); nonempty(command.content, "record content")
        const previous = latestRecord(state, command.id); revision(previous?.rev ?? 0, command.rev, command.id)
        const inputs = command.inputs ?? []; checkRefs(state, inputs)
        const authors = [...new Set([actor, ...command.authors ?? []])]
        for (const author of command.authors ?? []) knownActor(state, author)
        const record: ArtifactRecord = { id: command.id, rev: command.rev + 1, kind: command.kind, title: command.title, content: command.content, path: command.path ?? "", digest: createHash("sha256").update(command.content).digest("hex"), authors, inputs, by: actor, at, sequence: state.revision + 1 }
        state = { ...state, records: [...state.records, record] }; note = `${record.kind}: ${record.title}`
        break
      }
      case "checkout.take": {
        revision(state.checkoutRev, command.rev, "checkout"); nonempty(command.purpose, "checkout purpose")
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
        const dispatch: Dispatch = { id: command.id, rev: 1, task: task.id, taskVersion: task.version, inputs: task.inputs, parent: actor, worker: null, state: "reserved", inspectAfter: command.inspectAfter, observations: [], created: at, updated: at }
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
        if (worker) { nonempty(worker.name, "worker name"); if (worker.pane !== null) nonempty(worker.pane, "worker pane"); if (worker.session !== null) nonempty(worker.session, "worker session") }
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

/** Replacement links organize work, never derive engineering truth. */
function checkReplacement(state: State, parent: string, children: readonly string[]): void {
  if (!children.length || new Set(children).size !== children.length) refuse("replacement requires one or more distinct existing children")
  const tasks = new Map(state.tasks.map((task) => [task.id, task])), visited = new Set<string>()
  const visit = (id: string): void => {
    if (id === parent) refuse(`replacement cycle through ${id}`)
    if (visited.has(id)) return
    visited.add(id)
    const task = tasks.get(id)
    if (!task) refuse(`missing replacement child ${id}`)
    for (const child of task.conclusion?.children ?? []) visit(child)
  }
  for (const id of children) visit(id)
}
