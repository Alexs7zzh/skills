# Review

The procedure for judging a change. Read for a diff, branch, changeset, PR, or uncommitted changes. The review mode, quick or deep, changes the amount of evidence you gather, not the standard for a finding.

## Choose the review

Name quick or deep beside the stopping policy in your first line, so the user can redirect either choice.

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

- Findings in the format below, ranked by user impact. A quick review may leave the decision and the evidence path empty; the trigger stays.
- Each needs-ruling as a decision package per findings.md.
- Assumed release-gating Claims, one line each.
- Nit and Hardening Claims collapsed into one batch each, never interleaved with decisions; their lifecycles are in findings.md.
- The validation line per Declarations, plus any prescribed step you skipped, named with why.
- A deep review closes everything green in one line in the seat notes: "closed N Claims: X by execution, Y by proof, Z by evidence." The full ledger, verified-clean entries (safe because <the one fact> (step N); ran against: <the shipped seam | a replica | which proxy>; windows: <interleavings walked>), and audit disposition stay in the run directory rather than the response.
- At a deadline, the current snapshot is the report. Separate completed Claims and reviewed Remedies from open coverage, contested claims, pending decisions, unreviewed remedies, and unfinished landings. A gap blocks an exhaustive certificate, not the snapshot.

The ledger stores the six objects from findings.md and renders their current states. A quick review that finds nothing wrong needs no ledger. Once a quick review has its first Bug or Restructure Claim, open a fresh run directory, set `LEDGER=<absolute path to the coding skill>/scripts/ledger.ts`, export `LEDGER_DIR=<that directory> LEDGER_ME=A`, and run `"$LEDGER" init --single --route review --policy <report|prepare|land|check-in>`. Record its site, trigger, cause, scope, frequency, impact, certainty step, and evidence independently of any Decision or Remedy. A Remedy records its origin class, fix shape, sites walked, rulings checked, test seam, cost, and fix risk. Opening the ledger does not change the stopping policy or authorize a landing.


A deep review adds two mandatory sections in the seat notes, which `sign` hashes and `converge` appends:

- **Goal closure.** The goal as the user experiences it, never in the design's vocabulary. What reality includes in that scope. Whether the design's boundary matches.
- **Domain scenarios.** The canonical stress cases of the component's field. One row each: decision variables traced, coverage, verdict.

A deep review snapshot ends with the render's **remedy table**, one row per Remedy with its linked Claims and current state, plus the ruling queue. Each ruling has options labeled (a), (b), (c) and a recommendation. Only an explicit exhaustive certificate waits for complete coverage and settled connected groups.

## Retrospective

One line at the end of every review, kept to deltas: which rule produced each finding, or whether it was judgment, and whether each bug was human-plausible or agent-typical. A deep review adds, to the seat notes rather than the answer, what the fix reviews and the fresh attack each caught, so a pass that never catches anything can be dropped, and which discovery channels produced findings, produced nothing, or remained untried. For each miss surfaced later, name what would have caught it in the original run, preferring a repo-side test, assert, type or lint over a review instruction. A miss no rule names: propose the rule and ask; on yes, read [maintaining.md](./maintaining.md).
