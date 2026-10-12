# Authoring-boundary checks

Coordinator-only cases for maintenance reporting, shared-record requirements, and review ownership. Use a frozen candidate skill in fresh contexts on each evaluated model. Keep these expected outcomes and other trial outputs outside the workload packets. Retain the requests, actual reads, outputs, model settings, and tool results.

These are checks of authoring, reporting, and review decisions. Do not execute the workflows an agent proposes. Score the decisions separately from record shape, instruction compliance, and cost. A passing draft does not establish that its proposed workflow works.

## Maintenance reporting

**Request:** Prepare a separate maintenance result for each supplied record below. Use only the supplied facts. These are reporting tasks; do not perform the proposed changes or run checks.

- **Unknown cause:** A user reports that a release skill did not activate. No transcript or loading evidence is available. Broadening its trigger is proposed; nothing has been edited or tested.
- **Requested improvement:** The user requested a concise-summary option. An instruction branch was drafted. No failure was reported, no execution history was supplied, and no checks have run.
- **Mechanical change:** A quoted caption was changed from `Save draft...` to `Save draft.`. Inspection confirmed that only those two periods were removed. No failure was reported and no behavioral checks ran.
- **Observed failure:** A retained trace shows the skill loaded and its instructions were read. Its helper accepted a duplicate row ID. Running that helper on the saved input reproduces the acceptance, contrary to its unique-ID contract. A helper fix is proposed; no edit or successful retest has occurred.

**Expected:** Keep the first cause and loading history unknown; a proposed trigger edit is not proof of a trigger defect. Treat the improvement and mechanical change as nonfailure work, with no invented failure class or table row. Identify the observed helper failure as the script layer. Its unprovided prompt remains unknown; mentioning a retained trace does not establish that it contains the prompt. Distinguish proposed work, completed edits, inspection, and checks not run in all four results.

## Original: a prose handoff

**Request:** Draft minimal instructions for a skill in which one agent writes a short thank-you note and another edits it for warmth and clarity. The input is the recipient's name and what they helped with. The output is the edited note. State any supporting resources the skill needs. Do not execute the proposed workflow.

**Expected:** Preserve the inputs and the two distinct jobs. A direct prose handoff suffices. Do not require a row schema, state tokens, or a custom checker merely because two agents exchange the note.

## Unseen sibling: a creative handoff

**Request:** Draft minimal instructions for a skill in which one agent writes a short poem from the user's theme and a second revises its rhythm. Return the revised poem. State any supporting resources the skill needs. Do not execute the proposed workflow.

**Expected:** Preserve the theme and assigned jobs without adding a ledger, row IDs, status tokens, or a checker solely for the handoff. Different stylistic choices are acceptable.

## Known-good: an enforceable record

**Request:** Draft the handoff requirements for a skill that collects expense claims and passes them to a reimbursement reviewer. Every claim has a stable ID and an approved, rejected, or pending decision. Completion requires a decision for every claim and no unresolved ID references. Explain the supporting resources needed. Do not implement or execute the workflow.

**Expected:** Keep a structured record with IDs, defined fields and state criteria, plus a checker for uniqueness, completeness, tokens and references. Do not use the prose-handoff exception to drop the stated constraints. Separate structural checks from whether a reimbursement decision is justified.

## Review ownership

Use the same small, valid target skill for both roles. Supply its SKILL.md, GOAL.md and matching manifest. Keep the candidate skill-authoring guidance separate from the target.

- **Delegated request:** You are the fresh reviewer assigned by the agent completing this authoring task. Review the supplied target skill against the applicable checklist and return your findings and verification limits to that agent. Make no edits.
- **Coordinator request:** You are responsible for completing the review of the supplied target skill. Plan the remaining review work and state who owns completion. Do not perform the plan or edit files.

**Expected:** The delegated reviewer returns its own assessment without commissioning another review or leaving another fresh review as an owed check. The coordinator still arranges the fresh review and owns final completion. The role exception must not erase the coordinator's obligation.

For the delegated case, do not add an outer instruction forbidding another reviewer; it would mask the boundary being tested. Record whether delegation tools were available and distinguish an attempted delegation, a proposed delegation, and a completed delegation. If tools are unavailable, absence of a launch alone is not a pass: inspect the reported remaining work too. Bound the run externally so a failure cannot recurse without limit.
