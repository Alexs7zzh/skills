# Review

The route for judging existing code or a diff, branch, changeset, PR, or uncommitted changes. Quick and deep change the coverage and coordination, not what counts as evidence.

## Choose the review

State quick or deep and how far you are going so the user can redirect.

| The target | Mode |
|---|---|
| A bounded target without a risk surface | Quick |
| Release-gating, too much material for one judgment context, or a risk surface | Deep; read [deep.md](./deep.md) for joint coordination |
| The user asks for a deep or thorough review | Deep |
| The user names a focus | Use the relevant mode within that scope; report which lenses were applied |

Risk surfaces are listed in good-code.md. If the scope is unclear, inspect the change before choosing; ask only when a missing user choice would materially change the review. Escalate when new evidence exposes a risk surface or coverage that needs deep coordination. Retain gathered evidence and identify what additional coverage is needed.

## Gather the input

Identify the requested target, goal, relevant rulings, files, callers, owners and project contracts before judging. For a change, inventory the requested revision or diff, including existing local edits. For existing code, retain its current version and assess the named behavior; do not invent a diff. Master can prepare this input; both investigators check whether it is correct and sufficient.

## Scope of judgment

Read the target files plus enough calling and owned code to understand behavior and structure. Code promoted to sole path, realtime duty, universal gate, or reference input is a review target even when unchanged. Within a change review, quality findings concern changed or newly imposed structure; do not turn unrelated pre-existing style into work. A defect in context is relevant when the change depends on or exposes it.

## Quick review

1. Establish the goal in the user's terms and read the target, callers, and owners within scope.
2. Apply the relevant good-code.md lenses and evidence.md. Use good-change.md when developing or independently reviewing a candidate.
3. Run checks that discriminate the relevant claims. Investigate failures and distinguish regressions from established baseline failures.
4. Record findings and coverage. In fix mode, continue directly through good-change.md, Develop the candidate and Review the result. In report-only mode, explain the proposed correction and its basis; develop an outside-checkout candidate only when it answers a remaining uncertainty or the user requests it.

Select and continue the record under evidence.md, Working record. When escalating to candidate development or deep investigation, carry the note and applicable evidence into that route's record; do not restart the review.

## Report

Explain consequences in the user's language. Build the report from the retained note or ledger arguments, not task counts. evidence.md owns the evidence standard; findings.md owns candidate and joint-run dispositions when those apply. The response contains:
- the goal and whether the reviewed behavior meets it, with any material mismatch;
- substantive issues ranked by user impact, with the evidence basis and uncertainty;
- each proposed fix or candidate and its current state; do not imply that a proposal is implemented or a saved candidate is reviewed;
- open user questions, coverage gaps, or unsupported claims;
- minor findings in batches, and validation per SKILL.md.

Keep full evidence and clean coverage in the run directory. For a clean protocol claim, retain the paths or interleaving windows checked and the contracts they depend on. Each deep reviewer's notes contain Goal closure, the goal in the user's experience and whether it is met, and Domain scenarios, the relevant cases and their evidence or gaps, including what the user experiences beyond the design's convenient assumptions.

For each reviewer in a deep run, the notes include a `passes:` line with sweep, lens, probe, and diff-review counts. Name skipped relevant passes with reasons. Counts describe the work; they do not establish correctness or require extra passes.

## Retrospective

Keep useful deltas in the notes: which discovery channel found an issue, what independent review caught, and what remained untested. A later miss names the mechanism that would have caught it, preferring a repo-side invariant, test, or lint where appropriate. Change this skill only within an authorized maintenance task, using maintaining.md.
