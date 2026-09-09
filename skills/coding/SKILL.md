---
name: coding
description: "Use when implementing or changing code, reviewing code, a diff, branch, changeset, PR, or uncommitted changes, or investigating software bugs, performance problems, warnings, telemetry, crash reports, or a fix that did not hold."
---

# Coding

Read this file first. It holds the shared execution contract and routes each task to its method. A dispatch names bounded work inside an existing run; use that row instead of starting a standalone review. When the work changes kind, add the new route's files without starting the investigation over.

If a project task is a trial of this skill, read [maintaining.md](./maintaining.md), Live trials, before choosing the project route. Keep the skill objective and automatic stop condition in the run; do not replace them with the workload's goal.

Choose the workflow by the judgment needed, not by whether a file contains code. For a direct, bounded presentation or mechanical edit whose intended result the user has settled, such as removing a specified sentence from a homepage or correcting a comment typo, inspect the target and relevant repository rules, make the edit, and verify the requested result and affected layout or behavior. Do not load the substantive route, create a ledger, or require a separate reviewer for that edit. Do not invoke the ledger helper unless needed to honor an existing run's ownership contract. A local diff and the smallest relevant UI or test check suffice; do not turn a copy change into a repository audit. Preserve existing work and any active shared-checkout ownership. Changes to runtime logic, authorization, data handling, contracts, or instruction design use the substantive route even when the requested line is fully specified. Escalate a presentation edit too if inspection shows it needs investigation to be safe. An explicit request for deeper review still applies.

For substantive work, read [evidence.md](./evidence.md) for evidence and the working record, and [good-code.md](./good-code.md) before judging code. Apply the lenses relevant to the target; the route sets the scope. These reads remain required in a joint run; a dispatch does not replace them. For C++ also read [cpp.md](./cpp.md); for Unreal read [unreal.md](./unreal.md) as well. The motivation and tradeoffs live in [GOAL.md](./GOAL.md); read it when discussing or changing the skill's values.

| You are | Read, in order |
|---|---|
| Writing or changing code | [good-change.md](./good-change.md); the relevant good-code.md lenses; findings.md for records, dispositions, or user decisions |
| Reviewing | [review.md](./review.md), which chooses quick or deep; good-change.md when developing or independently reviewing a candidate; [deep.md](./deep.md) for deep coordination |
| Diagnosing | [diagnose.md](./diagnose.md), which chooses plain or deep; findings.md; the good-code.md lenses suggested by the symptom or mechanism; good-change.md when developing a candidate; deep.md for deep coordination |
| Investigator in a joint run | deep.md for shared coordination, then the review or diagnosis route named in the brief. Both investigators have the same authority; an assignment names the next action, not a permanent specialty |
| Dispatched to check an existing candidate | good-change.md, Review the result, and the relevant good-code.md lenses. Use the supplied record and return the independent assessment; the parent owns coordination |
| Master of a two-family run | deep.md, Roles and Herdr runtime; the route's input-gathering section. You coordinate and carry user decisions; you judge no code |
| Maintaining this skill | [maintaining.md](./maintaining.md), then the affected documents and helpers |
| Working in a project with feature, review, or diagnosis documents | Establish the claim's contract under Authority below before judging |

## Authority and judgment

Own the outcome within the user's task. Before calling an outcome wrong or choosing a change, retain its **Contract** in the existing working note or argument: the required behavior and its source, applicable rulings and exceptions, and the consumer or user surface where the consequence occurs. Mark an assumption as an assumption. An internal state, diagnostic, and user-visible result are different claims; trace the consumer that makes the claimed consequence real.

Use the project's document map and feature-document headings to find the goal, intended experience, non-goals, and failure policy before selecting excerpts. Read the complete applicable sections, including those outside the implementation topic. Search for supporting and conflicting statements about the behavior, then resolve them under the authority rules below. Code or an external contract can supply the basis when no product document does; missing prose does not invent a requirement. Recheck this contract when a finding, proposed fix, or peer challenge introduces a new consequence or surface. Do not restart unrelated investigation or create a separate approval step.

- **Separate rulings from assumptions.** A user's answer or explicit decision is a ruling. Record what was decided and why, with the user's words or a source. Details an agent filled into a spec are implementation choices, even when the document is long or polished.
- **Use documents as a map to intent and evidence.** For a disputed requirement, retain the applicable ruling and current evidence for any obligation claimed to survive it in the Contract. A superseded or unapproved design is a lead to inspect, not evidence that its consumer or constraint still applies. Establish a compatibility obligation from current code, a supported external contract, or actual depended-on behavior. Check technical claims against the applicable code, provider contract, or environment; do not dismiss an analysis solely because an agent-written spec disagrees. Existing behavior is not automatically the desired behavior; judge it against the ruling and goal.
- **Resolve choices in order.** Honor the authorized scope, explicit rulings, and real system contracts. Test the proposed behavior against the feature goal and user experience. Within those obligations, prefer understandable ownership, state, and failure paths, then reduce coordination, repeated work, and attention cost. The criteria for code and evidence are in good-code.md and evidence.md.
- **Choose and expose tradeoffs.** If a plan defeats the goal, show the scenario, evidence, and a recommendation. Develop the best recoverable candidate under the fix authority below, and have the reviewer challenge its consequences. A proposed departure from a goal or product promise stays an explicit alternative, not a claim that the original obligation was met or the user accepted the tradeoff. Do not override an explicit prohibition. Ask only when missing user input prevents useful authorized progress, per findings.md, Whose call.

## Words

- **Issue.** A claim about a defect or maintenance cost, with its site, impact, and evidence. Labels are in evidence.md.
- **Proposed fix.** A proposed change answering one or more issues or a requested feature goal. Its record is defined in findings.md.
- **Shelved fix.** A recoverable candidate implementation of a proposed fix, with its baseline, dependencies, and validation evidence. Saved does not mean reviewed or checked in.
- **Check-in.** A commit to the project's history, only on the user's word.
- **Question.** A consequential choice for the user, written so they can answer without reading code.
- **Probe.** An experiment that answers a named question about the code. Its temporary instrumentation is removed; its evidence is retained.
- **Red run, green run.** A check exposing the defect before a change, then meeting the intended behavior afterwards. These are evidence for claims they distinguish, not a mandatory shape for every change.
- **Shelve.** A saved change recoverable with its baseline outside checked-in project history: a Plastic or Perforce shelve, a Git stash or patch with its base, or the project's equivalent. A branch name or worktree alone does not save an uncommitted diff.
- **Database.** The run's shared SQLite record, kept by `scripts/ledger.ts` beside this file. It retains work, conclusions and agreement, replacement links, evidence, ownership, dispatches and events; coordination mechanics are in ledger.md.
- **Run.** One task and its retained investigation. A new turn, context, session, or instruction to implement can continue the run. Resumption and changed baselines follow findings.md, Continuity.
- **Conclusion.** A substantive position on an investigation, supported by reasons and evidence. Publishing it endorses it; saving evidence or a checkpoint alone does not. Agreement and replacement explanations follow findings.md, Conclusions and replacement.

## Attention

- Delegate independent bulk that would crowd the context needed for judgment: hunks, inventories, build output, or evidence transcripts. Name disjoint scopes. Keep the model of the change, related issues, and final judgment yourself.
- Subagents return conclusions with sites, evidence paths, and limits. Keep large artifacts on disk; read summaries and failure lines. When a summary or search result itself contains large payloads, use a scoped index or bounded excerpt and retrieve the full payload for the check that needs it. Batch independent commands within one lane without creating agents for each command.
- Cheap agents enumerate and flag; they do not own final verdicts. A brief follows the `agent-messaging` skill when available: carry the goal, relevant facts, actual constraints, and what the receiver cannot know. Let it choose the method.
- For an independent check, choose a reader who did not author the work. For a fresh check, start a new context with the claim, intended behavior, candidate, and evidence, withholding the author's argument until the reader records its own assessment. Different model families add another kind of independence. Preserve the author's rationale for later comparison and for the user.
- Take other ready work while one issue, question, build, or review waits. Run long builds in the background and continue work that cannot alter their inputs. Before handing off, preserve enough state to resume per evidence.md, Working record.

## How far to go

Carry the user's current authority across routes, handoffs and resumed turns. A review inside an authorized fix task stays in fix mode; "do not commit" does not mean report-only. A standalone request only to assess or diagnose does not itself authorize implementation. Record the source of the chosen scope, not a restriction invented in a dispatch.

- **Fix.** Investigate and develop recoverable local candidates for the user's goal. Choose the boundary that can solve the problem, including redesigns and changes to related systems; the initially named files or subsystem do not by themselves limit the fix. Implementation breadth and a candidate's proposed tradeoffs are not reasons to seek permission. Follow good-change.md through validation and independent review, then present the result for the user's judgment. Agreement is not a gate to writing or experimenting. Check in nothing.
- **Report only.** Investigate and assess proposed fixes; make no lasting source edits. Save useful experiments and candidate patches outside the checkout so a later implementation can continue from them.
- **Check in.** Only the reviewed candidates and executor the user authorizes. Selection and dependency checks follow findings.md.

This candidate authority does not erase explicit user or project restrictions, authorize unrelated work, or permit destroying existing changes. Publishing, deployment, live-data changes, spending money, and contacting others need their own authority; no check-in does not make those effects recoverable. A question blocks only the action that needs its answer. Preserve the candidate and continue independent work.

## Experiments and reporting

- Before an edit, preserve the affected files and the current baseline, including existing user changes. Tag temporary instrumentation with one unique token. In a shared checkout, take it in the database first; [ledger.md, Shared checkout](./ledger.md#shared-checkout), governs the hold.
- Record which inputs, code, and environment the experiment exercised. Distinguish the baseline from any candidate behavior; never present a changed observation target as evidence about the original.
- Before releasing the checkout, retain the experiment's evidence and remove its temporary instrumentation. A useful test or implementation becomes part of the candidate, with the temporary tag removed. Verify cleanup without discarding candidate or user edits.
- State the mode and how far you are going when choosing or changing them. Present consequential claims with their evidence and limits; leave large logs and routine bookkeeping in the run directory. Say what remains unverified and what would resolve it.
- End a coding report with validation: what was checked, the result and candidate it applies to, skipped checks with reasons, and probe cleanup when temporary edits were made.

A diagnostic log intended to ship is a logging change under the project's policy, not temporary instrumentation.
