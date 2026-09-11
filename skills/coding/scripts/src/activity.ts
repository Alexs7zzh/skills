// Optional declared intervals; records never change work, ownership or agreement.
import { latestRecord, taskById, type Command, type State } from "./protocol.ts"

export interface ActivityMarker { activity: string; event: "start" | "stop"; phase: string; task: string | null }

export function activityMarker(content: string): ActivityMarker | null {
  try {
    const value = JSON.parse(content) as Partial<ActivityMarker> | null
    if (!value || typeof value.activity !== "string" || !value.activity.trim()
      || !["start", "stop"].includes(value.event ?? "") || !(typeof value.phase === "string" && value.phase.trim())
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
    if (typeof phase !== "string" || !phase.trim()) throw new Error("phase must be a nonempty description")
    if (task !== undefined && !taskById(state, task)) throw new Error(`missing task ${task}`)
    if (marker?.event === "start") throw new Error(`activity ${id} is already started; stop it first`)
    next = { activity: id, event, phase, task: task ?? null }
  } else {
    if (!marker || marker.event !== "start") throw new Error(`activity ${id} has no open start`)
    next = { ...marker, event }
  }
  return { type: "record.save", actor, at, id: recordId, rev: previous?.rev ?? 0, kind: "activity", title: `${event} ${id}: ${next.phase}`, content: JSON.stringify(next) }
}
