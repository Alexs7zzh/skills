---
name: coding
description: "Use when implementing or changing code, reviewing code, a diff, branch, changeset, PR, or uncommitted changes, or investigating software bugs, performance problems, warnings, telemetry, crash reports, or a fix that did not hold."
---

# Coding

## Read for the work

For a specified mechanical or presentation edit, the target and relevant knowledge suffice. Otherwise, before substantive code inspection or edits, read the applicable guidance below. This applies at every level, including dispatched assignments. Select by the code and decision in scope, not by the level's name.

| Work in scope | Read |
|---|---|
| Code implementation, review or diagnosis | [good-code.md](./good-code.md): Values and the relevant lenses; [good-change.md](./good-change.md): design and boundary judgment |
| C++ | [cpp.md](./cpp.md) |
| Unreal Engine | [unreal.md](./unreal.md), plus cpp.md when the code is C++ |

If investigation reaches another language, engine or design boundary, load its guidance before judging that code. Already-read guidance need not be loaded again while it remains available in context.

## Choose the level

Use the user's explicit directive, not your estimate of difficulty. Match these selectors case-insensitively:

| User directive | Level | Read |
|---|---|---|
| No selector | Normal | The normal path below |
| `deep` or `deeply`, directing how to do this task | Deep investigation | [investigation.md](./investigation.md) |
| `deep` or `deeply` together with `with two models` or `with multiple models`, directing this task | Joint investigation | [investigation.md](./investigation.md), then [joint.md](./joint.md) |

The joint selector takes precedence. Examples: "review this deeply" selects deep; "deep review with multiple models" selects joint. "Thorough", "exhaustive", "diagnose", "bug", risk, and size are not selectors. Neither are `deep` in code, a filename, quoted material, or a request to change deep-copy behavior. A negated selector does not enable its level. Do not infer a higher level or launch a team to compensate for uncertainty.

Keep the chosen level through follow-ups to the same task unless the user changes it; a new standalone task defaults to normal. A dispatched assignment inherits the parent's selected level and authority, not a fresh mode decision. An explicit request for bounded subagent help permits that help without selecting joint investigation. Normal and solo deep work never initialize or use the ledger. Joint work follows its shared ownership contract even for a small assignment; changing level must not abandon active workers or held inputs.

State deep or joint when selected so the user can correct it. Normal work needs no mode announcement. Level selects method, not authority to act.

## Normal work

Read the target and applicable project instructions. Apply the guidance selected under Read for the work.

Make the requested change, review, or diagnosis directly. Inspect enough surrounding code to understand its actual effect. For a review, report supported findings within the requested scope; for diagnosis, distinguish the cause from a hypothesis. An unresolved question calls for useful inspection or a focused check, not automatic promotion to deep.

Check what is needed to establish the requested result. A direct CSS color change ordinarily needs the declaration and diff inspected, not browser setup or before-and-after screenshots. Render it when an actual question about the cascade or visual result requires that observation. For a logic change, choose a relevant test or code argument; do not claim runtime behavior from an unexecuted check.

Normal work requires no ledger, investigation dossier, capture runner, saved-candidate package, or separate reviewer. Keep a short handoff only when unfinished work needs to survive a context switch. Report the result and the checks actually made, with material limits; do not manufacture an issue, a checklist of skipped ceremonies, or a test merely to close a workflow.

## Authority and judgment

Establish the required behavior and finish line from the user's goal, explicit rulings, the requested workflow and real system contracts. Running a named workflow requests its stated outcome, including its default fixes and validation; the user need not repeat "fix". Explicit assessment-only or diagnosis-only requests remain read-only. An agent-written brief or scope assumption is not a user restriction or proof that the user chose every detail. Existing behavior is not automatically desired behavior. An internal state, diagnostic and user-visible consequence are different claims; identify the consumer that makes a claimed consequence real.

When project documents establish the behavior, use their map and headings to find the goal, intended experience, non-goals and failure policy. Read complete applicable sections, including supporting and conflicting statements outside the implementation topic. A superseded design is a lead, not evidence of a surviving obligation. Establish that obligation from current code, a supported external contract or actual depended-on behavior. Missing prose does not invent a requirement. Recheck the relevant basis when a new claim or proposed change introduces another consequence; do not restart unrelated work. In an investigation, retain this basis as the Contract in its existing note.

Choose within those obligations for understandable ownership, state and failure paths, then reduce repeated work and attention cost. Develop recoverable alternatives when a tradeoff needs exploration. Expose consequential assumptions and departures for the user's judgment; peer agreement does not accept a product tradeoff for them.

- **Change or fix requested:** develop recoverable local changes for the goal, including redesigns and related systems needed to solve it. Breadth is not a permission gate. Honor explicit restrictions and preserve existing work.
- **Assessment or diagnosis only:** inspect and report; make no lasting source edits. Useful experiments or candidate patches stay outside the checkout unless temporary project edits are authorized.

Carry the requested finish line, its source and applicable project restrictions through handoffs and resumed work. Reconcile earlier scope assumptions with later user rulings; local implementation authority does not extend to unrelated external effects. Ask only when a missing user decision prevents useful authorized progress. Name the blocked action, consequence, feasible options and recommendation. Continue work that does not need the answer. Deep and joint investigations retain these decisions under findings.md.

## Preserve work and evidence

Inspect existing changes before editing and keep your change recoverable without losing the user's work. Keep temporary instrumentation attributable, retain useful observations, and remove only your instrumentation. A useful test can remain as part of the change. A diagnostic log intended to ship is a product change, not temporary instrumentation.

Choose checks that can distinguish the claim from an alternative that would make it wrong. Record or interpret an action as completed only after its result returns and you have read it. A tool batch that retrieves a result cannot also contain your prewritten interpretation of that unseen result; `await` orders execution, not your knowledge. Planned and observed are different. Retain the relevant original output when a consequential claim needs later inspection.

## Maintaining this skill

Read [GOAL.md](./GOAL.md) and [maintaining.md](./maintaining.md) before discussing or changing this skill. A project workload used to test the skill follows maintaining.md's trial goal and automatic stop condition, not a new standalone project assignment.
