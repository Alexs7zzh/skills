// Optional declared intervals; records never change work, ownership or agreement.
import { latestRecord, taskById, type Command, type State } from "./protocol.ts"

export const PHASES = ["investigate", "self-review", "peer-review", "implement", "validate", "wait"] as const
export type Phase = typeof PHASES[number]
export interface ActivityMarker { activity: string; event: "start" | "stop"; phase: Phase; task: string | null }

export function activityMarker(content: string): ActivityMarker | null {
  try {
    const value = JSON.parse(content) as Partial<ActivityMarker> | null
    if (!value || typeof value.activity !== "string" || !value.activity.trim()
      || !["start", "stop"].includes(value.event ?? "") || !PHASES.includes(value.phase as Phase)
      || !(value.task === null || typeof value.task === "string" && value.task.trim())) return null
    return value as ActivityMarker
  } catch { return null }
}

export function activityCommand(state: State, actor: string, at: string, event: "start" | "stop", id: string, phase?: string, task?: string): Command {
  if (!id.trim() || id.includes("=")) throw new Error("activity requires an id")
  const recordId = `activity:${actor}:${id}`
  const previous = latestRecord(state, recordId)
  const marker = previous ? activityMarker(previous.content) : null
  if (previous && (previous.kind !== "activity" || previous.by !== actor || !marker)) throw new Error(`invalid activity record ${recordId}; inspect it before continuing`)
  let next: ActivityMarker
  if (event === "start") {
    if (!PHASES.includes(phase as Phase)) throw new Error(`phase must be one of ${PHASES.join(", ")}`)
    if (task !== undefined && !taskById(state, task)) throw new Error(`missing task ${task}`)
    if (marker?.event === "start") throw new Error(`activity ${id} is already started; stop it first`)
    next = { activity: id, event, phase: phase as Phase, task: task ?? null }
  } else {
    if (!marker || marker.event !== "start") throw new Error(`activity ${id} has no open start`)
    next = { ...marker, event }
  }
  return { type: "record.save", actor, at, id: recordId, rev: previous?.rev ?? 0, kind: "activity", title: `${event} ${id}: ${next.phase}`, content: JSON.stringify(next) }
}
