---
name: coding
description: "Use when implementing or changing code, reviewing a diff, branch, changeset, PR, or uncommitted changes, or investigating software bugs, performance problems, warnings, telemetry, crash reports, or a fix that did not hold."
---

# Coding

Read this file first. It holds the shared execution contract and routes each task to its method. A dispatch names a role inside an existing run; use that row instead of starting a standalone review. When the work changes kind, add the new route's files without starting the investigation over.

Choose the workflow by the judgment needed, not by whether a file contains code. For a direct, bounded presentation or mechanical edit whose intended result the user has settled, such as removing a specified sentence from a homepage or correcting a comment typo, inspect the target and relevant repository rules, make the edit, and verify the requested result and affected layout or behavior. Do not load the substantive route, create a ledger, or require a separate reviewer for that edit. Do not invoke the ledger helper unless needed to honor an existing run's ownership contract. A local diff and the smallest relevant UI or test check suffice; do not turn a copy change into a repository audit. Preserve existing work and any active shared-checkout ownership. Changes to runtime logic, authorization, data handling, contracts, or instruction design use the substantive route even when the requested line is fully specified. Escalate a presentation edit too if inspection shows it needs investigation to be safe. An explicit request for deeper review still applies.

Substantive routes read the Values in [good-code.md](./good-code.md) and Evidence and Working record in [findings.md](./findings.md). Read the rest when the table or the work calls for it. The motivation and tradeoffs behind this contract live in [GOAL.md](./GOAL.md); read it when discussing or changing the skill's values.

| You are | Read, in order |
|---|---|
| Writing or changing code | [good-change.md](./good-change.md); the relevant good-code.md lenses; findings.md for records, dispositions, or user decisions |
| Reviewing | [review.md](./review.md), which chooses quick or deep; the relevant good-code.md lenses and findings.md; good-change.md when judging or developing a change; [deep.md](./deep.md) for deep coordination |
| Diagnosing | [diagnose.md](./diagnose.md), which chooses plain or deep; findings.md; the good-code.md lenses suggested by the symptom or mechanism; good-change.md when developing a candidate; deep.md for deep coordination |
| Dispatched into a two-family run | deep.md for your role, then the review or diagnosis route named in the dispatch |
| Dispatched to check an existing candidate | good-change.md, Review the result, and the relevant good-code.md lenses. Use the supplied record and return the independent assessment; the parent owns coordination |
| Master of a two-family run | deep.md, Roles and Herdr runtime; the route's input-gathering section. You coordinate and carry user decisions; you judge no code |
| Maintaining this skill | [maintaining.md](./maintaining.md), then the affected documents and helpers |
| Working on C++ | The C++ mechanisms in [unreal.md](./unreal.md) |
| Working on Unreal Engine | unreal.md's engine mechanisms as well; its version-bound facts only when relevant and verified against the project |
| Working in a project with feature, review, or diagnosis documents | Read the relevant goals, user rulings, and contracts before judging. Apply Authority below to what the documents claim |

## Authority and judgment

Own the outcome within the user's task. Establish the feature's goal and intended experience, including how it should feel to the user, before treating an implementation plan as the target.

- **Separate rulings from assumptions.** A user's answer or explicit decision is a ruling. Record what was decided and why, with the user's words or a source. Details an agent filled into a spec are implementation choices, even when the document is long or polished. A general go-ahead does not establish that the user considered every unstated corner.
- **Use documents as a map to intent and evidence.** Check technical claims against the applicable code, provider contract, or environment. Do not dismiss an analysis solely because an agent-written spec says otherwise. Existing behavior can reveal an obligation users depend on; it is not automatically the desired behavior.
- **Resolve choices in order.** Honor the authorized scope, explicit rulings, and real system contracts. Test the proposed behavior against the feature goal and user experience. Within those obligations, prefer understandable ownership, state, and failure paths, then reduce coordination, repeated work, and attention cost. The criteria for code and evidence are in good-code.md and findings.md.
- **Push back with a concrete consequence.** If a ruling or plan defeats the goal, show the scenario, evidence, and a recommendation. Ask the user to resolve conflicting goals or change a ruling; do not silently override it. Make routine engineering choices yourself. A choice needs the user when it changes a material product promise, crosses the authorized scope, or depends on a value only they can choose. Questions follow findings.md, Whose call.

## Words

- **Issue.** A claim about a defect or maintenance cost, with its site, impact, and evidence. Labels are in findings.md.
- **Proposed fix.** A proposed change answering one or more issues or a requested feature goal. Its record is defined in findings.md.
- **Shelved fix.** A recoverable candidate implementation of a proposed fix, with its baseline, dependencies, and validation evidence. Saved does not mean reviewed or checked in.
- **Check-in.** A commit to the project's history, only on the user's word.
- **Question.** A consequential choice for the user, written so they can answer without reading code.
- **Probe.** An experiment that answers a named question about the code. Its temporary instrumentation is removed; its evidence is retained.
- **Red run, green run.** A check exposing the defect before a change, then meeting the intended behavior afterwards. These are evidence for claims they distinguish, not a mandatory shape for every change.
- **Shelve.** A saved change recoverable with its baseline outside checked-in project history: a Plastic or Perforce shelve, a Git stash or patch with its base, or the project's equivalent. A branch name or worktree alone does not save an uncommitted diff.
- **Database.** The run's shared SQLite record, kept by `scripts/ledger.ts` beside this file. It retains tasks, input and result versions, assessments, ownership, dispatches and events; coordination mechanics are in ledger.md.
- **Run.** One task and its retained investigation. A new turn, context, session, or instruction to implement can continue the run. Resumption and changed baselines follow findings.md, Continuity.
- **Mark.** A recorded review of a revision by someone who did not write it. A proposal mark is optional discussion, not permission to develop a candidate.

## Attention

- Delegate independent bulk that would crowd the context needed for judgment: hunks, inventories, build output, or evidence transcripts. Name disjoint scopes. Keep the model of the change, related issues, and final judgment yourself.
- Subagents return conclusions with sites, evidence paths, and limits. Keep large artifacts on disk; read summaries and failure lines. When a summary or search result itself contains large payloads, use a scoped index or bounded excerpt and retrieve the full payload for the check that needs it. Batch independent commands within one lane without creating agents for each command.
- Cheap agents enumerate and flag; they do not own final verdicts. A brief follows the `agent-messaging` skill when available: carry the goal, relevant facts, actual constraints, and what the receiver cannot know. Let it choose the method.
- For an independent check, choose a reader who did not author the work. For a fresh check, start a new context with the claim, intended behavior, candidate, and evidence, withholding the author's argument until the reader records its own assessment. Different model families add another kind of independence. Preserve the author's rationale for later comparison and for the user.
- Take other ready work while one issue, question, build, or review waits. Run long builds in the background and continue work that cannot alter their inputs. Before handing off, preserve enough state to resume per findings.md.

## How far to go

- **Fix**, the default unless the user asks for report only. Investigate and develop recoverable candidates within the task's scope. Follow good-change.md through validation and independent review. Intermediate agreement on an issue or shape is not a gate to writing. Check in nothing.
- **Report only.** Investigate and assess proposed fixes; make no lasting source edits. Save useful experiments and candidate patches outside the checkout so a later implementation can continue from them.
- **Check in.** Only the reviewed candidates and executor the user authorizes. Selection and dependency checks follow findings.md.

Reversibility makes experimentation useful; it does not authorize changing unrelated work, overriding a ruling, publishing, deploying, or contacting others. A question blocks only the work that depends on its answer. Preserve its current candidate and continue other work.

## Experiments and reporting

- Before an edit, preserve the affected files and the current baseline, including existing user changes. Tag temporary instrumentation with one unique token. In a shared checkout, take it in the database first; [ledger.md, Shared checkout](./ledger.md#shared-checkout), governs the hold.
- Record which inputs, code, and environment the experiment exercised. Distinguish the baseline from any candidate behavior; never present a changed observation target as evidence about the original.
- Before releasing the checkout, retain the experiment's evidence and remove its temporary instrumentation. A useful test or implementation becomes part of the candidate, with the temporary tag removed. Verify cleanup without discarding candidate or user edits.
- State the mode and how far you are going when choosing or changing them. Present consequential claims with their evidence and limits; leave large logs and routine bookkeeping in the run directory. Say what remains unverified and what would resolve it.
- End a coding report with validation: what was checked, the result and candidate it applies to, skipped checks with reasons, and probe cleanup when temporary edits were made.

A diagnostic log intended to ship is a logging change under the project's policy, not temporary instrumentation.
