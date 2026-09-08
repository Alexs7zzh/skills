import assert from "node:assert/strict"
import { initialState, taskById, transition, type Command, type Disposition, type State } from "../src/protocol.ts"
export const at = "2026-09-07T00:00:00.000Z"
export const env = (actor = "A") => ({ actor, at })
export const initial = () => initialState({ goal: "Explain every input and agree on the conclusions", names: { master: "manager", A: "alice", B: "bob" }, scope: "fix", source: "user request", at })
export function apply(state: State, command: Command): State {
  const result = transition(state, command)
  assert.equal(result.ok, true, result.ok ? "" : result.error)
  return result.ok ? result.state : state
}
export const add = (id: string, actor = "A"): Extract<Command, { type: "task.add" }> => ({ type: "task.add", ...env(actor), id, title: id, outcome: `Account for ${id}`, next: `Investigate ${id}` })
export const save = (id: string, actor = "A", rev = 0): Extract<Command, { type: "record.save" }> => ({ type: "record.save", ...env(actor), id, rev, kind: "evidence", title: id, content: `Argument ${id} version ${rev + 1}` })
export function publish(state: State, id: string, actor = "A", disposition: Disposition = "done", children: readonly string[] = []): State {
  return apply(state, { type: "task.publish", ...env(actor), id, rev: taskById(state, id)!.rev, result: { id: "argument", rev: 1 }, disposition, children })
}
export function rejected(state: State, command: Command, pattern: RegExp): void {
  const before = JSON.stringify(state), result = transition(state, command)
  assert.equal(result.ok, false)
  if (!result.ok) assert.match(result.error, pattern)
  assert.equal(JSON.stringify(state), before)
}
