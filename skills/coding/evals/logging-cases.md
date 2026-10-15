# Failure evidence fixtures

Evaluate only the design and diagnostic questions in these bounded fixtures. Use supplied guidance and the facts below; no source edits, external investigation or delegated agents. Return each ID with the missing facts, supported defects, recommended diagnostic ownership and the reason any episode recorder is or is not needed. State concrete fields and transitions, not general values. These are independent cases, not one application.

## L1: downloaded thumbnail

The call path is fetch URL → stream to temporary file → close → decode image → publish cache key → assign the current image. It keeps the previous image on failure. HTTP 200 is followed by curl write callback failure. The HTTP completion logs Error immediately, then cleanup closes the archive and ignores its failed-close result. Native storage reports its own cause. One requested load has no automatic retry. A future explicit load is a new operation. A superseded image callback is discarded. Advise the logging design across this flow, including when classification occurs and what constitutes success.

## L2: document synchronizer

A background synchronizer retries until documents are visible on the second device. The transport may connect while subscription catch-up still fails. Every retry logs a remote Warning; a process-session summary counts total connections and successful HTTP responses. The recorder starts only after the first subscription succeeds. Replacing the account resets the retry counter and sets the old recorder's success flag. Local documents remain safe. Ordinary short recoveries should stay local; more than two minutes of missing synchronization is actionable under the supplied product policy. Specify the appropriate diagnostic lifetime and required endings, including early failure, continued impairment and recurrence.

## L3: valid one-shot export

A user explicitly exports a document. There is no retry. The operation result records target, stable native cause captured before cleanup, elapsed operation time and success or cancellation. An error line is forwarded only for unexpected failures, once at the operation owner. An intentional user cancellation is local. The caller receives the result and preserves the source document. All branches settle and release the temporary file. A later export has its own operation ID. Is another session or episode recorder needed? Explain any actual gap without inventing one.

## L4: existing image-stream recovery

An existing recorder opens on loss of usable video for the selected source. It retains original identity/time, bounded first and changed causes, attempt count and impairment duration. Matching usable frames close it as recovered. Source replacement and departure close it as abandoned, never recovered; an unobserved process death leaves the ending unknown. Ordinary recoveries stay local. A product-specified prolonged threshold emits one remote update, followed by the same owner's recovered or terminal record. Failed startup before the first frame also opens the recorder. Late completions are generation-fenced; a failure after recovery starts another episode. Source resolution settling while a usable image is displayed is not treated as missing video. The sink includes these reports in the intended build. Audit the design and state whether it needs another diagnostic stream.

## L5: ordinary successful startup log

An existing local startup Info line reports the application build version. Support uses it to identify the installed build in an attached local log. It reports no failure or retry. Should this line gain an operation or episode recorder, impairment duration or recovery fields?

## L6: removal evidence before a live kick

A server removes departed participants from a voice room. Every successful removal emits a remote Warning with room, participant, request and timing. A client separately reports being kicked while it still wants that room. Most removals are expected; the successful-removal rows alone establish no harmed participant. The server already has a bounded participant record, but deletes it at departure. It can exit before a later client report arrives, and no cross-process context lookup currently exists. The proposal is to keep the warnings unchanged because a future kick might need attribution. Judge that proposal and the alternative of retaining context for attachment to the kick report. Specify what must be known before choosing; do not implement or investigate the product.

## L7: departure without a callback

A client stops receiving old-room audio and advances to the next world when a Leave callback misses its waiting budget. Shutdown may end the process without that callback. Two remote warnings describe the same timeout and summary. There is no measured successor impairment or established contract violation in the supplied evidence. The concern offered for keeping both warnings is that the service might retain a ghost participant. The client cannot inspect authoritative membership; the service owns membership and expiry, but its detection/reporting coverage has not been checked. Does the timeout establish trouble worth reporting, and which observer should report which concern? Distinguish missing evidence from a safe outcome.

## L8: batch lease cleanup

A worker finishes a batch and makes its result available. Its lease-release acknowledgment sometimes disappears during worker shutdown. The coordinator owns lease expiry and can observe whether an expired lease still consumes capacity. Worker logs currently forward each missing acknowledgment as a warning. The policy accepts an unacknowledged release if expiry frees capacity within one minute; capacity retained after that limit needs engineering action. The coordinator retains job, worker, lease identity, release attempts and expiry in bounded lease state. Design the report, trigger and retained context. Explain whether the worker's missing acknowledgment and the coordinator's retained capacity are the same claim.

## L9: hidden invariant violation

A service detects that the same reservation has been granted to two owners, violating its exclusivity contract. It fences the duplicate before either user sees a failure and then retries safely. The proposed logging change would wait for retries to exhaust or visible user impairment before reporting anything. Judge the trigger and owner. Does successful containment remove the need for engineering evidence?

## L10: required independent success evidence

A payment service records each successful transfer in a durable audit stream required for reconciliation. A browser records a separate actionable presentation failure if the receipt cannot be displayed. The browser can close before the service finishes, and the audit must survive it. The proposal is to suppress success records and retain them only in browser memory for attachment to receipt failures, on the grounds that related events should be combined. Judge the proposal and the reporting responsibilities.
