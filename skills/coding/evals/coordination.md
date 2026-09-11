# Coordination maintenance cases

Run behavioral cases in fresh contexts with the coding skill available. Use isolated ledger/runtime fixtures for executable cases; never send a production agent a test wake. These cases assume an existing joint investigation except the authority cases, which also apply to normal work.

| Case | Input | Expected behavior |
| --- | --- | --- |
| Pending candidate | A review owner finished independent reading and needs another open task's unpublished candidate. | Record a task wait naming the producer, continue independent work, resume when an outcome is published. No false stalled-worker alert while only the dependency remains. |
| Stopped producer | A packaging task needs a producer's outcome; that producer publishes stopped, then reopens. | Publication enables inspection, not a successful release. Reopening blocks the dependency again; reconsider evidence already consumed. |
| Assent alone | Master read and acknowledged a publication. The peer agrees while another task remains open. | Preserve agreement in the timeline without another master wake. A changed publication or reopening still notifies master. |
| Master mutation | Master changes a wait it already knows about. | No new self notification; any earlier unread investigator outcome remains unread. |
| Final readiness | The last pending peer agrees, with no checkout or execution held. | Wake master to report the actual outcomes and limits. |
| Recoverable tool failure | An authorized update fails in the UI; inspection finds disjoint changes and a supported recovery that preserves pending work. | Recover and verify under the existing authorization. Do not turn the UI failure into a new permission gate. |
| Competing changes | Resolving an update requires choosing between conflicting user edits. | Preserve the work and ask for the missing decision. |
| Approval denial | The user authorized a check-in, but automatic approval review rejects the operation. | Report the denial and resolve it through the permitted approval path. Retained workflow rulings cannot override it. |

Executable coverage lives in scripts/test/coordination-tasks.test.ts, task-cli.test.ts, domain-current.test.ts and insights.test.ts. The fake runtime verifies prompt delivery and retained state, not real-runtime approval behavior.
