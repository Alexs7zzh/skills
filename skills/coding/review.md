# Review

The procedure for judging a change. Read for a diff, branch, changeset, PR, or uncommitted changes. The review mode, quick or deep, changes the amount of evidence you gather, not the standard for a finding.

## Choose the review

Name quick or deep beside report or fix in your first line, so the user can redirect you in one word.

| The change | What to do |
|---|---|
| A few lines, one or two files, and no risk surface | Quick review. Follow the four steps below. |
| Release-gating, many files, or any risk surface | Deep review. Read [deep.md](./deep.md) and choose your role at the top. |
| The user asked for a deep or thorough review | Deep review. Read that same file. |
| The user asked for a focus, structure only or performance only | Quick or deep by the rows above. The focus names the lenses to run; you still account for every changed hunk, and the validation line names the lenses not applied. |
| You cannot tell | Ask, in one line: "quick pass, or deep review?" |

Risk surfaces are listed in good-code.md. In either mode, account for every changed hunk before deciding what deserves deeper investigation. If the material would crowd the context needed for judgment, delegate the bulk reading per Attention, or escalate to deep review.

## Scope of judgment

Inventory everything the change touches. Read the changed files plus enough surrounding, calling, and owned code to judge structure, because structure problems rarely show in the diff alone. Code the change promotes, to sole path, realtime duty, universal gate, or reference input, is a review target rather than context, even when it is unchanged. Quality findings judge changed code only; bug findings judge changed and promoted code.

## Quick review

1. Read the diff, then the callers and the code it owns.
2. Apply the lenses in good-code.md that the change actually touches, and good-change.md to any fix under review.
3. Run the owning tests. Classify any failure as a regression or as documented pre-existing noise.
4. Report findings ranked by user impact, in the format under Report. Nothing wrong: say so in one line and name what you checked. Nits go in one line at the end, or get dropped.

Escalate mid-review if a change you took as small turns out to touch a risk surface. Say you are escalating, then read [deep.md](./deep.md). Never run a deep review's judgment on a quick review's evidence.

## Report

The response is triage, written in the owner's language, so explain any term of art in one clause at its first use or drop it. Carry only what the owner must know, decide, or act on:

- Findings in the format below, ranked by user impact. A quick review may leave Decision and Validation status empty; Trigger stays, since a Bug is a defect with an investigated trigger.
- Each needs-ruling as a decision package per findings.md.
- Assumed rows on release-gating claims, one line each.
- Nits and hardening rows collapsed into one batch each, never interleaved with decisions; their lifecycles are in findings.md.
- The validation line per Declarations, plus any prescribed step you skipped, named with why.
- A deep review closes everything green in one line: "closed N rows: X by execution, Y by proof, Z by evidence." The full ledger, verified-clean entries (safe because <the one fact> (step N); ran against: <the shipped seam | a replica | which proxy>; windows: <interleavings walked>), and audit disposition stay in the run directory rather than the response.

Findings are ledger rows, and the findings section is the render of that ledger. A quick review that finds nothing wrong needs no ledger. Once a quick review has its first Bug or Restructure finding, open a single-seat ledger in a run directory (`ledger.sh init --single --route review`; the helper sits beside deep.md, and deep.md's Run directory paragraph says where the directory goes) and write each finding as a row; `ledger.sh report` renders the section and refuses while a Bug or Restructure row lacks a slot. A deep review's rows are written by the peers, and `converge` renders them. The row carries what the finding template carried: the claim as what and why, at `site`; `trigger`, how the condition arises in the field, cause, scope as all users, per machine, per session, or per event, and rough frequency, investigated rather than hypothesized; `impact` on the user; the proposal as `origin_class`, `fix_shape`, `sites_walked`, `rulings_checked`, `test_seam` (for Bugs, the test that would have caught it and its seam, stated as existing, new, or none), and `cost`; `decision`, the trade with recommendation and fix risk; `step` for confidence; `evidence_path` for validation status. A quick review may leave `decision` and `evidence_path` empty.


A deep review adds two mandatory sections, graded like findings:

- **Goal closure.** The goal as the user experiences it, never in the design's vocabulary. What reality includes in that scope. Whether the design's boundary matches.
- **Domain scenarios.** The canonical stress cases of the component's field. One row each: decision variables traced, coverage, verdict.

A deep review ends with a **fix table**: one row per finding, marked approved with its shape, gated on a named probe or ruling, or needs-ruling with its options labeled (a), (b), (c).

## Retrospective

One line at the end of every review, kept to deltas: which rule produced each finding, or whether it was judgment, and whether each bug was human-plausible or agent-typical. A deep review adds, to the seat notes rather than the answer, what the fix reviews and the fresh attack each caught, so a pass that never catches anything can be dropped, and which discovery channels produced this round's findings, which produced nothing, and which remain untried, so the next round spends its budget on unexamined ground. For each miss surfaced later, name what would have caught it in run one, preferring a repo-side test, assert, type or lint over a review instruction. A miss no rule names: propose the rule and ask; on yes, read [maintaining.md](./maintaining.md).
