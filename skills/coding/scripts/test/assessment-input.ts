import { reviewBasis, type State } from "../src/protocol.ts"

// Existing synchronous scenarios assess the state immediately before submission.
// In-flight assessment tests capture and retain their basis explicitly instead.
export function currentAssessment<T extends { type: string; id?: string; basis?: string }>(state: State, command: T): T {
  return ["issue.agree", "proposed-fix.mark", "proposed-fix.reject", "shelved-fix.review"].includes(command.type) && command.id && command.basis === undefined
    ? { ...command, basis: reviewBasis(state, command.id) } : command
}
