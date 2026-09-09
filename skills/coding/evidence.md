# Evidence and working notes

Read before making a coding judgment. These standards apply to both a compact review note and a ledger investigation. Longer-lived records, decisions and completion are in findings.md when the work calls for them.

## Evidence

**Choose evidence by what the claim says.** State the claim and a plausible alternative that would make it wrong. Choose a check whose result could distinguish them, using the actual boundary, inputs, and environment the claim covers. A check that cannot distinguish them adds no support. Agreement, a test name, or repetition of the implementation is not independent evidence.

A validation record separates **Planned** from **Observed**. Planned names the claim and alternative, method, intended inputs, and any predicted result.

Record an action as completed, or interpret an observation, only after its supporting result returns to your context. A submitted tool batch cannot both retrieve that result and contain your prewritten claim about it: `await` orders execution but does not let you read the result while composing the batch. Execute or retrieve, consume the returned result, then record in a later call. This applies to preservation, input identity, ownership and review as well as tests. A program may emit facts derived from checked results; an unconditional prose claim is not such a check.

For a test, probe or measurement you execute, capture the observation with `node --no-warnings <skill>/scripts/evidence.ts run`; its `--help` gives the interface. The helper retains the literal command, selected input files, raw output and actual termination without a ledger. Use the same command authorization and shared-input ownership as a direct run. Receipt creation does not mean a test passed.

Inspect the returned capture with `evidence.ts inspect` and read the output that supports the claim. The **Observed** entry contains the returned capture path, the result it supports, applicable baseline/candidate and environment, and remaining uncertainty. The helper owns execution facts; the note owns their interpretation. A running or interrupted capture can support only the partial output actually received, not completion or unseen results.

For an existing external observation that cannot use this runner, retain its actual tool result or original log with invocation, input and environment provenance; do not rerun a live system merely to change record format. For a code proof, retain the actual paths, assumptions and contracts walked, with no execution receipt. The reviewer checks this evidence and its applicability before accepting the claim. Keep the useful conclusion in the issue or report, with the full record on disk.

Examples of this principle, not an exhaustive set of cases:

| Claim | Evidence that can distinguish it |
|---|---|
| A defect occurs and the change removes it | A reproducer on the actual affected code before and after the change, with the inputs and both results retained |
| Behavior is preserved while structure changes | Checks of the relevant observable behavior on both versions, plus a code argument for the changed ownership or invariant; passing both times can be the expected result |
| A feature meets its goal | Acceptance scenarios derived from the user's experience and rulings, including affected failure paths; a demo when experience cannot be judged from code |
| A path meets a performance budget | Measurements on the relevant path and workload against the budget, with the target environment and scaling assumptions |
| A state cannot occur | A code or contract proof covering the ways it could arise, with evidence for its premises; a stress run without failures establishes only what was observed |

When a practical probe can settle the uncertainty, run it instead of extending the argument. Choose its inputs independently of the design's convenient constants or symmetries. A fifteen-minute probe is a useful prompt to try the experiment, not a universal limit on worthwhile investigation. Test through shipped code when the claim includes its wiring; a replica establishes only the mechanism it reproduces.

When a result surprises you, check the observation method and inputs as well as the system. Disagreeing probes may have exercised different cases. Batch independent probes under one stable build; an experiment that depends on an earlier result belongs in the next batch.

If no available check can distinguish the alternatives, narrow the claim or leave the uncertainty open, with what would resolve it and why it is unavailable. Choose another method when it can answer the question. Do not manufacture a failing test, call every missing test seam an architecture defect, or ask the user to waive an arbitrary log requirement. A testability problem is an issue when it prevents a needed assurance about the project.

These certainty steps identify the basis of a claim, not a probability or a total ordering of evidence:
1. Unsupported assertion.
2. Checked source or observed fact, with its relevance still to establish.
3. Code or contract proof of the stated claim under recorded assumptions.
4. Executed check or measurement, with its input class and artifacts.
5. Direct observation in the running target system, with its context and artifacts.

A verified issue needs a retained evidence path and a supported claim at step 3, 4, or 5. A higher number does not expand what the evidence proves. A dismissal has the same burden as the claim it makes: “by design,” “engine noise,” and “not our fault” need the applicable ruling or evidence. Engine, plugin, and vendored code remain investigation targets when they determine the outcome.

For an issue, investigate how the trigger arises, its scope and rough frequency where relevant; distinguish observations from estimates. For a maintenance finding, name the concrete future task or failure class affected.

## Labels and impact

- **Bug.** A defect with an investigated trigger or a supported proof that the contract is violated.
- **Restructure.** A concrete maintenance cost or failure mechanism that a structural change removes. Related bugs can be its evidence; deletion is justified by the requirement investigation in good-code.md.
- **Hardening.** A real defect with low current impact. Prefer fixing it alongside substantive work where its risk is already being exercised. It never gates a release on its own.
- **Nit.** A minor improvement with no substantive impact. Fix it in the same touch, or accept it with a reason; do not keep returning it as open work.
- **telemetry-quality.** A defect in what telemetry reports. Judge it against the logging or pipeline contract; it is not release-gating on its own.

Record impact from 1, highest, to 5, lowest. Lead with the user consequence; keep Hardening, telemetry-quality, and Nit in separate batches. A low measured impact can lower severity without proving the underlying invariant sound. Investigate numbers that lower severity as carefully as numbers that raise it.

A technical document contradicting an actual release contract is a defect; first establish that contract per SKILL.md, Authority. An unverified constant, a misleading detector, or a failed coverage claim earns an issue when its unsupported assumption affects a concrete obligation. A deliberate human choice suppresses only claims its rationale addresses. New evidence can justify challenging it through a question.

## Working record

Keep one working record as the investigation develops, starting before the first finding. Retain the task's goal, authorized scope, what you know, and the next question. Leave unknowns open. When resuming, read and continue that record, preserving applicable evidence.

Add the actual baseline, instructions read, and the claim's Contract from SKILL.md, Authority and judgment, before findings. Retain observations and their limits as they arrive, and the independent assessment when it returns. Build the report from this record; do not fill a completed-looking report with results still to come. Keep one evolving note, not a document per action.

For a standalone quick review, that note and its linked evidence are enough, including probes outside the checkout. Do not create a ledger merely because the review finds a defect or recommends a correction. Use the existing record when dispatched inside a run; a small assignment does not discard shared ownership or unresolved decisions.

Use the ledger for substantive writing, diagnosis, deep or shared investigation, a retained candidate's development and review, or an unresolved user decision. Read [findings.md](./findings.md) for records and continuity and [ledger.md](./ledger.md) for setup before entering that work. Carry the note, exact inputs and still-applicable evidence into the run without repeating discovery.

Before a work switch or context reset, preserve the current understanding, evidence pointers, rejected alternatives that matter, and next action or blocker. A private checkpoint can supplement this record, not replace what another reader needs. In a ledger run, retain versioned evidence and record the outcome in its task; notes are an index, not a duplicate of every row.

Keep the record proportional to the unresolved decisions. A clean review records scope and validation without inventing an issue or candidate. Recording evidence does not endorse a conclusion; a note or passing probe does not replace independent review.
