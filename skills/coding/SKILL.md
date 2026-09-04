---
name: coding
description: "Use for any task that touches code: implementing or changing it, fixing a bug, reviewing a diff, branch, changeset, PR, or uncommitted changes, or debugging or diagnosing anything broken, failing, or slow, including a bug report, a warning, telemetry or crash reports, or a fix that did not hold."
---

# Coding

This file holds the words, definitions, and rules every task uses; each other file holds a method, read at the moment its row names. Read all of this file, then the row you are in, in the order the row gives. When the work changes kind, a review that turns into a fix, a diagnosis that reaches step 4, or a quick review that meets a risk surface, add the new row's files.

| You are | Read, in order |
|---|---|
| Writing or changing code | [good-change.md](./good-change.md); the Values in [good-code.md](./good-code.md), and its lenses when the code sits on a risk surface or the change touches them; [findings.md](./findings.md) when you propose a change wider than the request |
| Reviewing | [review.md](./review.md) first; it decides quick or deep and handles a stated focus. Then good-code.md and findings.md; good-change.md when the change is a fix or you propose one; [deep.md](./deep.md) when review.md says deep |
| Diagnosing | [diagnose.md](./diagnose.md) first; it decides plain or deep. Then findings.md; good-change.md at step 4; good-code.md when a cause sits on a risk surface; deep.md when diagnose.md says deep |
| Dispatched as a reviewer into a two-family run | deep.md first, for your role; then the route the dispatch names, review.md or diagnose.md; then good-code.md, good-change.md, findings.md |
| Master of a two-family run | deep.md, the Roles and Herdr sections only, plus the route's gathering steps: Scope of judgment in review.md, or Build the feedback loop in diagnose.md. Nothing else: you judge no issue |
| Editing this skill | [maintaining.md](./maintaining.md), then the file you edit |
| Any row, on Unreal Engine or C++ code | [unreal.md](./unreal.md) as well |
| Any row, where the project has its own review or diagnosis doc | That doc as well, before judging: it carries the project's values, recorded rulings, and repo facts |

Writing has no route file: this file and good-change.md govern it. Risk surfaces are listed at the top of good-code.md.

## Words

Every file in this skill uses these words for these things.

- **Issue.** One bug or finding: what is wrong, at which file and line, and how sure you are. Labels are in findings.md.
- **Proposed fix.** The change that answers one or more issues: its shape, the sites it touches, where its test goes, and its cost.
- **Shelved fix.** A proposed fix applied in the checkout, built, its test run red before and green after, and saved as a shelve. Not checked in.
- **Check-in.** The commit. Only on the user's word.
- **Question.** A choice only the user can make, written so the user can answer it without reading code.
- **Probe.** Temporary code that answers one question about the code: a tagged log, a temporary test, a compiled replica. Removed afterwards.
- **Red run, green run.** The new test failing on the unfixed code, then passing with the fix. Each is kept as a log file.
- **Shelve.** A saved change outside the checked-in history. The project's doc names the form: a Plastic or Perforce shelve, a git branch, worktree, or stash.
- **Database.** The run's shared SQLite file, kept by the `ledger` script under `scripts/` beside this file. Every issue, question, proposed fix, shelved fix, and check-in is a row in it, and the report is printed from it.
- **Mark.** One reviewer's recorded agreement with a row it did not write.

## Certainty

What a claim rests on, by step:

1. "I said so." Closes nothing.
2. Pointed at the line or the provider's own source.
3. Walked the failure and it cannot reach.
4. Ran real code: probe, compiled replica, executed test, log evidence, retained logs included.
5. Reproduced live in the running system yourself, this pass.

Names, comments, docs, commit messages, and another agent's report are testimony: they say where to look and prove nothing until the code or a run confirms them. How an issue is proved, and what a dismissal needs, is in findings.md.

## Attention

- Fan out per independent unit, an issue, a sweep, a lens, or a group of related issues, one subagent each, with disjoint scopes named in the dispatch. Keep the model of the change, the final verdicts, and the reading of related issues yourself. Those are the steps that cannot be delegated.
- Delegate what arrives as bulk: file dumps, build and test output, probe transcripts. Subagents return conclusions with file:line and certainty step. Artifacts stay on disk and are referenced by path. Read a suite's summary and failure lines rather than its log. Independent commands batch inside one lane, which needs no delegation.
- Cheap agents enumerate and flag. They never own a verdict.
- A brief to an agent or subagent follows the `agent-messaging` skill: goal, acceptance, facts with their certainty, constraints, where to report, and no method. A fresh reader gets claims, file:line, and evidence paths, never your arguments: a fresh context fed your reasoning is not fresh.
- Take any ready work you are allowed to do. Waiting on one issue, question, build, or review never blocks work on another issue.
- Launch builds and tests in the background and keep working; never sleep on them.

## Declarations

What you say about your own work, every time:

- Line one names how far you go, fix, report only, or check in, and the mode: quick or deep for a review, plain or deep for a diagnosis.
- Every claim names its certainty step. A number that arrives in a sentence rather than from a run is marked reasoned. A probe's result states the input class it ran on, since a result holds only for the signals, sizes and parameters it ran on.
- A skipped pass or an unrun probe is named, with why. Report-only mode is never the reason.
- The answer ends with a validation line: what built and ran, with results, and that the checkout holds no probe when temporary edits were made.

## How far to go

Quick, plain, and deep say how much evidence to gather. How far to go says what happens to a verified issue:

- **Fix**, the default for every mode. Verify the issue, write the test and the fix, run the test red then green, shelve the fix, and have someone who did not write it review the diff. Check in nothing.
- **Report only**, when the user asks for it. Verify issues and write proposed fixes. Change no code beyond probes.
- **Check in.** After the report, only the shelved fixes the user names.

One issue's fix never waits for another issue. An issue that needs the user's answer waits; every other issue moves.

Probes are allowed under every mode, and encouraged whenever running code settles what argument cannot: tagged logs, temporary tests, compiled replicas, off-design parameters through existing helpers. One rule set governs them:

- Tag every temporary edit with one unique token, so cleanup is one grep.
- Never change the behavior under review or diagnosis, and never count a probe as a fix.
- Back up and hash each file before editing it. Remove every tagged edit before you release the checkout. When reporting, verify the checkout against the reviewed revision rather than the SCM status line.
- A temporary test that goes red on an issue is the start of that issue's regression test. Keep it with the proposed fix.
- In a shared checkout, take the checkout in the database before any edit, probes included. deep.md, Shared checkout, says how.

A diagnostic log meant to ship for a release cycle is not a probe. It is a logging change, and it follows the project's logging policy.
