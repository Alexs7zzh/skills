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

## L11: ambiguous forwarded preview failure

An optional preview falls back to the approved generic icon. Its current terminal Error says only `preview unavailable`; the callback has a native reason distinguishing an accepted unsupported input, a provider refusal and a malformed local request, but drops it before the completion owner reports. The owner already knows whether the fallback was presented. Source and delivery checks establish that the existing report can retain both results, and no retained row can recover the missing reason. Propose the useful reporting work now. Do not wait for additional identical rows or claim that accepting the icon classifies every failure. These are supplied checked premises; there are no other source files or live services to inspect in this bounded read-only case.

## L12: automatic synchronization recovery

Every retry forwards a Warning while a synchronizer tries to catch up a second device. Reconnecting transport alone does not establish caught-up documents. The completion owner has bounded state for first/changed causes, attempts, start time and a positive caught-up observation. Ordinary recovered transients are accepted. Recovery can remain pending indefinitely, but no maximum acceptable impairment has been agreed. Propose the reporting change, the unresolved policy choice and what happens after any prolonged boundary when catch-up later succeeds or the account is replaced. No numeric duration may be inferred from the retry count. The supplied source descriptions are checked premises; this case permits only a proposal.

## L13: sample loss and a rare durable-write bug

An optional live meter may discard noncritical samples under product policy, but the accepted loss amount has never been quantified. The owner can retain offered/lost sample counts and observation start/end times; every discard currently forwards an Error. Exceeding the eventual accepted loss limit will count as an engineering failure. Propose a concrete magnitude policy decision and its producer enforcement without inventing a numeric cutoff. Separately, one observed write acknowledged a durable user edit and then discarded it, violating the stated durability contract. Its cause is checked: the writer acknowledges before the durable commit succeeds. Assess both concerns; there are no other files or live services in this read-only fixture.

## L14: accepted one-shot handling

Assess an intentional one-shot import refusal. It preserves the file, displays the approved size explanation and records the exact expected reason locally. Unknown reasons still forward one self-sufficient Error. The operation does not retry and every branch settles. There is no missing deciding evidence, accepted-limit dispute or forwarded incident. Do not change code, telemetry or the tracker.

## L15: existing voice availability boundary

The product explicitly requires one prolonged Warning after 30 seconds of continuously unavailable client connection, including initial and in-flight waits, with the later outcome retained. Server startup measures from the first refused player mint request; the three-second construction observation is local, and known configuration/construction Errors are immediate. Ordinary recovered transients within policy stay local. Existing episode state tracks original/changed cause, attempts, continuous unavailability and verified usable listening. Audit a proposal to remove the 30-second report and wait for fleet counts to select a new threshold. Only these checked premises and the existing product ruling are available; no runtime or state writes are authorized.
