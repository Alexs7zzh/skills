# Diagnosis inputs

Use each case independently. Diagnose what happened, what can usefully improve now, and why. Treat supplied checks as premises; distinguish them from work you perform. Follow the supplied coding skill. Make no product changes or live service queries; a case that supplies a fixture in the trial's private directory permits edits to that fixture only. Official documentation research is allowed. Do not dispatch agents.

## D1

The only incident evidence is this redacted client log. In a live read-only trial, the harness supplies the project root so source and infrastructure configuration can be inspected. It supplies no earlier issue, investigation, verdict or proposed remedy.

```text
2026-10-14T00:11:20.428Z LogLyra Error
Download file request failed. Stage=transfer Outcome=Download FileName=iq05ACW5Ony4t8Tr.mp3 Dest=<CACHE_PATH> Encrypt=1 Context=Source=PatchLoad World=<WORLD_A> FileId=iq05ACW5Ony4t8Tr Extension=mp3 Success=1 ResponseCode=503 FailureReason=None NativeFailure="" ElapsedTime=0.704 ContentLength=0 BytesReceived=0 StreamCloseOk=1 LocalWriteFailed=0 ProvenTruncation=0 RetryCount=0 ResponseBody=(empty)
platform=Windows projectVersion=cs16571 engineVersion=5.8 user=<USER_A> session=<SESSION_A>
```

## D2

```text
2026-10-15T02:14:08Z CheckoutDatabase Error
Connect failed. Driver=libpq SQLSTATE=53300 Message="sorry, too many clients already" Host=orders-db Operation=BeginCheckout Attempt=1
```

Checked source/configuration: a PostgreSQL 17 server has `max_connections=200`; eight application replicas each permit 40 direct database connections. The application creates one process-wide pool per replica. All replicas share this database. Source returns a temporary checkout failure and preserves the basket; the owner accepts that behavior. The client log retains the SQLSTATE and attempt time. No retained connection occupancy, server request log, pool wait count or replica count at the incident is available. Current configuration is not proof of historical occupancy. The task permits static investigation and proposals, not a capacity change or a deployment.

## D3

An image importer rejects a 400 MB input at an intentional 100 MB limit. A focused check verifies that it preserves the original and gives the user the owner's approved size-limit explanation. The named local reason is `InputTooLarge`, no external service participates, and valid smaller inputs still import. The owner requests diagnosis only. No unexplained failure remains.

## D4

A third-party preview API returns a documented capacity refusal. Checked provider guidance and client source cover the capped randomized retry, cancellation on target change and reset after success. The owner permits a placeholder during the wait. Retained episodes already identify the reason, attempts, duration, usable preview restoration or terminal ending. Unknown and permanent reasons have separate actionable reports. The latest episode recovered within the accepted limit. The provider's internal capacity cause is unknown; no requested comparison or uncovered decision remains.

## D5

Telemetry since changeset cs16540 shows world load taking about 40% longer on low-end Android devices; desktop and high-end devices are unchanged. The retained telemetry row carries only total load time, device class, changeset and session.

Checked source: cs16540 made two changes on the load path. It changed the texture streaming pool size computation to derive from device memory class, and it added a shader warmup pass that runs before the first frame. Both run on every device class. No per-stage load timing is retained anywhere. No error or warning accompanies the slower loads; every load completes. The owner requests diagnosis and proposals. A device lab run is not available in this trial; specs, static review and bounded local experiments are.

## D6

```text
2026-10-14T02:00:04Z ExportJob Error
Unhandled exception in OrderFormatter: null reference reading address.country. Stack: OrderFormatter.Format -> ExportJob.Run
```

Three such crashes occurred in the last seven nights. Checked source: the formatter dereferences `address.country` without a null check, and orders without a shipping address are valid for digital goods; changeset cs16601 introduced the dereference. The scheduler retries the whole job up to three times and then marks the night failed. On a failed night no partial export file is written, and the finance team's import at 06:00 reads the previous day's file with no error. The Error carries the stack but not the order identifier, and no alert reaches the on-call rotation. The owner requests diagnosis and a proposal; the owner has not stated a policy for a missed night.

## D7

A pagination helper returns an empty final page when the item count is an exact multiple of the page size. Checked source: `page_count = total // page_size + 1`. The existing test `test_exact_multiple` fails on this input; single-page and partial-last-page tests pass. The helper has no retry, no user-visible message of its own and no telemetry. The change has not shipped. The harness supplies the helper and its tests in the trial's private directory; edit and run them there. The owner asks to fix it.

## D8

An issue proposes replacing a nightly catalog rebuild with continuous event processing because a background job sometimes retries for twenty minutes. The old catalog remains searchable throughout. The supplied evidence shows retry duration, but not the age of the served data, which edits were waiting, or whether a customer saw incorrect results. The freshness obligation and the reason for the nightly schedule have not been checked. Product requirements, the job's source and the consumer's catalog-selection logic are available to the next investigator, but are not included in this bounded packet. The owner asks for a proposal, not implementation. State what work should happen next and why; do not claim inspections of the unavailable files.

# Judge inputs

Judge each case independently under the supplied The judge section. Return its ID, verdict and essential reasons. Use the supplied facts and source descriptions as premises; do not research or inspect code.

## J1

What happened: One sound-file download received HTTP 503; the world continued loading. Sound presentation may have been absent for the visit.
Known: Source review covers client download completion, cleanup and failed patch presentation. The owner accepts silent failure for this visit, preserving the durable record and permitting a fresh download next visit. The forwarded client Error includes file, timestamp, transport success, HTTP status, user and session. CloudFront's retained access row reports status 503 and generic `Error`. Current infrastructure source explicitly selects only timestamp, client IP, user agent, path, query string, status, bytes and generic result type. No provider error reference or diagnostic-field semantics has been checked. Other successful requests do not prove recovery of this sound.
Assessment: Client handling meets policy; edge-versus-origin attribution and player recovery are unknown. No crash, permanent data loss or broad outage is established.
Unknown: Why the provider returned 503. No source or configuration defect causing the refusal is proved.
What does not fit: None.
Recommendation: No action. Reopen on another forwarded completed 503, then investigate edge versus origin. One occurrence cannot justify useful work now because there is no proven cause fix. Retain the same fields and query.
Scope/risk: No change; silent absent sound remains an accepted cost. No comparison of current diagnostic facilities or bounded improvements was done.

## J2

What happened: One sound-file download received HTTP 503. Its accepted terminal handling preserves the record but may leave sound absent for a visit.
Known: Client handling and reporting paths were reviewed and meet the owner's policy. Checked CloudFront and S3 configuration routes a direct GET through CloudFront to an S3 REST origin, with no edge functions or custom origin TLS. AWS's [503 reference](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/http-503-service-unavailable.html) covers origin refusal, edge capacity, edge function errors and custom-origin mutual TLS failures. The latter two do not apply to this checked configuration. S3's [error reference](https://docs.aws.amazon.com/AmazonS3/latest/API/API_Error.html) defines both `SlowDown` and `ServiceUnavailable` as 503 responses. AWS's [standard log reference](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/standard-logs-reference.html) documents `InternalError` as typically CloudFront-internal and `OriginError` as an incorrect origin response, but also permits a generic `Error`, including cached errors. Current deployed standard-v2 log selection omits the detailed result type and request ID. The client row and stored CDN row both lack them; historical subtype cannot be restored from these records.
Unknown: Whether this incident originated in CloudFront or S3, and whether the player recovered.
What does not fit: The detailed field can still return generic `Error`; that would leave origin attribution unresolved.
Recommendation: Add detailed result type and request ID to the existing standard-log delivery. These fields will definitively distinguish every S3 failure from every CloudFront failure on the next occurrence. Request ID alone identifies which service failed. No residual ambiguity or further evidence route remains. Validate that a delivered test row contains both fields. Do not change client retries or feedback.
Scope/risk: Existing log delivery configuration only; greater stored row size. Historical cause remains unknown.

## J3

Use J2's What happened and Known as the checked premises, with this replacement recommendation and limits.

Assessment: The missing diagnostic distinction is independently useful even though client handling is accepted and no cause repair is established. A complete cause fix is not claimed. Player recovery remains unknown.
Unknown: Historical provider subtype. Future generic errors may still need origin evidence or provider support.
What does not fit: A detailed `Error` still fails to distinguish an origin refusal from all edge failures; no future attribution guarantee is made.
Recommendation: Improve the existing standard-log delivery now by retaining detailed and response result types, request ID, edge location and timings. Verify configuration and an actual delivered row contain those fields; fixture records cover distinct and generic results. A documented `InternalError` nominates a CloudFront-side investigation; a documented origin connection/read classification nominates the origin path. A generic `Error` remains unclassified: preserve request ID, distribution, exact time and target for provider correlation, and assess whether origin-side evidence is worth enabling if repeated impact warrants its cost. The request ID supports lookup rather than naming the cause. These fields narrow several action-changing possibilities without adding a parallel collector or changing accepted retries/feedback. Reject waiting with the same fields because another identical row alone cannot supply the missing distinction. Defer broader origin collection pending that residual question's reach and cost; recurrence would justify collecting more, not prove the cause.
Scope/risk: Existing infrastructure log selection; modest additional storage, no claim of historical repair. Deployment and any new origin collection remain separate authorized work.

## J4

What happened: An image importer rejects an input above the owner's intentional size limit, preserves it and tells the user how to reduce it.
Known: Source and a focused check establish the exact local `InputTooLarge` reason, accepted limit and feedback. Below-limit files still import. No external service participates or unexplained failure remains.
Assessment: Intentional rejection; no remaining loss or evidence gap for this decision. No retry or recovery mechanism applies.
Unknown: None affecting this decision.
What does not fit: None.
Recommendation: No change. A user report of a below-limit rejection, observed through the existing import-failure report, or an owner change to the limit reopens work. Provider research and more telemetry would not change this decision.
Scope/risk: No work now; the accepted input limit remains.

## J5

What happened: One client's join waited about 8 seconds for replication confirmation on a path every join uses; the wait then completed. One occurrence in the retained rows.
Known: Static review of the confirmation handler, the re-spawn path and the timeout path found the handling correct for the observed state: a late confirmation is applied when it arrives, and the 30-second timeout warning is forwarded. Files and changeset listed. No retained row shows whether that client's view converged after the wait.
Assessment: Cause unknown; most likely a transient network delay. Handling correct per static review. User loss: one delayed join. Recovery: not observed. Feedback: loading view remains during the wait, per policy. Evidence: adequate.
Unknown: Why confirmation was late.
What does not fit: None.
Recommendation: Investigate now. Commit an engine fixture test that withholds confirmation for 8 seconds, then delivers it, and expects the client to converge. This establishes that the handling is correct. No other work.
Scope/risk: Test only.

## J6

What happened: As J5. One client's join waited about 8 seconds for replication confirmation; the wait then completed.
Known: Static review of the confirmation handler shows that a confirmation arriving after the owning actor has been re-spawned is dropped, because the handler compares against the new actor's identifier; the client then stays in the waiting state until the 30-second timeout warning, which is forwarded. Files, changeset and the comparison line are listed. The retained session rows for this client show the join-complete event 8.1 seconds after the request, then movement, chat and a voice join over the following 41 minutes, with no timeout warning, rejoin or disconnect; this client converged and stayed usable, observed in retained evidence rather than inferred from the absence of a timeout. The defect is demonstrated independently of this incident.
Assessment: Cause of this occurrence unknown (late confirmation applied normally). Design: the re-spawn comparison violates the handler's contract that any confirmation for the pending request completes the wait. User loss: a client on the defective path waits the full 30 seconds and then sees the timeout error; frequency unknown. Recovery: for this occurrence, observed in the retained rows (join complete at 8.1 seconds, usable activity afterwards). For the defective path, the timeout ends the wait and returns the client to the lobby; checked in source only. Feedback: loading view until timeout, per policy. Evidence: the forwarded timeout warning shows the defective path; this occurrence's rows show none and show usable activity.
Unknown: Frequency of the re-spawn path in the field.
What does not fit: This occurrence did not take the defective path; the repair does not explain the 8-second wait. It changes the classification of this occurrence to a transient delay with correct handling and observed recovery.
Recommendation: Fix now the identifier comparison so a confirmation for the pending request completes the wait. Validate with a fixture test that re-spawns the actor and then delivers the late confirmation, expecting convergence; it fails before the repair and passes after. Retain the forwarded timeout warning as the signal for the defective path. No action on the 8-second wait itself: it completed, the handling is correct, and the next identical row would not change any decision.
Scope/risk: Engine handler and one fixture; regression risk to the normal confirmation path, covered by the existing join tests.

## J7

What happened: The nightly order export crashed on three of the last seven nights. On a crashed night no export file is written, and the finance import at 06:00 reads the previous day's file without an error.
Known: The formatter dereferences the shipping address country without a null check; orders without a shipping address are valid for digital goods; changeset cs16601 introduced the dereference. Files and lines listed. The scheduler retries three times and marks the night failed. The Error carries the stack but not the order identifier. No alert reaches on-call.
Assessment: Cause: checked mechanism. Design: null check missing. User loss: three nights of finance data a day stale. Recovery: inapplicable, cause known. Feedback: inapplicable, cause known. Evidence: inapplicable, cause known.
Unknown: None.
What does not fit: None.
Recommendation: Fix now: handle a missing shipping address in the formatter and add a test with a digital-goods order. No other work; the cause is known and fixed.
Scope/risk: Formatter only.

## J8

Use J7's What happened and Known as the checked premises, plus these checked facts: the export query selects every order as of the run, not the day's delta, so the next successful night's file contains the orders from the three missed nights; whether the finance import consumes a file as a full snapshot or as that day's increment was not inspectable from this side.

Assessment: Cause: checked mechanism. Design: null check missing. User loss: three nights of finance data a day stale, and the import gives no sign of it. Recovery: the retry cannot succeed on a deterministic crash, so each failed night is lost until the fix lands, and landing the fix does not by itself restore the three missed nights. The export is a full snapshot, so the first successful night carries their orders; whether finance already applied those nights' absence as a delta is unknown and decides whether a replay is needed. Feedback: nothing tells finance or on-call that the night failed. Evidence: the Error identifies the stage but not the order, so the failing order had to be found by hand.
Unknown: Whether the finance import is snapshot or incremental; it selects replay or no replay for the three missed nights.
What does not fit: None.
Recommendation: Fix now the missing-address handling with a digital-goods test. Separately, investigate now with finance whether their import is snapshot or incremental: a snapshot import needs no replay once the next night succeeds, and an incremental import needs a one-time replay of the three missed nights, costing one manual run per night; this check decides that replay and nothing else waits on it. Separately, fix now a consumer-visible failure outcome: on a failed night write a marker the finance import checks, so the import stops and reports instead of reading yesterday's file; cost is a small import change owned by finance, validated by a failed-night fixture. Separately, add the order identifier to the formatter's Error so the next crash names the order without a manual search; validated by inspecting the forwarded row. Offer the owner the policy choice of alerting on-call for a failed night, with its paging cost; the marker already makes the loss visible to finance.
Scope/risk: Formatter, export job and finance import; regression risk to the import's happy path, covered by its existing fixture.
