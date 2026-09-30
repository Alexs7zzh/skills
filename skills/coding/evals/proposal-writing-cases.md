# Proposal writing cases

Review each case independently using The judge from proposal.md. Return W1 through W4 with a short verdict and essential reasons. Do not infer facts between cases. No tools.

## W1 — Unexplained diagnostic change

What happened: Four severe GameThread hang reports. EOS and CEF retain absolute DLL addresses; two MEs samples have RVAs. Absolute addresses without load bases prevent offline identification.
Known: At engine cs286, OnHang in ThreadHeartBeat.cpp uses a 64-entry module array. WindowsPlatformStackWalk.cpp stops copying signatures at caller capacity and reports the process count. Unknown-function addresses outside that table retain absolute text. The detector's age check and affected-thread capture are correct; the conversion table is incomplete. Sentry has a richer portable stack but only one retained match. Telemetry forwards the single Error correctly.
Unknown: Whether the cutoff caused these particular absolute frames, and the hang origins. We have no EOS/CEF debug symbols.
What does not fit: The CEF portable stack already has RVAs; MEs RVAs already support offline lookup. This change does not prevent stalls.
Recommendation: Fix now: enumerate all modules instead of cutting off at64, preserving the existing portable/RVA format. Add a >64-signature conversion test. Relying solely on Sentry loses because three reports have no retained match.
Scope/risk: ThreadHeartBeat.cpp only, existing APIs. Additional incident-time allocation; preserve timing, severity and event schema; run focused formatting checks and Windows verification.

## W2 — Unexplained delivery change

What happened: Customers occasionally fail to receive a purchased download. Three terminal errors; no duplicate charge is established.
Known: At cs42, ReceiptQueue.cpp admits receipts and correctly rejects duplicates. ReceiptSender.cpp marks the entry consumed before a HTTP sender returns its result. A transient sender failure therefore removes the only retained receipt without acknowledging delivery. The retry stage has no entry to retry. Existing UI accurately reports delivery pending.
Unknown: Which of the three customer failures took that branch. The checked defect does not need field attribution.
What does not fit: Two retained requests succeeded on retry before the current consume-before-send change; they show delivery can work, not that this branch is safe.
Recommendation: Fix now: advance the captured entries only after readiness rather than completing the fence in the first phase. Keep phase2 portable, then add a failed-send retry test. Keeping current consumption loses the retained retry data.
Scope/risk: Only receipt delivery; no charging changes or schema change. Verify success, failure and duplicate receipt.

## W3 — Technical terms explained where they matter

What happened: Severe-hang reports cannot reliably compare an unknown instruction across process launches. OnHang searches a table of only64 loaded executables/DLLs; an instruction from another loaded binary can retain an absolute address. Replace that table with one sized for the process's loaded binaries. This improves evidence, not the hang itself.
Known: Engine cs286 ThreadHeartBeat.cpp's detector admits elapsed heartbeat gaps correctly and captures the affected thread. Its unknown-frame formatter uses only64 module signatures. WindowsPlatformStackWalk.cpp can supply the process image count but copies signatures only up to caller capacity. A larger process can therefore omit images from this fallback. Telemetry forwards one Error correctly. An RVA (relative virtual address) is the instruction offset from the binary's load base; binary-plus-offset stays comparable across launches of the same build. It needs base/size, not debug symbols. Missing EOS/CEF symbols still prevent recovering their names and source lines. Existing MEs offsets are working cases, not defects. The table is not logged; capture stays capped at100 frames and the Error excerpt keeps its existing length check before each whole-frame append.
Unknown: Whether this cutoff caused the two observed vendor-DLL absolute addresses. Hang causes remain unknown.
What does not fit: A matched CEF Sentry event already retains relative addresses, so richer Sentry capture is not broken. Three rows have no retained Sentry match.
Recommendation: Fix now: use process-sized signature storage, preserve original text if lookup fails, and test a65th-image instruction plus missing/unmapped images. Preserve timing, severity and event format. Using only Sentry loses because unmatched Axiom rows still need useful identification.
Scope/risk: ThreadHeartBeat.cpp using existing APIs; no header expansion planned. Incident-time allocation is the risk. Build and focused formatting checks, then Windows verification; Mac evidence does not prove DLL enumeration.

## W4 — Concise known-good stop with an expert appendix

What happened: Customer CSV imports exceeding the supported row limit are rejected. Keep that behavior; the limit prevents oversized imports and the customer can split the file.
Known: The owner confirms the supported cap. At cs42 Import.cpp rejects the oversized input before submission, preserves it, and returns an actionable message. The UI shows that message and the expected rejection stays at the required local log severity. A focused test verifies these stages. The optional engineering appendix describes SIMD parser internals; they do not determine this decision.
Unknown: None affecting this disposition.
What does not fit: None.
Recommendation: No action: the intended limit and handling are verified; changing parser internals would not improve this outcome. Reopen on failure below the limit or a changed product requirement.
Scope/risk: Preserve the supported limit and behavior.
