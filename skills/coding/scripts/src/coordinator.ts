// Runtime observation and wake delivery belong to the master, outside ledger mutations.
import { DatabaseSync } from "node:sqlite"
import { existsSync } from "node:fs"
import { join, resolve } from "node:path"
import { randomUUID } from "node:crypto"
import { spawnSync } from "node:child_process"
import { setTimeout as delay } from "node:timers/promises"
import { workSignals, overdueDispatches } from "./work.ts"
import { read, type Snapshot } from "./store.ts"

type Role = string
type Identity = { name: string; pane: string; session: string | null }
type Owner = { pid: number; token: string; since: string }
type Observation = { at: string; identity: Identity | null; status: string; detail: string; duties: string[]; attention?: string; attentionCode?: string }
type Attempt = { id: string; seat: Role; identity: Identity; duties: string[]; at: string; observedWorking: boolean; outcome: "unconfirmed" | "accepted" | "not-sent"; detail: string; retry?: { at: string; checked: string } }
interface Control {
  paused: boolean
  reason: string
  tick: Owner | null
  watch: Owner | null
  lastObservation: string | null
  bindings: Partial<Record<Role, Identity>>
  observations: Partial<Record<Role, Observation>>
  attempts: Attempt[]
}
const rolesFor = (snapshot: Snapshot): Role[] => Object.keys(snapshot.state.names).filter((actor) => actor !== "master").sort().concat("master")
// Policy checkpoint: an accepted wake without observed activity needs inspection
// after one minute. This is not a transport deadline or evidence the agent died.
const ACTIVITY_INSPECTION_MS = 60_000
// Coordinator policy: bound each CLI observation/send. Kill the owned CLI child
// at the deadline even if it ignores SIGTERM; a timed-out send stays unconfirmed.
const RUNTIME_TIMEOUT_MS = 10_000
const now = () => new Date().toISOString()
const initial = (): Control => ({ paused: true, reason: "disabled until master resumes", tick: null, watch: null, lastObservation: null, bindings: {}, observations: {}, attempts: [] })
const detail = (error: unknown) => error instanceof Error ? error.message : String(error)
const unresolved = (attempt: Attempt) => attempt.outcome === "unconfirmed" && !attempt.retry
const suppresses = (attempt: Attempt) => attempt.outcome !== "not-sent" && !attempt.retry

function open(directory: string): DatabaseSync {
  const db = new DatabaseSync(join(directory, "coordination.db"))
  try {
    db.exec("PRAGMA busy_timeout = 5000; CREATE TABLE IF NOT EXISTS control (id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL); CREATE TABLE IF NOT EXISTS audit (seq INTEGER PRIMARY KEY, at TEXT NOT NULL, action TEXT NOT NULL, detail TEXT NOT NULL)")
    db.prepare("INSERT OR IGNORE INTO control VALUES (1, ?)").run(JSON.stringify(initial()))
    return db
  } catch (error) { db.close(); throw error }
}
function load(db: DatabaseSync): Control {
  return JSON.parse((db.prepare("SELECT value FROM control WHERE id=1").get() as { value: string }).value) as Control
}
function change<T>(db: DatabaseSync, action: string, body: (state: Control) => T): T {
  db.exec("BEGIN IMMEDIATE")
  try {
    const state = load(db)
    const before = JSON.stringify(state)
    const result = body(state)
    const after = JSON.stringify(state)
    db.prepare("UPDATE control SET value=? WHERE id=1").run(after)
    // Poll timestamps remain cheap health data; only observation changes enter the audit.
    if (!["heartbeat", "tick acquired", "tick released", "control acquired", "control released"].includes(action) && before !== after) db.prepare("INSERT INTO audit(at,action,detail) VALUES (?,?,?)").run(now(), action, after)
    db.exec("COMMIT")
    return result
  } catch (error) { db.exec("ROLLBACK"); throw error }
}
function alive(owner: Owner): boolean {
  try { process.kill(owner.pid, 0); return true } catch (error) { return (error as NodeJS.ErrnoException).code !== "ESRCH" }
}
function ownerText(owner: Owner | null): string {
  return owner ? `pid ${owner.pid} since ${owner.since} (${alive(owner) ? "process exists" : "stale; master must inspect and resume"})` : "none"
}
function render(state: Control, roles: readonly Role[]): string {
  const lines = [`coordination: ${state.paused ? "paused" : "enabled"}; ${state.reason}`, `watch owner: ${ownerText(state.watch)}; tick owner: ${ownerText(state.tick)}`, `last observation: ${state.lastObservation ?? "never"}`]
  for (const seat of roles) {
    const binding = state.bindings[seat]
    const observed = state.observations[seat]
    lines.push(`${seat}: ${binding ? `${binding.name} pane=${binding.pane} session=${binding.session ?? "unavailable"}` : "unbound"}; ${observed ? `${observed.status}: ${observed.detail}` : "not observed"}`)
    const attempt = state.attempts.filter((attempt) => attempt.seat === seat).at(-1)
    if (attempt) lines.push(`  last wake: ${attempt.outcome} at ${attempt.at}; activity after wake: ${attempt.observedWorking ? "observed working" : "not observed"}${attempt.retry ? `; checked retry authorized at ${attempt.retry.at}` : ""}`)
  }
  for (const attempt of state.attempts.filter(unresolved)) lines.push(`unconfirmed wake ${attempt.seat} ${attempt.id}: ${attempt.detail}; master must inspect the recipient/runtime, then coordinate retry seat=${attempt.seat} checked=... and explicitly resume; restart watch if it stopped`)
  return lines.join("\n")
}
/** Reading normal ledger health must neither create control state nor contact Herdr. */
export function coordinationStatus(directory: string): string {
  const roles = rolesFor(read(join(directory, "ledger.db")))
  if (!existsSync(join(directory, "coordination.db"))) return render(initial(), roles)
  const db = new DatabaseSync(join(directory, "coordination.db"), { readOnly: true })
  try {
    db.exec("PRAGMA busy_timeout = 5000")
    return render(load(db), roles)
  } finally { db.close() }
}

interface Agent { identity: Identity; status: string }
function session(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === "string" && value) return value
  if (typeof value === "object") {
    const fields = value as Record<string, unknown>
    if (["agent", "kind", "source", "value"].every((key) => typeof fields[key] === "string" && fields[key])) return JSON.stringify([fields.agent, fields.kind, fields.source, fields.value])
  }
  throw new Error("Herdr returned an invalid agent session")
}
function agents(names: readonly string[]): Agent[] {
  const result = spawnSync("herdr", ["agent", "list"], { encoding: "utf8", timeout: RUNTIME_TIMEOUT_MS, killSignal: "SIGKILL" })
  if (result.error || result.status !== 0) throw new Error(`Herdr observation failed: ${result.error?.message ?? result.stderr ?? result.status}`)
  const payload: unknown = JSON.parse(result.stdout)
  const list = (payload as { result?: { agents?: unknown } })?.result?.agents
  if (!Array.isArray(list)) throw new Error("Herdr agent list did not return result.agents")
  const matched = list.filter((item: unknown) => item && typeof item === "object" && names.includes((item as { name?: string }).name ?? ""))
  if (new Set(matched.map((item: { name: string }) => item.name)).size !== matched.length) throw new Error("Herdr returned ambiguous configured agent names")
  return matched.map((item: unknown) => {
    const row = item as Record<string, unknown>
    if (!row || typeof row.name !== "string" || typeof row.pane_id !== "string" || !row.pane_id) throw new Error("Herdr returned an invalid agent identity")
    return { identity: { name: row.name, pane: row.pane_id, session: session(row.agent_session) }, status: typeof row.agent_status === "string" ? row.agent_status : "unknown" }
  })
}
function identityEqual(a: Identity, b: Identity): boolean { return a.name === b.name && a.pane === b.pane && a.session === b.session }
function named(list: Agent[], name: string): Agent | undefined {
  const matches = list.filter((agent) => agent.identity.name === name)
  if (matches.length > 1) throw new Error(`multiple Herdr agents named ${name}`)
  return matches[0]
}

function work(snapshot: Snapshot, seat: Role): { duties: string[]; detail: string } {
  const signals = workSignals(snapshot.state, seat)
  const duties = signals.map(({ key, basis }) =>
    JSON.stringify([key, snapshot.workVersions[seat]?.[key] ?? basis])).sort()
  return { duties, detail: signals.length ? signals.map(({ reason }) => reason).join("; ") : "no eligible assigned work" }
}

function tick(db: DatabaseSync, directory: string, watch: Owner | null): void {
  const owner: Owner = { pid: process.pid, token: randomUUID(), since: now() }
  const acquired = change(db, "tick acquired", (state) => {
    if (state.watch && state.watch.token !== watch?.token) throw new Error(`watch already owned by ${ownerText(state.watch)}`)
    if (state.tick) {
      // Only control commands can reserve between this watch's ticks: competing
      // once/watch invocations are excluded by its durable watch ownership.
      if (watch && state.watch?.token === watch.token && alive(state.tick)) return false
      throw new Error(`coordinator tick already owned by ${ownerText(state.tick)}`)
    }
    state.tick = owner
    if (state.attempts.some(unresolved)) {
      state.paused = true
      state.reason = "unconfirmed wake; master must inspect and retry explicitly"
    }
    return true
  })
  if (!acquired) return
  try {
    const roles = rolesFor(read(join(directory, "ledger.db")))
    let list: Agent[]
    try { list = agents(Object.values(read(join(directory, "ledger.db")).state.names)) } catch (error) {
      change(db, "runtime unavailable", (state) => {
        for (const seat of roles) {
          const previous = state.observations[seat]
          if (previous?.status !== "unknown" || previous.detail !== detail(error)) state.observations[seat] = { at: now(), identity: null, status: "unknown", detail: detail(error), duties: [] }
        }
      })
      change(db, "heartbeat", (state) => { state.lastObservation = now() })
      return
    }
    const snapshot = read(join(directory, "ledger.db"))
    const shared = snapshot.state
    for (const seat of roles) {
      const available = work(snapshot, seat)
      const control = load(db)
      const binding = control.bindings[seat]
      // Worker observations are refreshed earlier in this tick. Derive alerts
      // from current duties, so recovery while master is busy leaves no queued alarm.
      const alerts = seat === "master" ? roles.filter((actor) => actor !== "master").flatMap((worker) => {
        const observed = control.observations[worker]
        if (!observed?.attention || !observed.duties.length) return []
        return observed.duties.map((duty) => ({ key: JSON.stringify(["attention", worker, control.bindings[worker], observed.identity, duty, observed.attentionCode]), reason: `${worker}: ${observed.attention}` }))
      }) : []
      for (const dispatch of overdueDispatches(shared, now())) {
        const recipient = roles.includes(dispatch.parent) ? dispatch.parent : "master"
        if (recipient !== seat) continue
        alerts.push({
          key: JSON.stringify(["dispatch-inspection", dispatch.id, dispatch.rev, dispatch.inspectAfter]),
          reason: `inspect child ${dispatch.worker?.name ?? "with unconfirmed launch"} for dispatch ${dispatch.id} on task ${dispatch.task}, owned by ${dispatch.parent}; its recorded inspection time has arrived, not proof of death or permission to replace it`,
        })
      }
      const duties = [...available.duties, ...alerts.map((alert) => alert.key)].sort()
      if (alerts.length) available.detail = `${seat === "master" ? "master attention" : "child inspection"} required: ${[...new Set(alerts.map((alert) => alert.reason))].join("; ")}`
      const agent = named(list, shared.names[seat]!)
      let status = !binding ? "unbound" : !agent ? "missing" : !identityEqual(binding, agent.identity) ? "changed" : agent.status
      if (!["unbound", "missing", "changed", "working", "idle", "done", "blocked"].includes(status)) status = "unknown"
      const attempts = control.attempts.filter((attempt) => attempt.seat === seat && binding && identityEqual(attempt.identity, binding))
      const latest = duties.map((duty) => attempts.filter((attempt) => attempt.duties.includes(duty)).at(-1))
      const covered = duties.length > 0 && latest.every((attempt) => attempt && suppresses(attempt))
      const prior = covered ? latest.at(-1) : undefined
      const stalled = covered && latest.some((attempt) => attempt?.outcome === "accepted" && attempt.observedWorking)
      const unobserved = covered && latest.some((attempt) => attempt?.outcome === "accepted" && !attempt.observedWorking
        && Date.now() - Date.parse(attempt.at) >= ACTIVITY_INSPECTION_MS)
      let description = available.detail
      if (prior?.outcome === "accepted" && ["idle", "done"].includes(status) && duties.length) description = stalled
        ? `stalled: current work was already prompted and ran; inspect before checked retry; ${available.detail}`
        : unobserved ? `accepted wake inspection due: no activity observed at the one-minute policy checkpoint; inspect before checked retry; ${available.detail}`
          : "wake accepted; awaiting activity or progress"
      if (prior?.outcome === "unconfirmed") description = "unconfirmed wake; inspect before checked retry"
      if (alerts.length && !description.includes(available.detail)) description += `; ${available.detail}`
      const attentionCode = seat !== "master" && duties.length
        ? ["unbound", "missing", "changed", "unknown", "blocked"].includes(status) ? status
          : stalled && ["idle", "done"].includes(status) ? "stalled"
            : unobserved && ["idle", "done"].includes(status) ? "unobserved" : undefined
        : undefined
      const attention = attentionCode
        ? ["unbound", "missing", "changed", "unknown", "blocked"].includes(status)
          ? `${status} with outstanding duties; inspect runtime and binding before recovery`
          : stalled && ["idle", "done"].includes(status)
            ? "stalled with outstanding duties after an accepted wake and observed activity; inspect before checked retry"
            : unobserved && ["idle", "done"].includes(status)
              ? "accepted wake inspection due with outstanding duties and no observed activity at the one-minute policy checkpoint; inspect recipient before checked retry; this is not evidence of death"
            : undefined
        : undefined
      const observation: Observation = { at: now(), identity: agent?.identity ?? null, status, detail: description, duties, ...(attention && attentionCode ? { attention, attentionCode } : {}) }
      change(db, "observation changed", (state) => {
        const previous = state.observations[seat]
        if (!previous || JSON.stringify({ ...previous, at: "" }) !== JSON.stringify({ ...observation, at: "" })) state.observations[seat] = observation
        if (status === "working") {
          for (const attempt of state.attempts) {
            if (attempt.seat === seat && binding && identityEqual(attempt.identity, binding) && attempt.outcome === "accepted" && !attempt.retry && attempt.duties.some((duty) => duties.includes(duty))) attempt.observedWorking = true
          }
        }
      })
      if (control.paused || !duties.length || !binding || !agent || !["idle", "done"].includes(status) || covered) continue
      const id = randomUUID()
      // Committed before any external side effect. Process loss leaves an unconfirmed wake.
      const reservedWake = change(db, "wake reserved", (state) => {
        if (state.paused) return false
        state.attempts.push({ id, seat, identity: binding, duties, at: now(), observedWorking: false, outcome: "unconfirmed", detail: "transport attempt reserved; acceptance not yet recorded" })
        return true
      })
      if (!reservedWake) continue
      if (load(db).paused) {
        const note = "pause stopped the reserved wake before transport; no prompt sent"
        change(db, "wake cancelled before transport", (state) => {
          const attempt = state.attempts.find((attempt) => attempt.id === id)!
          attempt.outcome = "not-sent"; attempt.detail = note
        })
        continue
      }
      const message = `Run directory: ${JSON.stringify(resolve(directory))}; recipient actor: ${seat}\n${available.detail}.\nRead the current ledger and your retained working note. Pull your action work, peer-agreement duties or unread outcomes, and inspect your recorded child executions when due. Preserve task and checkout ownership. This wake is not an assignment or evidence of completion.`
      const result = spawnSync("herdr", ["agent", "prompt", binding.pane, message], { encoding: "utf8", timeout: RUNTIME_TIMEOUT_MS, killSignal: "SIGKILL" })
      let accepted = false
      try {
        const response = JSON.parse(result.stdout) as { result?: { type?: string; agent?: { name?: string; pane_id?: string; agent_session?: unknown } } }
        accepted = !result.error && result.status === 0 && response.result?.type === "agent_prompted"
          && response.result.agent?.name === binding.name
          && response.result.agent?.pane_id === binding.pane
          && session(response.result.agent?.agent_session) === binding.session
      } catch { /* An absent or malformed acknowledgement remains unconfirmed. */ }
      const diagnostic = JSON.stringify({ status: result.status, signal: result.signal, error: result.error?.message ?? null, stdout: result.stdout, stderr: result.stderr })
      change(db, "wake result", (state) => {
        const attempt = state.attempts.find((attempt) => attempt.id === id)!
        attempt.outcome = accepted ? "accepted" : "unconfirmed"
        attempt.detail = diagnostic
        if (!accepted) { state.paused = true; state.reason = `unconfirmed ${seat} wake; master must inspect and retry explicitly` }
      })
    }
    change(db, "heartbeat", (state) => { state.lastObservation = now() })
  } finally {
    change(db, "tick released", (state) => { if (state.tick?.token === owner.token) state.tick = null })
  }
}

export async function coordinate(directory: string, args: readonly string[]): Promise<number> {
  const [verb = "status", ...rest] = args
  if (verb === "status") {
    if (rest.length) throw new Error("coordinator status accepts no options")
    console.log(coordinationStatus(directory)); return 0
  }
  if (process.env.LEDGER_ME !== "master") throw new Error("only master controls the coordinator")
  const fields: Record<string, string> = {}
  const allowed: Record<string, string[]> = { once: [], watch: ["interval"], pause: ["reason"], resume: ["reason"], bind: ["seat", "reason"], retry: ["seat", "checked"] }
  if (!allowed[verb]) throw new Error(`unknown coordinator command ${verb}`)
  for (const argument of rest) {
    const split = argument.indexOf("=")
    const key = argument.slice(0, split), value = argument.slice(split + 1)
    if (split < 1 || !allowed[verb]!.includes(key) || key in fields || !value.trim()) throw new Error(`invalid coordinator option ${argument}`)
    fields[key] = value
  }
  if (["pause", "resume", "bind"].includes(verb) && !fields.reason) throw new Error(`${verb} requires reason=`)
  if (verb === "retry" && !fields.checked) throw new Error("retry requires checked= recipient/runtime evidence")
  const roles = rolesFor(read(join(directory, "ledger.db")))
  const seat = fields.seat as Role
  if (["bind", "retry"].includes(verb) && !roles.includes(seat)) throw new Error(`seat must name a configured actor: ${roles.join(", ")}`)
  const interval = fields.interval ? Number(fields.interval) : 2000
  if (verb === "watch" && (!Number.isInteger(interval) || interval < 250 || interval > 60_000)) throw new Error("watch interval= must be milliseconds from 250 through 60000")
  const db = open(directory)
  let watch: Owner | null = null
  try {
    if (verb === "pause") {
      const draining = change(db, `pause: ${fields.reason}`, (state) => {
        state.paused = true; state.reason = fields.reason!
        return state.tick
      })
      // A reserved attempt may not have reached Herdr yet. Keep pause pending
      // until that entire tick ends, covering both reservation and transport.
      // Later ticks see the durable pause when reserving and cannot send.
      const deadline = Date.now() + 30_000
      while (draining && load(db).tick?.token === draining.token && alive(draining)) {
        if (Date.now() >= deadline) throw new Error(`pause is saved, but tick ${ownerText(draining)} has not drained; stop is not yet confirmed`)
        await delay(50)
      }
    }
    else if (verb === "once") tick(db, directory, null)
    else if (verb === "watch") {
      watch = { pid: process.pid, token: randomUUID(), since: now() }
      change(db, "watch started", (state) => {
        if (state.watch || state.tick) throw new Error(`coordinator already owned: watch ${ownerText(state.watch)}; tick ${ownerText(state.tick)}`)
        state.watch = watch
      })
      const stopping = new AbortController()
      const stop = () => { stopping.abort() }
      process.on("SIGINT", stop); process.on("SIGTERM", stop)
      try {
        while (!stopping.signal.aborted) {
          tick(db, directory, watch)
          if (load(db).attempts.some(unresolved)) {
            console.error(`coordination watch stopped: unconfirmed wake in ${resolve(directory)}. Master must inspect coordinate status and the recipient/runtime, record coordinate retry seat=... checked=..., then explicitly resume and restart watch. No automatic retry was sent.`)
            break
          }
          if (!stopping.signal.aborted) {
            try { await delay(interval, undefined, { signal: stopping.signal }) }
            catch (error) { if (!(stopping.signal.aborted && error instanceof Error && error.name === "AbortError")) throw error }
          }
        }
      }
      finally {
        process.off("SIGINT", stop); process.off("SIGTERM", stop)
        change(db, "watch stopped", (state) => { if (state.watch?.token === watch?.token) state.watch = null })
        watch = null
      }
    } else {
      // Bind calls runtime only after excluding an active tick, with a durable reservation.
      const owner: Owner = { pid: process.pid, token: randomUUID(), since: now() }
      change(db, "control acquired", (state) => {
        if (verb === "resume" || verb === "retry") {
          if (state.tick && !alive(state.tick)) state.tick = null
          if (state.watch && !alive(state.watch)) state.watch = null
        }
        if (state.tick) throw new Error(`tick owned by ${ownerText(state.tick)}; try after it finishes`)
        state.tick = owner
      })
      try {
        const name = read(join(directory, "ledger.db")).state.names[seat]!
        const binding = verb === "bind" ? named(agents([name]), name) : undefined
        if (verb === "bind" && !binding) throw new Error(`named agent for ${seat} is missing`)
        change(db, `${verb}: ${fields.reason ?? fields.checked}`, (state) => {
          if (verb === "pause") { state.paused = true; state.reason = fields.reason! }
          if (verb === "resume") {
            if (state.attempts.some(unresolved)) throw new Error("resolve unconfirmed wakes with checked retry before resume")
            state.paused = false; state.reason = fields.reason!
          }
          if (verb === "bind") state.bindings[seat] = binding!.identity
          if (verb === "retry") {
            const attempt = state.attempts.filter((attempt) => attempt.seat === seat && suppresses(attempt)).at(-1)
            if (!attempt) throw new Error(`no wake for ${seat} to retry`)
            attempt.retry = { at: now(), checked: fields.checked! }
          }
        })
      } finally { change(db, "control released", (state) => { if (state.tick?.token === owner.token) state.tick = null }) }
    }
    console.log(render(load(db), roles))
    return load(db).attempts.some(unresolved) ? 2 : 0
  } finally {
    try { if (watch) change(db, "watch stopped", (state) => { if (state.watch?.token === watch?.token) state.watch = null }) }
    finally { db.close() }
  }
}
