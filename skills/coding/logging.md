# Design failure evidence

Read when adding or judging logs, file-loading failures, or retry and recovery behavior. Apply the questions to the affected flow. Answer them in the existing design, proposal or review note; they do not require a separate document. Use the project's severity and monitoring policy.

## Choose the unit

- **Operation:** one requested outcome for one target, such as loading a thumbnail. It can contain several stages and attempts.
- **Attempt:** one execution that may fail and be retried within that operation.
- **Episode:** loss of a required capability until verified usable recovery or an explicit terminal ending. One voice connection can contain several episodes; each can contain several attempts.
- **Session:** a named lifetime, such as an application process, login, world visit or connection. State which one. A session ID correlates events; it does not define an operation or prove recovery.

For an ordinary log that reports no failure or recovery, answer only who uses it, what decision it supports and where it is delivered. The failure-specific rows below are inapplicable. For an affected failure or recovery flow, answer:

| Question | Required answer |
| --- | --- |
| What is the outcome? | The requested capability, target and observation that proves it usable. A completed download is not a displayed image; an accepted connection is not usable voice. |
| Where does evidence originate? | The stage that knows the native cause or decision, and the point where cleanup, another call or replacement state would destroy it. Capture there before deferring emission. |
| Who owns the result? | The owner that combines stage outcomes and decides completion, recovery or deliberate absorption. Name what failures can happen before that owner exists. |
| What reaches engineering? | The primary report and its destination, actual severity/filter path, retained cause and target, and the decision its fields enable. Name earlier reports that already cover it. |
| What is accepted? | The exact expected reasons and fallback under product policy. Keep unknown reasons distinct. An expected trigger does not prove correct recovery. |

Missing user identity is a provenance question. Check build target, startup timing, when identity is attached and possible test producers before claiming player impact or test origin. State unknown provenance as unknown.

## Follow a file through completion

For file loading and derived assets, trace the stages that participate: identify the source → fetch or open → write and close → validate or decode → publish → present. At each participating stage, name its failure result, the owner receiving it and the diagnostic that preserves its cause. Include failure before a request is created and failure first discovered at close.

- Capture a native error immediately after the failing call. A later filesystem probe or cleanup can replace it.
- Finalize the stream before assigning the terminal classification. HTTP success does not prove local writing succeeded; transport failure can be the consequence of a refused write.
- Preserve the distinctions that change handling or engineering action: network, response status, local storage, invalid content, decoder/provider, publication and stale or cancelled work. Map at the owner with the facts, not by downstream string matching.
- Check which earlier owner already reports the cause. A caller adds target or outcome evidence when needed; it does not promote a known local reason merely because the final operation failed.
- State what remains visible after failure: the old image, fallback, empty view or unavailable capability. Check which owner settles the request and releases resources on each exit.
- For shared files, establish the effective path and its writers before adding observations of collisions or deletion failures. A unique extra output does not establish that the default output is unique.

For a thumbnail loaded without automatic retry, the operation can own one terminal result. It does not need a new episode recorder solely because it has several stages.

## Retry and recovery require an episode decision

If a flow retries, reconnects or repeatedly tries to restore a capability, either use episode-based evidence or state why the existing operation result answers the same questions. Name the existing report and its coverage when reusing it. “There is a session summary” is insufficient without that coverage.

Answer these questions before implementing the logging, or before accepting it in review:

1. What opens the episode, which capability and target does it concern, and what scope distinguishes a new episode from another attempt?
2. What observation closes it as recovered? Which endings mean exhaustion, cancellation, target replacement, departure or shutdown instead? A lost process or missing ending leaves the result unknown.
3. Which owner retains the first and changed causes, attempts, start time, elapsed impairment and final outcome? State the bounded representation for changed causes and the clock's meaning.
4. Which existing report carries those facts? Does its lifetime cover early failures, pending waits and teardown? Name any gap rather than adding a parallel stream by default.
5. When does engineering need a report? Use a supported duration or state threshold for prolonged impairment. Keep ordinary recovered transients local unless monitoring policy needs them. Record terminal actionable failure once.
6. If prolonged impairment is reported while recovery continues, how does the same owner later report recovery or termination? Waiting until session shutdown must not hide a permanently pending operation.
7. What resets after recovery so a new failure is visible? What fences stale completions and keeps a target change from closing the successor's episode?

Default outcome mapping: an ordinary recovery within the accepted limit stays local unless monitoring policy requires it; prolonged impairment emits a bounded report followed by its ending; actionable terminal failure emits one report. Observed cancellation or shutdown is a terminal non-recovered ending; an unobserved process loss or missing ending is unknown.

Prefer a bounded outcome summary over a remote error for every expected attempt. A terminal invariant failure can require immediate reporting; explain that exception. A recovered episode still exceeds the product's loss limit when its measured duration does, so recovery alone is not a reason to discard it.

For voice, usable recovery concerns the required listening or speaking capability, not just a successful join. For a browser, distinguish no usable picture from a usable picture whose requested size is still settling. Apply the feature's accepted feedback policy separately from evidence design.

## Verify the decision

Select checks for the changed evidence: one stage failure, a failure discovered during finalization, an expected transient followed by usable recovery, prolonged failure followed by recovery, cancellation or target change, and failure again after recovery. Use only applicable cases. Check the final destination and retained fields, not merely that a logging call ran. A logging repair establishes better evidence; claim repaired functionality only when the affected operation was checked too.
