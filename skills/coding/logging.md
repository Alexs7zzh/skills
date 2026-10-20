# Design failure evidence

Read when adding or judging logs, or examining failure evidence, file-loading failures, or retry and recovery behavior. For diagnosis, use [diagnosis.md](./diagnosis.md) for assessment and response selection. Apply the questions to the affected flow. Answer them in the existing design, proposal or review note; they do not require a separate document. Use the project's severity and monitoring policy.

## Choose the unit

- **Operation:** one requested outcome for one target, such as loading a thumbnail. It can contain several stages and attempts.
- **Attempt:** one execution that may fail and be retried within that operation.
- **Episode:** loss of a required capability until verified usable recovery or an explicit terminal ending. One voice connection can contain several episodes; each can contain several attempts.
- **Session:** a named lifetime, such as an application process, login, world visit or connection. State which one. A session ID correlates events; it does not define an operation or prove recovery.

For an ordinary informational log with its own purpose, answer only who uses it, what decision it supports and where it is delivered. The failure-specific rows below are inapplicable. A successful event retained only to explain a later failure belongs to that failure's evidence design. For an affected failure or recovery flow, answer:

| Question | Required answer |
| --- | --- |
| What is the outcome? | The requested capability, target and observation that proves it usable. A completed download is not a displayed image; an accepted connection is not usable voice. |
| What warrants a report? | For a failure report, the user impairment, violated system contract or unresolved failure classification, its supporting observation and the engineering action the evidence enables. Distinguish observed, suspected and unknown impact. A contract violation can warrant reporting before users notice; an internal timeout alone proves neither impairment nor a defect. |
| When is reporting warranted? | The failure, state or duration boundary that makes the concern actionable under product policy. Capture context before it disappears. Emit failure reports at this boundary; use the retention and ownership checks below to justify earlier precursor emission. For temporary investigation evidence, name the unresolved decision and the condition for retiring the reporting. |
| Where does evidence originate? | The stage that knows the native cause or decision, and the point where cleanup, another call or replacement state would destroy it. Capture there before deferring emission. |
| Who owns the result? | The owner that can observe the reported concern and combine stage outcomes to decide completion, recovery or deliberate absorption. Name what failures can happen before that owner exists. |
| What context survives until then? | The existing operation or entity state retaining the needed precursor facts, its identity, size bound and expiry or cleanup. Attach that context to the actionable report. Name any evidence lost before the reporting boundary. |
| What reaches engineering? | The primary report and its destination, actual severity/filter path, retained cause and target, and the decision its fields enable. For separate reports, name the distinct decision or observation each supplies and why context on the primary report does not suffice. |
| What is accepted? | The exact expected reasons and fallback under product policy. Keep unknown reasons distinct. An expected trigger does not prove correct recovery. |

If missing identity affects the interpretation, apply diagnosis.md's User loss provenance check.

## Concrete reporting proposals

For a forwarded failure, apply each matching row after checking the available source and retained evidence. These are conditional proposals, not a requirement to add telemetry to every assessment. A rare actionable bug still needs repair; neither a live call site nor a low count classifies an outcome as accepted. Do not propose waiting for more identical reports.

| Checked condition | Propose this work |
| --- | --- |
| The error hides an action-changing cause or outcome | Retain the causal result before it disappears, and carry the relevant recovery or fallback outcome to the owner that decides completion. Reuse its report; name the distinction engineering can then decide. |
| Automatic recovery forwards intermediate attempts | Move reporting to the episode decision below. Keep accepted attempts local; retain verified usability, failed recovery, any policy-defined failure-to-recover boundary and its later ending. |
| Magnitude or loss determines whether attention is warranted | Propose the quantity, unit and observation window, product or measurement basis, code predicate, delivery and reset/rearm condition. A percentage needs its numerator and denominator. Enforce the agreed predicate before forwarding: accepted values stay quiet or local; a threshold defining engineering failure emits Error. Preserve feature-specific Warning boundaries for operational degradation. If no cutoff is supported, name that policy decision and how to settle it rather than inventing a number. Unknown classifications and contract violations bypass accepted-value filtering. |
| The exact reason and its handling are already accepted | Encode that classification at the producer or completion owner and keep it local, preserving required feedback and still-actionable reasons. |

## Retain context and report at the owner

Prefer retaining precursor facts in existing bounded state and attaching them when trouble becomes actionable over emitting each fact for later correlation. Routine success, intermediate transitions and accepted waits need no remote failure report merely because they might explain a future incident.

Before replacing a forwarded stream, identify its actionable coverage and establish the acceptance policy and replacement report/delivery. Preserve that coverage until the replacement is ready, then remove intermediate forwarding in the same change. An unset limit needs a bounded policy decision; it does not authorize interim demotion or require a new collector. Explicitly accepting less coverage is an owner policy choice with a stated cost. If a new map or buffer is needed, justify its decision value, lifetime and cost against existing state; a logging change does not automatically need another recorder.

Choose the reporting location from the claim. A client can observe its lost capability; an authoritative service can observe invalid membership or leaked resources. A missing client callback can follow disconnection or process exit and cannot establish persistent remote state. An observer's unknown result is neither confirmed success nor proof of a defect elsewhere. If the suspected problem is remote, identify an owner that can verify it and the condition that makes it actionable. If no observer can distinguish the alternatives, state that limit and the smallest check that would change the decision.

When context and the failure are in different processes, check whether the reporting owner can obtain the retained context, including after disconnect or producer shutdown. A server-side map is useful only if it survives long enough and the relevant report can reach it. Prefer one combined report when these facts are available together. Keep separate correlated evidence when an independent concern, required audit, or demonstrated lifetime or delivery gap needs it. State the shared identity and coverage limits; matching identity and time alone do not prove causation. Avoid coupling product behavior or shutdown to diagnostic delivery.

## Follow a file through completion

For file loading and derived assets, trace the stages that participate: identify the source → fetch or open → write and close → validate or decode → publish → present. At each participating stage, name its failure result, the owner receiving it and the diagnostic that preserves its cause. Include failure before a request is created and failure first discovered at close.

- Capture a native error immediately after the failing call. A later filesystem probe or cleanup can replace it.
- Finalize the stream before assigning the terminal classification. HTTP success does not prove local writing succeeded; transport failure can be the consequence of a refused write.
- Preserve the distinctions that change handling or engineering action: network, response status, local storage, invalid content, decoder/provider, publication and stale or cancelled work. Map at the owner with the facts, not by downstream string matching.
- Check which earlier owner already reports the cause. A caller adds target or outcome evidence when needed; it does not promote a known local reason merely because the final operation failed.
- State what remains visible after failure: the old image, fallback, empty view or unavailable capability. Check which owner settles the request and releases resources on each exit.
- For shared files, apply diagnosis.md's Evidence prerequisite before adding observations of collisions or deletion failures. A unique extra output does not establish that the default output is unique.

For a thumbnail loaded without automatic retry, the operation can own one terminal result. It does not need a new episode recorder solely because it has several stages.

## Retry and recovery require an episode decision

If a flow retries, reconnects or repeatedly tries to restore a capability, either use episode-based evidence or state why the existing operation result answers the same questions. Name the existing report and its coverage when reusing it. “There is a session summary” is insufficient without that coverage.

Answer these questions before implementing the logging, or before accepting it in review:

1. What opens the episode, which capability and target does it concern, and what scope distinguishes a new episode from another attempt?
2. What observation closes it as recovered? Which endings mean exhaustion, cancellation, target replacement, departure or shutdown instead? A lost process or missing ending leaves the result unknown.
3. Which owner retains the first and changed causes, attempts, start time, elapsed impairment and final outcome? State the bounded representation for changed causes and the clock's meaning.
4. Which existing report carries those facts? Does its lifetime cover early failures, pending waits and teardown? Name any gap rather than adding a parallel stream by default.
5. When does engineering need a report? Define a policy-backed failure-to-recover boundary for a capability that can remain pending. Keep intermediate attempts local unless they establish an independently actionable failure. Record actionable failed recovery once; a retry or success callback does not decide usable recovery.
6. If prolonged impairment is reported while recovery continues, how does the same owner later report recovery or termination? Waiting until session shutdown must not hide a permanently pending operation.
7. What resets after recovery so a new failure is visible? What fences stale completions and keeps a target change from closing the successor's episode?

Default outcome mapping: an ordinary verified recovery within the accepted limit stays local unless product policy requires an outcome report; prolonged impairment emits a bounded report followed by its verified recovery or terminal ending; actionable failed recovery emits one report. Observed cancellation or shutdown is a terminal non-recovered ending; an unobserved process loss or missing ending is unknown. Use the concrete reporting menu for an unset limit, and preserve an existing explicit product boundary rather than replacing it with a fleet-derived cutoff.

Prefer a bounded outcome summary over a remote error for every expected attempt. A terminal invariant failure can require immediate reporting; explain that exception. A recovered episode still exceeds the product's loss limit when its measured duration does, so recovery alone is not a reason to discard it.

For voice, usable recovery concerns the required listening or speaking capability, not just a successful join. For a browser, distinguish no usable picture from a usable picture whose requested size is still settling. Apply the feature's accepted feedback policy separately from evidence design.

## Verify the decision

Select checks for the changed evidence: one stage failure, a failure discovered during finalization, an expected transient followed by usable recovery, prolonged failure followed by recovery, cancellation or target change, and failure again after recovery. Use only applicable cases. Check the final destination and retained fields, not merely that a logging call ran. A logging repair establishes better evidence; claim repaired functionality only when the affected operation was checked too.
