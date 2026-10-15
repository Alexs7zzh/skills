# Logging proposals for the technical judge

Judge these independent proposals using the supplied production packet. Treat the stated checks as premises, not work you performed. Do not inspect product source or perform further investigation.

## LP1: retain temporary cleanup reports

A client stops local work when an asynchronous cleanup exceeds its waiting budget. Cleanup may still block a later requested operation. Source checks establish that the timeout and a segment summary report the same wait, while a later native-disposition report carries a result discarded by the native owner. No later requested operation or user impairment was observed in the historical incident. Prior policy approved these reports temporarily to investigate delayed cleanup. Existing capability reporting separately covers prolonged loss and its ending.

Recommend retaining the timeout, summary and native-disposition reports while the native cause remains unknown. The native disposition supplies context absent from the capability report, so retaining all three preserves useful evidence. The cost is up to three remote records even when no later operation is requested. Keep normal completed cleanup local and preserve independent failures. Unknown historical impact and native cause remain open; no product change is proposed.

## LP2: decide the remaining reporting questions

Use LP1's checked facts. Replace its recommendation with this bounded investigation:

Inspect which fields and reporting times distinguish the timeout from its summary, and which engineering decision needs any difference. If the summary covers the timeout's useful context, propose consolidating that pair; otherwise retain the distinct observation with its purpose. Separately inspect whether the existing operation state can retain the native outcome until a later capability report, including pending, replacement and shutdown paths. Compare the cost of preserving that context with explicitly accepting its loss when no capability failure occurs. Historical attribution is not the completion condition.

Retain the temporary stream during this assessment only. End the assessment with a decision for each report: retain as ongoing evidence for a named obligation, attach its context elsewhere, or retire it with the accepted coverage loss. This supplies the missing distinct-value and coverage decisions before selecting an implementation. It preserves independently actionable failures and does not delay ordinary cleanup or shutdown for diagnostics. No current consolidation, demotion or new collector is asserted safe from the supplied facts alone.

## LP3: independent audit evidence

A service's successful transfers must have a durable audit record for reconciliation, even after a browser closes. A browser separately reports actionable receipt-display failure. The checked requirements establish both purposes; a display failure does not establish transfer failure. Each record carries its operation identity and the outcome observed by its owner.

Retain both records. Replacing the audit with browser memory attached only to receipt failures would lose successful transfers and fail the durability obligation. Shared identity supports correlation without coupling audit durability to browser lifetime. There is no reported incident, changed behavior or remaining decision requiring new investigation. No temporary diagnostic collection is proposed.
