// Timing views of retained facts. These clocks overlap and do not measure labor.
import { DatabaseSync } from "node:sqlite"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { activityMarker, type ActivityMarker } from "./activity.ts"
import { type Moment, type Wait } from "./protocol.ts"
import { type Snapshot } from "./store.ts"

interface Observation { at: string; status: string }
interface AuditEntry {
  at: string
  observations?: Record<string, Observation>
  attempts?: { id: string; seat: string; at: string; outcome: string }[]
}
export interface RuntimeAudit { available: boolean; entries: AuditEntry[]; lastObservation: string | null }
export interface Span {
  actor: string; kind: string; task: string | null; label: string
  startedAt: string; endedAt: string | null; from: string; until: string; durationMs: number; open: boolean
}
interface TaskTiming {
  id: string; title: string; owner: string | null; wait: Wait | null
  firstPublicationAt: string | null; latestPublicationAt: string | null; agreedAt: string | null
  author: string | null; agreedBy: string[]; publications: number; reopenings: number; responded: boolean
}
interface PeerResponse { task: string; actor: string; publicationAt: string; at: string; decision: string; elapsedMs: number }
const iso = (ms: number) => new Date(ms).toISOString()
export function parseTime(value: string, label: string): number {
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value) || !Number.isFinite(Date.parse(value))) throw new Error(`${label} must be an ISO timestamp with timezone`)
  return Date.parse(value)
}

/** No creation, migration, heartbeat or runtime call on this reporting path. */
export function readRuntimeAudit(directory: string): RuntimeAudit {
  const path = join(directory, "coordination.db")
  if (!existsSync(path)) return { available: false, entries: [], lastObservation: null }
  const db = new DatabaseSync(path, { readOnly: true })
  try {
    db.exec("PRAGMA busy_timeout=5000; BEGIN")
    const rows = db.prepare("SELECT at,detail FROM audit ORDER BY seq").all() as { at: string; detail: string }[]
    const row = db.prepare("SELECT value FROM control WHERE id=1").get() as { value: string } | undefined
    const control = row ? JSON.parse(row.value) as { lastObservation?: string | null } : null
    const entries = rows.map((row) => ({ ...JSON.parse(row.detail) as Omit<AuditEntry, "at">, at: row.at }))
    return { available: true, entries, lastObservation: control?.lastObservation ?? null }
  } finally { db.close() }
}

function unionMs(spans: readonly { from: string; until: string }[]): number {
  let total = 0, end = -Infinity
  for (const span of [...spans].sort((a, b) => Date.parse(a.from) - Date.parse(b.from))) {
    const start = Date.parse(span.from), next = Date.parse(span.until)
    total += Math.max(0, next - Math.max(start, end)); end = Math.max(end, next)
  }
  return total
}
const median = (values: readonly number[]): number | null => {
  const sorted = [...values].sort((a, b) => a - b), n = sorted.length
  return n ? (sorted[Math.floor((n - 1) / 2)]! + sorted[Math.floor(n / 2)]!) / 2 : null
}

export function buildInsights(snapshot: Snapshot, audit: RuntimeAudit, options: { from?: string; until?: string } = {}) {
  const allEvents = snapshot.events
  const first = allEvents[0]?.at ?? snapshot.state.scope.at
  const last = allEvents.at(-1)?.at ?? first
  const from = parseTime(options.from ?? first, "from"), until = parseTime(options.until ?? last, "until")
  if (until < from) throw new Error("until must not precede from")
  const inWindow = (at: string) => Date.parse(at) >= from && Date.parse(at) <= until
  const events = allEvents.filter((event) => Date.parse(event.at) <= until)
  const spans: Span[] = [], diagnostics: string[] = [], responses: PeerResponse[] = []
  function span(actor: string, kind: string, startedAt: string, endedAt: string | null, task: string | null, label: string) {
    const start = Date.parse(startedAt), end = endedAt === null ? until : Date.parse(endedAt)
    const left = Math.max(from, start), right = Math.min(until, end)
    if (end < start) { diagnostics.push(`negative ${kind} interval for ${actor} at ${startedAt}`); return }
    if (right < left || right === left && !(start >= from && start <= until)) return
    spans.push({ actor, kind, task, label, startedAt, endedAt, from: iso(left), until: iso(right), durationMs: right - left, open: endedAt === null })
  }
  const tasks = new Map<string, TaskTiming>()
  const waits = new Map<string, { actor: string; at: string; kind: string; reason: string }>()
  let checkout: { actor: string; at: string; purpose: string } | null = null
  const counts: Record<string, Record<string, number>> = Object.fromEntries(Object.keys(snapshot.state.names).map((actor) => [actor, {}]))
  const markers = new Map<string, { actor: string; at: string; marker: ActivityMarker }>()
  function closeWait(id: string, at: string | null) {
    const wait = waits.get(id)
    if (wait) { span(wait.actor, `${wait.kind}-wait`, wait.at, at, id, wait.reason); waits.delete(id) }
  }
  function openWait(task: TaskTiming, at: string) {
    if (task.owner && task.wait && !(task.wait.kind === "checkout" && checkout?.actor === task.owner)) {
      waits.set(task.id, { actor: task.owner, at, kind: task.wait.kind, reason: task.wait.reason })
    }
  }
  function decision(event: Moment, task: TaskTiming) {
    if (task.latestPublicationAt && !task.responded && task.author !== event.actor && inWindow(event.at)) {
      responses.push({ task: task.id, actor: event.actor, publicationAt: task.latestPublicationAt, at: event.at, decision: event.command, elapsedMs: Date.parse(event.at) - Date.parse(task.latestPublicationAt) })
    }
    if (task.author !== event.actor) task.responded = true
  }
  for (const event of events) {
    if (inWindow(event.at)) {
      const actorCounts = counts[event.actor] ??= {}
      actorCounts[event.command] = (actorCounts[event.command] ?? 0) + 1
    }
    const command = event.data
    if (!command) {
      if (event.command !== "init") diagnostics.push(`event ${event.sequence} lacks structured data; timing state is incomplete`)
      continue
    }
    const task = tasks.get(event.row)
    switch (command.type) {
      case "checkout.take":
        checkout = { actor: event.actor, at: event.at, purpose: command.purpose }
        for (const [id, wait] of waits) if (wait.kind === "checkout" && wait.actor === event.actor) closeWait(id, event.at)
        break
      case "checkout.release": case "checkout.recover":
        if (checkout) span(checkout.actor, "checkout", checkout.at, event.at, null, checkout.purpose)
        checkout = null; break
      case "task.add": {
        const added: TaskTiming = { id: command.id, title: command.title, owner: command.owner === undefined ? event.actor : command.owner,
          wait: command.wait ?? null, firstPublicationAt: null, latestPublicationAt: null, agreedAt: null, author: null, agreedBy: [], publications: 0, reopenings: 0, responded: false }
        tasks.set(command.id, added); openWait(added, event.at); break
      }
      case "task.set":
        if (task) {
          if (command.title !== undefined) task.title = command.title
          if (command.wait !== undefined) { closeWait(task.id, event.at); task.wait = command.wait; openWait(task, event.at) }
        }
        break
      case "task.claim": case "task.release":
        if (task) {
          closeWait(task.id, event.at)
          task.owner = command.type === "task.release" ? null : command.owner ?? event.actor
          openWait(task, event.at)
        }
        break
      case "task.publish":
        if (task) {
          closeWait(task.id, event.at); task.wait = null
          task.firstPublicationAt ??= event.at; task.latestPublicationAt = event.at
          task.author = event.actor; task.agreedBy = [event.actor]; task.responded = false
          task.agreedAt = snapshot.state.investigators.every((actor) => task.agreedBy.includes(actor)) ? event.at : null
          if (inWindow(event.at)) task.publications++
        }
        break
      case "task.agree":
        if (task) {
          decision(event, task); task.agreedBy.push(event.actor)
          if (snapshot.state.investigators.every((actor) => task.agreedBy.includes(actor))) task.agreedAt = event.at
        }
        break
      case "task.reopen":
        if (task) {
          decision(event, task); task.latestPublicationAt = null; task.agreedAt = null; task.agreedBy = []; task.author = null
          if (inWindow(event.at)) task.reopenings++
        }
        break
      case "record.save": {
        if (command.kind !== "activity") break
        const marker = activityMarker(command.content)
        if (!marker || marker.task !== null && !tasks.has(marker.task)) { diagnostics.push(`invalid activity record ${command.id}@${command.rev + 1}; ignored`); break }
        const key = JSON.stringify([event.actor, marker.activity]), previous = markers.get(key)
        if (marker.event === "start") {
          if (previous) { diagnostics.push(`duplicate activity start ${event.actor}/${marker.activity}; ignored`); break }
          markers.set(key, { actor: event.actor, at: event.at, marker })
        } else if (!previous || marker.phase !== previous.marker.phase || marker.task !== previous.marker.task) {
          diagnostics.push(`unmatched activity stop ${event.actor}/${marker.activity}; ignored`)
        } else {
          span(event.actor, "activity", previous.at, event.at, marker.task, marker.phase); markers.delete(key)
        }
        break
      }
    }
  }
  if (checkout) span(checkout.actor, "checkout", checkout.at, null, null, checkout.purpose)
  for (const id of [...waits.keys()]) closeWait(id, null)
  for (const active of markers.values()) span(active.actor, "activity", active.at, null, active.marker.task, active.marker.phase)

  const observations = new Map<string, Map<string, Observation>>()
  const attempts = new Map<string, { seat: string; at: string; outcome: string }>()
  for (const entry of audit.entries) {
    // A later audit snapshot may contain old observations, but never use its future attempt outcomes.
    for (const [actor, observed] of Object.entries(entry.observations ?? {})) {
      if (Date.parse(observed.at) <= until) {
        const records = observations.get(actor) ?? new Map<string, Observation>()
        records.set(observed.at, observed); observations.set(actor, records)
      }
    }
    if (Date.parse(entry.at) <= until) for (const attempt of entry.attempts ?? []) attempts.set(attempt.id, attempt)
  }
  const runtimeEnd = Math.min(until, audit.lastObservation ? Date.parse(audit.lastObservation) : -Infinity)
  const runtime: Record<string, { statesMs: Record<string, number>; unobservedMs: number }> = {}
  for (const actor of Object.keys(snapshot.state.names)) {
    const records = [...observations.get(actor)?.values() ?? []].sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
    const statesMs: Record<string, number> = {}
    for (let i = 0; i < records.length; i++) {
      const observed = records[i]!, start = Math.max(from, Date.parse(observed.at))
      const end = Math.min(runtimeEnd, records[i + 1] ? Date.parse(records[i + 1]!.at) : runtimeEnd)
      if (end > start) statesMs[observed.status] = (statesMs[observed.status] ?? 0) + end - start
    }
    runtime[actor] = { statesMs, unobservedMs: until - from - Object.values(statesMs).reduce((sum, value) => sum + value, 0) }
  }
  const actors = Object.keys(snapshot.state.names).map((actor) => {
    const own = spans.filter((span) => span.actor === actor)
    const phases = [...new Set(own.filter((span) => span.kind === "activity").map((span) => span.label))]
    return { actor, name: snapshot.state.names[actor], commands: counts[actor] ?? {}, checkoutMs: unionMs(own.filter((span) => span.kind === "checkout")),
      checkoutWaitMs: unionMs(own.filter((span) => span.kind === "checkout-wait")), userWaitMs: unionMs(own.filter((span) => span.kind === "user-wait")), externalWaitMs: unionMs(own.filter((span) => span.kind === "external-wait")),
      declaredActivityMs: phases.length ? unionMs(own.filter((span) => span.kind === "activity")) : null,
      phasesMs: Object.fromEntries(phases.map((phase) => [phase, unionMs(own.filter((span) => span.kind === "activity" && span.label === phase))])), runtime: runtime[actor],
      wakes: [...attempts.values()].filter((attempt) => attempt.seat === actor && inWindow(attempt.at)).reduce<Record<string, number>>((out, attempt) => { out[attempt.outcome] = (out[attempt.outcome] ?? 0) + 1; return out }, {}) }
  })
  return { window: { from: iso(from), until: iso(until), elapsedMs: until - from, endBasis: options.until ? "explicit until" : "last ledger event, not current wall clock" },
    runtimeAuditAvailable: audit.available, runtimeObservedThrough: audit.lastObservation, actors, spans,
    tasks: [...tasks.values()].map(({ wait, author, agreedBy, responded, ...task }) => ({ ...task,
      agreement: task.latestPublicationAt ? task.agreedAt ? "agreed" : "awaiting peer" : "open",
      convergenceMs: task.firstPublicationAt && task.agreedAt ? Date.parse(task.agreedAt) - Date.parse(task.firstPublicationAt) : null })),
    peerResponses: responses, peerResponseMedianMs: median(responses.map((response) => response.elapsedMs)), diagnostics,
    limits: ["Checkout, waits, declared activities and runtime labels overlap; never add them as labor.",
      "Checkout wait is a recorded request until acquisition or withdrawal, not necessarily idle time or time blocked by another holder.",
      "Runtime labels are sampled observations; working includes tool waits. Unobserved time is unknown, not idle.",
      "Activity phases are optional actor declarations, not measured reasoning. Missing self-review markers do not imply zero self-review.",
      "Peer response and convergence are elapsed spans including other work; republishing resets the response clock.",
      "Counts use the selected window. Task publication/agreement timestamps preserve history through until; convergence may begin before from."] }
}

const duration = (ms: number | null | undefined): string => ms == null ? "not recorded" : `${(ms / 60_000).toFixed(2)} min`
const cell = (value: unknown) => String(value ?? "-").replaceAll("|", "\\|").replaceAll(/\r?\n/g, " ")
const table = (headers: string[], rows: unknown[][]) => [headers, headers.map(() => "---"), ...rows].map((row) => `| ${row.map(cell).join(" | ")} |`).join("\n")
export function renderInsights(report: ReturnType<typeof buildInsights>): string {
  return ["# Recorded coordination timing", `\nWindow: ${report.window.from} to ${report.window.until} (${duration(report.window.elapsedMs)}; ${report.window.endBasis}).`,
    "\n## Actor clocks (overlapping)", table(["Actor", "Checkout", "Checkout request wait", "User wait", "External wait", "Declared activity", "Runtime unobserved"], report.actors.map((actor) => [actor.actor, duration(actor.checkoutMs), duration(actor.checkoutWaitMs), duration(actor.userWaitMs), duration(actor.externalWaitMs), duration(actor.declaredActivityMs), duration(actor.runtime?.unobservedMs)])),
    "\n## Observed runtime and declared phases", ...report.actors.map((actor) => `${actor.actor}: runtime ${JSON.stringify(Object.fromEntries(Object.entries(actor.runtime?.statesMs ?? {}).map(([key, ms]) => [key, duration(ms)])))}; declared phases ${JSON.stringify(Object.fromEntries(Object.entries(actor.phasesMs).map(([key, ms]) => [key, duration(ms)])))}; wakes ${JSON.stringify(actor.wakes)}`),
    "\n## Task convergence", table(["Task", "First publication", "Latest publication", "Agreement at cutoff", "Elapsed to agreement", "Publications", "Reopenings"], report.tasks.map((task) => [task.id, task.firstPublicationAt, task.latestPublicationAt, task.agreedAt ?? task.agreement, duration(task.convergenceMs), task.publications, task.reopenings])),
    `\nPeer response median: ${duration(report.peerResponseMedianMs)} (${report.peerResponses.length} decisions).`,
    "\n## Recorded intervals", table(["Actor", "Kind", "Task / phase", "From", "Through", "Elapsed", "Open at cutoff"], report.spans.map((span) => [span.actor, span.kind, span.task ? `${span.task}: ${span.label}` : span.label, span.from, span.until, duration(span.durationMs), span.open])),
    "\n## Event counts", ...report.actors.map((actor) => `${actor.actor}: ${JSON.stringify(actor.commands)}`),
    "\n## Limits", ...report.limits.map((limit) => `- ${limit}`), ...report.diagnostics.map((warning) => `- Data warning: ${warning}`),
  ].join("\n")
}
