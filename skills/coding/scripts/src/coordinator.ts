// Runtime observation and wake delivery belong to the master, outside ledger mutations.
import { DatabaseSync } from "node:sqlite"
import { existsSync } from "node:fs"
import { join, resolve } from "node:path"
import { createHash, randomUUID } from "node:crypto"
import { spawnSync } from "node:child_process"
import { setTimeout as delay } from "node:timers/promises"
import { freshReviews, isDone, ready, reviewBasis, type Event, type State } from "./protocol.ts"
import { deliveryOutcome, read, recordDelivery } from "./store.ts"

type Role = "A" | "B" | "master"
type Identity = { name: string; pane: string; session: string | null }
type Owner = { pid: number; token: string; since: string }
type Observation = { at: string; identity: Identity | null; status: string; detail: string; fingerprint: string | null; attention?: string }
type Attempt = { seat: Role; identity: Identity; fingerprint: string; at: string; observedWorking: boolean; outcome: "unconfirmed" | "accepted" | "retry"; detail: string; duties?: string[] }
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
const roles: readonly Role[] = ["A", "B", "master"]
const now = () => new Date().toISOString()
const initial = (): Control => ({ paused: true, reason: "disabled until master resumes", tick: null, watch: null, lastObservation: null, bindings: {}, observations: {}, attempts: [] })
const detail = (error: unknown) => error instanceof Error ? error.message : String(error)

function open(directory: string): DatabaseSync {
  const db = new DatabaseSync(join(directory, "coordination.db"))
  db.exec("PRAGMA busy_timeout = 5000; CREATE TABLE IF NOT EXISTS control (id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL); CREATE TABLE IF NOT EXISTS audit (seq INTEGER PRIMARY KEY, at TEXT NOT NULL, action TEXT NOT NULL, detail TEXT NOT NULL)")
  db.prepare("INSERT OR IGNORE INTO control VALUES (1, ?)").run(JSON.stringify(initial()))
  return db
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
function render(state: Control): string {
  const lines = [`coordination: ${state.paused ? "paused" : "enabled"}; ${state.reason}`, `watch owner: ${ownerText(state.watch)}; tick owner: ${ownerText(state.tick)}`, `last observation: ${state.lastObservation ?? "never"}`]
  for (const seat of roles) {
    const binding = state.bindings[seat]
    const observed = state.observations[seat]
    lines.push(`${seat}: ${binding ? `${binding.name} pane=${binding.pane} session=${binding.session ?? "unavailable"}` : "unbound"}; ${observed ? `${observed.status}: ${observed.detail}` : "not observed"}`)
    const attempt = state.attempts.filter((attempt) => attempt.seat === seat).at(-1)
    if (attempt) lines.push(`  last wake: ${attempt.outcome} at ${attempt.at}; activity after wake: ${attempt.observedWorking ? "observed working" : "not observed"}`)
  }
  for (const attempt of state.attempts.filter((item) => item.outcome === "unconfirmed")) lines.push(`unconfirmed wake ${attempt.seat} ${attempt.fingerprint}: ${attempt.detail}; master checked retry required`)
  return lines.join("\n")
}
/** Reading normal ledger health must neither create control state nor contact Herdr. */
export function coordinationStatus(directory: string): string {
  if (!existsSync(join(directory, "coordination.db"))) return render(initial())
  const db = new DatabaseSync(join(directory, "coordination.db"), { readOnly: true })
  try {
    db.exec("PRAGMA busy_timeout = 5000")
    return render(load(db))
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
  const result = spawnSync("herdr", ["agent", "list"], { encoding: "utf8", timeout: 10_000 })
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

function work(directory: string, shared: State, seat: Role, events: readonly Event[]): { fingerprint: string | null; cold: boolean; detail: string } {
  const cold = seat !== "master" && !shared.imported[seat]
  let state = shared
  if (cold) {
    const path = join(directory, `cold-${seat}.db`)
    if (!existsSync(path)) return { fingerprint: null, cold, detail: "cold database missing; no shared work exposed" }
    state = read(path).state
    if (state.mode !== "cold" || state.seat !== seat) throw new Error(`${path} does not belong to cold seat ${seat}`)
  }
  // A peer can hold and release the checkout entirely between polls. Its release
  // creates a new opportunity, even when the ready row itself never changed.
  const checkoutEvents = events.filter((event) => event.command === "checkout.take" || event.command === "checkout.release")
  const obligations: unknown[] = ready(state, seat).map((item) => {
    const row = state.rows.find((row) => row.id === item.row)
    const basis = row && ["Issue", "Proposed fix", "Shelved fix"].includes(row.kind) ? reviewBasis(state, row.id) : null
    return { ...item, rowState: row ?? null, basis, checkoutOpportunity: item.command === "checkout.take" ? { changes: checkoutEvents.length, last: checkoutEvents.at(-1) ?? null } : null }
  })
  if (!cold && seat !== "master") {
    for (const review of freshReviews(state).filter((review) => review.arranger === seat)) obligations.push({ arrange: review, basis: reviewBasis(state, review.row) })
    if (!obligations.length && !state.handedOff[seat]) obligations.push({ handoff: seat, completed: state.rows.filter((row) =>
      row.author === seat || row.editor === seat || "owner" in row && row.owner === seat || "executor" in row && row.executor === seat || "mark" in row && row.mark?.by === seat || "review" in row && row.review?.by === seat) })
  }
  if (seat === "master" && isDone(state)) obligations.push({ report: true, completed: state.rows })
  return { fingerprint: obligations.length ? createHash("sha256").update(JSON.stringify({ cold, obligations })).digest("hex") : null, cold, detail: obligations.length ? `${cold ? "private cold" : "shared"} obligations ready` : "no eligible work" }
}

function tick(db: DatabaseSync, directory: string, watch: Owner | null): void {
  const owner: Owner = { pid: process.pid, token: randomUUID(), since: now() }
  change(db, "tick acquired", (state) => {
    if (state.tick) throw new Error(`coordinator tick already owned by ${ownerText(state.tick)}`)
    if (state.watch && state.watch.token !== watch?.token) throw new Error(`watch already owned by ${ownerText(state.watch)}`)
    state.tick = owner
    if (state.attempts.some((attempt) => attempt.outcome === "unconfirmed")) {
      state.paused = true
      state.reason = "unconfirmed wake; master must inspect and retry explicitly"
    }
  })
  try {
    let list: Agent[]
    try { list = agents(Object.values(read(join(directory, "ledger.db")).state.names)) } catch (error) {
      change(db, "runtime unavailable", (state) => {
        for (const seat of roles) {
          const previous = state.observations[seat]
          if (previous?.status !== "unknown" || previous.detail !== detail(error)) state.observations[seat] = { at: now(), identity: null, status: "unknown", detail: detail(error), fingerprint: null }
        }
      })
      change(db, "heartbeat", (state) => { state.lastObservation = now() })
      return
    }
    const snapshot = read(join(directory, "ledger.db"))
    const shared = snapshot.state
    const unresolved = snapshot.deliveries.filter((delivery) => deliveryOutcome(delivery) === "unconfirmed")
    if (unresolved.length) change(db, "pause for old delivery", (state) => {
      state.paused = true
      state.reason = `reconcile unconfirmed ${unresolved.map((delivery) => delivery.id).join(", ")} before resuming`
    })
    for (const seat of roles) {
      const available = work(directory, shared, seat, snapshot.events)
      const control = load(db)
      const binding = control.bindings[seat]
      // Reviewer observations are refreshed earlier in this tick. Derive alerts
      // from current duties, so recovery while master is busy leaves no queued alarm.
      const alerts = seat === "master" ? (["A", "B"] as const).flatMap((reviewer) => {
        const observed = control.observations[reviewer]
        if (!observed?.attention || !observed.fingerprint) return []
        return [{ key: createHash("sha256").update(JSON.stringify({ reviewer, binding: control.bindings[reviewer], identity: observed.identity, work: observed.fingerprint, reason: observed.attention })).digest("hex"), reason: `${reviewer}: ${observed.attention}` }]
      }) : []
      const duties = [...(available.fingerprint ? [available.fingerprint] : []), ...alerts.map((alert) => alert.key)]
      if (alerts.length) {
        available.fingerprint = createHash("sha256").update(JSON.stringify(duties)).digest("hex")
        available.detail = `master attention required: ${alerts.map((alert) => alert.reason).join("; ")}`
      }
      const agent = named(list, shared.names[seat])
      let status = !binding ? "unbound" : !agent ? "missing" : !identityEqual(binding, agent.identity) ? "changed" : agent.status
      if (!["unbound", "missing", "changed", "working", "idle", "done", "blocked"].includes(status)) status = "unknown"
      const prior = control.attempts.filter((attempt) => attempt.seat === seat && attempt.fingerprint === available.fingerprint && binding && identityEqual(attempt.identity, binding)).at(-1)
      // Track each obligation included in a master wake. Otherwise resolving one
      // alert (or adding a question) changes the combined fingerprint and nags
      // master again about the remaining, already delivered obligations.
      const covered = seat === "master" && duties.length > 0 && duties.every((duty) => {
        const attempt = control.attempts.filter((attempt) => attempt.seat === seat && binding && identityEqual(attempt.identity, binding) && (attempt.duties ?? [attempt.fingerprint]).includes(duty)).at(-1)
        return attempt && attempt.outcome !== "retry"
      })
      let description = available.detail
      if (prior?.outcome === "accepted" && ["idle", "done"].includes(status) && available.fingerprint) description = prior.observedWorking
        ? `stalled: current work was already prompted and ran; inspect before checked retry; ${available.detail}`
        : "wake accepted; awaiting activity or progress"
      if (prior?.outcome === "unconfirmed") description = "unconfirmed wake; inspect before checked retry"
      if (alerts.length && !description.includes(available.detail)) description += `; ${available.detail}`
      const attention = seat !== "master" && available.fingerprint
        ? ["unbound", "missing", "changed", "unknown", "blocked"].includes(status)
          ? `${status} with outstanding duties; inspect runtime and binding before recovery`
          : prior?.outcome === "accepted" && prior.observedWorking && ["idle", "done"].includes(status)
            ? "stalled with outstanding duties after an accepted wake and observed activity; inspect before checked retry"
            : undefined
        : undefined
      const observation: Observation = { at: now(), identity: agent?.identity ?? null, status, detail: description, fingerprint: available.fingerprint, ...(attention ? { attention } : {}) }
      change(db, "observation changed", (state) => {
        const previous = state.observations[seat]
        if (!previous || JSON.stringify({ ...previous, at: "" }) !== JSON.stringify({ ...observation, at: "" })) state.observations[seat] = observation
        if (status === "working" && prior?.outcome === "accepted" && !prior.observedWorking) {
          const attempt = state.attempts.find((attempt) => attempt.seat === seat && attempt.at === prior.at && attempt.fingerprint === prior.fingerprint)
          if (attempt) attempt.observedWorking = true
        }
      })
      // Master suppression follows the latest delivery of each duty, including
      // checked retries of combined alerts; an older exact match cannot veto it.
      if (control.paused || !available.fingerprint || !binding || !agent || !["idle", "done"].includes(status) || (seat === "master" ? covered : prior && prior.outcome !== "retry")) continue
      const path = join(directory, "ledger.db")
      const pending = read(path).deliveries.filter((delivery) => delivery.to === seat && deliveryOutcome(delivery) === "pending" && !available.cold)
      const unconfirmed = read(path).deliveries.filter((delivery) => delivery.to === seat && deliveryOutcome(delivery) === "unconfirmed")
      if (unconfirmed.length) {
        change(db, "pause for old delivery", (state) => { state.paused = true; state.reason = `reconcile unconfirmed ${unconfirmed.map((delivery) => delivery.id).join(", ")} before resuming` })
        continue
      }
      const fingerprint = available.fingerprint
      // Committed before any external side effect. Process loss leaves an unconfirmed wake.
      const reservedWake = change(db, "wake reserved", (state) => {
        if (state.paused) return false
        state.attempts.push({ seat, identity: binding, fingerprint, at: now(), observedWorking: false, outcome: "unconfirmed", detail: "transport attempt reserved; acceptance not yet recorded", ...(seat === "master" ? { duties } : {}) })
        return true
      })
      if (!reservedWake) continue
      const reserved = pending.map((delivery) => recordDelivery(path, delivery.id, delivery.updates.length, { at: now(), actor: "master", outcome: "unconfirmed", note: `coordinator wake ${fingerprint} reserved` }))
      if (load(db).paused) {
        const note = "pause stopped the reserved wake before transport; no prompt sent"
        for (const delivery of reserved) recordDelivery(path, delivery.id, delivery.updates.length, { at: now(), actor: "master", outcome: "pending", note })
        change(db, "wake cancelled before transport", (state) => {
          const attempt = state.attempts.filter((attempt) => attempt.seat === seat && attempt.fingerprint === fingerprint).at(-1)!
          attempt.outcome = "retry"; attempt.detail = note
        })
        continue
      }
      const message = `Run directory: ${JSON.stringify(resolve(directory))}; recipient seat: ${seat}\n${alerts.length ? `${available.detail}.\n` : ""}Read the current ${available.cold ? "private cold" : "shared"} ledger and your retained working note. Pull eligible work, respecting ownership and existing fresh-reader assignments. This wake is not an assignment or evidence of completion.`
      const result = spawnSync("herdr", ["agent", "prompt", binding.pane, message], { encoding: "utf8", timeout: 10_000 })
      let accepted = false
      try {
        const response = JSON.parse(result.stdout) as { result?: { type?: string; agent?: { pane_id?: string; agent_session?: unknown } } }
        accepted = !result.error && result.status === 0 && response.result?.type === "agent_prompted"
          && response.result.agent?.pane_id === binding.pane
          && (binding.session === null || session(response.result.agent?.agent_session) === binding.session)
      } catch { /* An absent or malformed acknowledgement remains unconfirmed. */ }
      const diagnostic = JSON.stringify({ status: result.status, signal: result.signal, error: result.error?.message ?? null, stdout: result.stdout, stderr: result.stderr })
      change(db, "wake result", (state) => {
        const attempt = state.attempts.filter((attempt) => attempt.seat === seat && attempt.fingerprint === fingerprint).at(-1)!
        attempt.outcome = accepted ? "accepted" : "unconfirmed"
        attempt.detail = diagnostic
        if (!accepted) { state.paused = true; state.reason = `unconfirmed ${seat} wake; master must inspect and retry explicitly` }
      })
      for (const delivery of reserved) recordDelivery(path, delivery.id, delivery.updates.length, { at: now(), actor: "master", outcome: accepted ? "accepted" : "unconfirmed", note: diagnostic })
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
  const seat = fields.seat as Role
  if (["bind", "retry"].includes(verb) && !roles.includes(seat)) throw new Error("seat must be A, B, or master")
  const interval = fields.interval ? Number(fields.interval) : 2000
  if (verb === "watch" && (!Number.isInteger(interval) || interval < 250 || interval > 60_000)) throw new Error("watch interval= must be milliseconds from 250 through 60000")
  if (read(join(directory, "ledger.db")).state.mode !== "joint") throw new Error("coordinator requires a joint ledger")
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
      let stopping = false
      const stop = () => { stopping = true }
      process.on("SIGINT", stop); process.on("SIGTERM", stop)
      try { while (!stopping) { tick(db, directory, watch); if (!stopping) await delay(interval) } }
      finally { process.off("SIGINT", stop); process.off("SIGTERM", stop) }
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
        const name = read(join(directory, "ledger.db")).state.names[seat]
        const binding = verb === "bind" ? named(agents([name]), name) : undefined
        if (verb === "bind" && !binding) throw new Error(`named agent for ${seat} is missing`)
        change(db, `${verb}: ${fields.reason ?? fields.checked}`, (state) => {
          if (verb === "pause") { state.paused = true; state.reason = fields.reason! }
          if (verb === "resume") {
            if (state.attempts.some((attempt) => attempt.outcome === "unconfirmed")) throw new Error("resolve unconfirmed wakes with checked retry before resume")
            if (read(join(directory, "ledger.db")).deliveries.some((delivery) => deliveryOutcome(delivery) === "unconfirmed")) throw new Error("reconcile unconfirmed legacy deliveries with delivery accept/supersede before resume")
            state.paused = false; state.reason = fields.reason!
          }
          if (verb === "bind") state.bindings[seat] = binding!.identity
          if (verb === "retry") {
            if (read(join(directory, "ledger.db")).deliveries.some((delivery) => delivery.to === seat && deliveryOutcome(delivery) === "unconfirmed")) throw new Error("reconcile unconfirmed legacy deliveries with delivery accept/supersede first")
            const attempt = state.attempts.filter((attempt) => attempt.seat === seat && attempt.outcome !== "retry").at(-1)
            if (!attempt) throw new Error(`no wake for ${seat} to retry`)
            attempt.outcome = "retry"; attempt.detail = fields.checked!
          }
        })
      } finally { change(db, "control released", (state) => { if (state.tick?.token === owner.token) state.tick = null }) }
    }
    console.log(render(load(db)))
    return load(db).attempts.some((attempt) => attempt.outcome === "unconfirmed") ? 2 : 0
  } finally {
    if (watch) change(db, "watch stopped", (state) => { if (state.watch?.token === watch?.token) state.watch = null })
    db.close()
  }
}
