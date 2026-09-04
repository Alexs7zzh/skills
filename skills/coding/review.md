# Review

The procedure for judging a change. Read for a diff, branch, changeset, PR, or uncommitted changes. The review mode, quick or deep, changes the amount of evidence you gather, not the standard for an issue.

## Choose the review

Name quick or deep beside how far you go in your first line, so the user can redirect either choice in one word.

| The change | What to do |
|---|---|
| A few lines, one or two files, and no risk surface | Quick review. Follow the four steps below. |
| Release-gating, many files, or any risk surface | Deep review. Read [deep.md](./deep.md) and choose your role at the top. |
| The user asked for a deep or thorough review | Deep review. Read that same file. |
| The user asked for a focus, structure only or performance only | Quick or deep by the rows above. The focus names the lenses to run; you still account for every changed hunk, and the validation line names the lenses not applied. |
| You cannot tell | Ask, in one line: "quick pass, or deep review?" |

Risk surfaces are listed in good-code.md. In either mode, account for every changed hunk before deciding what deserves deeper investigation. If the material would crowd the context needed for judgment, delegate the bulk reading per Attention, or escalate to deep review.

## Scope of judgment

Inventory everything the change touches. Read the changed files plus enough surrounding, calling, and owned code to judge structure, because structure problems rarely show in the diff alone. Code the change promotes, to sole path, realtime duty, universal gate, or reference input, is a review target rather than context, even when it is unchanged. Quality issues judge changed code only; bug issues judge changed and promoted code.

## Quick review

1. Read the diff, then the callers and the code it owns.
2. Apply the lenses in good-code.md that the change actually touches, and good-change.md to any fix under review.
3. Run the owning tests. Classify any failure as a regression or as documented pre-existing noise.
4. Report issues ranked by user impact, in the format under Report. Nothing wrong: say so in one line and name what you checked. Nits go in one line at the end, or get dropped.

When you go as far as fix, each Bug or Restructure gets its test and fix per good-change.md, shelved with its red and green logs, and a fresh subagent reviews the diff with the two questions in deep.md step 7.

Escalate mid-review if a change you took as small turns out to touch a risk surface. Say you are escalating, then read [deep.md](./deep.md). Never run a deep review's judgment on a quick review's evidence.

## Report

The response is triage, written in the owner's language, so explain any term of art in one clause at its first use or drop it. Carry only what the owner must know, decide, or act on:

- Issues ranked by user impact. A quick review may leave the recommendation and the evidence path empty; the trigger stays.
- Each open question, written per findings.md, Whose call.
- Assumed release-gating issues, one line each.
- Nits and Hardening issues collapsed into one batch each, never interleaved with questions; their lifecycles are in findings.md.
- The validation line per Declarations, plus any prescribed step you skipped, named with why.
- A deep review closes everything green in one line in the notes: "closed N issues: X by execution, Y by proof, Z by evidence." The full database, verified-clean entries (safe because <the one fact> (step N); ran against: <the shipped code | a replica | which proxy>; windows: <interleavings walked>), and audit disposition stay in the run directory rather than the response.
- An open issue, question, or coverage gap is printed as open.

Issues are database rows, and the issues section is printed from the database. A quick review that finds nothing wrong needs no database. Once a quick review has its first Bug or Restructure, create a run directory (deep.md, Run directory, says where), then `export LEDGER=<absolute path to the coding skill>/scripts/ledger.ts LEDGER_DIR=<that directory> LEDGER_ME=A` and run `"$LEDGER" init --single --route review`; `"$LEDGER" --help` lists the rest. An issue records its site; its trigger, how the condition arises in the field, cause, scope as all users, per machine, per session, or per event, and rough frequency, investigated rather than hypothesized; its impact on the user; its certainty step; and its evidence path. Its proposed fix records origin class, shape, sites walked, rulings checked, where the test goes, stated as existing at a path, new and what must be built, or none, and cost. A quick review may leave the recommendation and evidence path empty.

A deep review adds two mandatory sections in each reviewer's notes, which the report appends:

- **Goal closure.** The goal as the user experiences it, never in the design's vocabulary. What reality includes in that scope. Whether the design's boundary matches.
- **Domain scenarios.** The canonical stress cases of the component's field. One row each: decision variables traced, coverage, verdict.

A deep review's report ends with the **fix table**, one row per proposed fix with its issues and its state, and the open questions, each with options labeled (a), (b), (c) and a recommendation.

## Retrospective

One line at the end of every review, kept to deltas: which rule produced each issue, or whether it was judgment, and whether each bug was human-plausible or agent-typical. A deep review adds, to the notes rather than the answer, what the diff reviews and the fresh attack each caught, so a pass that never catches anything can be dropped, and which discovery channels produced issues, produced nothing, or remained untried. For each miss surfaced later, name what would have caught it in the original run, preferring a repo-side test, assert, type or lint over a review instruction. A miss no rule names: propose the rule and ask; on yes, read [maintaining.md](./maintaining.md).
