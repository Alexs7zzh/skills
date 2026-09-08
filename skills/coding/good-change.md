# Good change

Read before proposing, writing, or reviewing a change. This file relates the change to its goal and governs development through independent review. Evidence standards live in findings.md, Evidence.

## Establish the outcome

For a requested feature, state the goal as the user experiences it, the intended feel or behavior, and the scenarios that distinguish success from a merely completed implementation. Separate explicit human rulings from implementation choices you are making, per SKILL.md, Authority and judgment. For a long-lived capability or external dependency, use good-code.md, Failure paths, to establish recovery and the limits of the promise. Keep the acceptance summary short enough for the user to inspect.

For a defect, identify the bad state and the mechanism that produces it. For a maintenance change, name the concrete task or failure boundary that becomes easier to reason about. Existing docs, tests, and behavior tell you where to investigate; check them against the goal and rulings before treating them as requirements.

Walk the relevant callers, owners, failure paths, and test seams. Keep the investigation in findings.md's Working record and record the proposed fix using Change records as its direction becomes concrete. A feature can name its goal directly; do not invent a bug to fit a workflow. Continue the existing review or diagnosis record when developing its candidate.

## Choose the boundary

- **Fix the cause within the boundary that can own it.** Find where the bad state is produced. Correct a misusing caller you control; validate external input at the boundary you own. If the origin is outside your control, name that limit and the contract your change can restore.
- **Describe the collaboration before the states.** Write one ordinary case and one interrupted case in the domain's own words: who does what, what they wait on, and what changes under them. Name the decisions, observations and owners that account requires. Map additional implementation states to the runtime questions or protocol transitions they serve, using good-code.md, Values; unexplained states call for revisiting the model, not another guard.
- **Look for a structure that removes the failure mechanism.** Shared ownership, scattered validity checks, flag combinations, or repeated coordination suggest a structural cause. Name what an alternative deletes or makes impossible. Fewer nouns, a generic engine, or shorter functions are not improvements by themselves: compare total responsibility and caller effort with the contained fix. A larger design earns its migration and regression risk.
- **Reuse before adding.** Look for the same job in the owning module and existing libraries. Use it or explain the mismatch. Before sharing an abstraction, check that the callers share a contract and should change together; similar lines alone do not establish that. Apply the deletion test in good-code.md, Values, to what you add or keep.
- **Price the costs that remain expensive.** Code generation and reversible experiments are cheap. Regression risk, interface churn, integration, and the future reader's reasoning burden are not. Do not preserve a bad structure solely to minimize lines, or expand a working change solely because another architecture exists.
- **Sweep the mechanism, not the author's presumed psychology.** Trace sibling sites that share the cause, contract, or workaround. Mirrored tests and invented constants call for an independent source of truth; lifetime defects call for tracing ownership and teardown. Expand the sweep when evidence could change the cause or fix boundary. Finish the relevant sweep before claiming that the group or bug class is resolved.

## Develop the candidate

The investigator usually writes the test or experiment and the candidate while that information is in context. Start once the intended outcome, affected boundary, and a way to discriminate the claim are concrete. Peer agreement is not a prerequisite. A candidate may expose a mistaken hypothesis; retain that result and revise the claim.

Use findings.md, Evidence, to choose validation. Run a reachable defect check on the baseline before changing it, then on the candidate; preserve both results. For other claims, establish the relevant comparison or proof before interpreting the result. Do not force a failing test when no behavior is meant to change, and do not substitute a replica for untested integration.

Save the candidate and its evidence before switching work or ending a session. Do not erase a working candidate merely to report a proposal. In report-only mode, retain a patch or experiment outside the checkout and restore only your temporary edits. Shared checkout mechanics are in ledger.md.

When an approach fails, retain the observation and the brief reason it was rejected. Continue while an experiment or code walk can resolve a concrete uncertainty. Repeated arguments without new evidence call for a discriminating check or a narrower claim, not another round of preference. A remaining user decision follows findings.md, Whose call; save the current work and move to an independent issue.

## Review the result

A reader who did not write the candidate checks the claim and implementation together. In a joint run, both investigators own the final judgment; the peer checks the current result rather than merely accepting an assigned child's verdict. Use a fresh reader per SKILL.md, Attention, when shared authorship or accumulated discussion leaves no independent check, or when a fresh check can resolve a named uncertainty. A child supplies evidence and assessment, not either investigator's assent. Outside a joint run, obtain a fresh independent check before calling the candidate reviewed. Give the reader the goal and rulings, current issues, exact candidate and baseline, dependencies, validation record, evidence paths, and checked versions per findings.md, Continuity.

The review returns one assessment with:
- whether the candidate meets the intended behavior and explicit rulings;
- whether the evidence distinguishes the claim, exercises the relevant code, and supports the claimed scope;
- each affected failure outcome, and any concrete regression or maintenance cost from the relevant good-code.md lenses;
- unresolved conditions, each with the observation or decision that would close it.

After recording its own assessment, the reader may compare the author's rationale and investigate any difference. A preference without a concrete unmet obligation is not a condition. Rationale stays in the record for the user and the next reader.

A clean review supports this candidate and its checked claims together. In a joint run, record the investigators' conclusion under findings.md, Conclusions and replacement. Existing checks can be reused when their evidence remains applicable; no extra stamp is required merely because a logical phase has a name. A changed candidate or dependency follows findings.md, Continuity. A saved candidate without independent review is reported as unreviewed.
