# The hand-off

Read when writing or judging the owner-facing text of a judged proposal: a report case block, a brief or an issue. The owner reads this text instead of the proposal. A fresh writer produces it from the accepted technical proposal; the investigator does not write it.

## Who reads it

The owner knows the product and decides what to approve. They have not read the proposal, the code or the logs, and will not. They read many of these in one sitting. If they reread a sentence, work out what a term means, or open the proposal to learn what the fix does and why it is worthwhile, the hand-off failed. An abbreviated batch list or final summary used for that decision carries the same answers; a link does not supply missing reasoning.

## Shape

Write these parts in this order, as short paragraphs. Use the project's labels when it supplies them; otherwise label each part with its bold name. Length is whatever the decision needs and nothing more. A one-line severity change needs a few sentences; a cause fix with an open attribution question needs more. Word count is not a goal in either direction: a block that runs long is usually keeping proposal content, and a block padded to fill every part of the shape is as bad. Most cases land between about 100 and 250 words after the occurrence and impact lines; treat that as a signal to recheck, not a rule.

- **What happened.** When it happens: the user action or system event. What the player or system loses, and what recovery, fallback or feedback follows. Whether the triggering condition and its handling are defective, expected under a stated policy, or still unclassified. If the owner would not otherwise know what the feature is doing, spend one or two sentences on the ordinary case before the failure. Counts go only where the project's occurrence and impact labels ask for them, and each of those labels is one line.
- **Why our code is at fault.** For a demonstrated defect, explain what the code does and what it should do instead in one or two sentences. Name the mechanism in product words (the retry count, the message, the request, the cleanup job), not subsystem words (the resize driver, the failure boundary, the acknowledgement). Skip this part for correct handling or an intended policy change; explain the new goal in What to do.
- **What to do.** Each recommended response and why its outcome is worthwhile, in a few plain sentences. Keep design review, evidence, recovery and feedback work distinct when the proposal commits to them. Include a material cost or owner choice, especially when changing a limit or retry timing. For reporting-only work, explain why the underlying handling is acceptable or what still needs action; fewer logs do not settle that question. Then, if an owner could reasonably expect more, one sentence on what it will not do: the join still fails, the hang is not prevented. Then where the work lands, in a few words: engine or project, backend, copy that needs translation, a platform that needs its own check.
- **Caveat.** The one uncertainty that could change the decision, what to do if it turns out wrong, and what would show that it has. "Reopen if joins get slower" needs the line or report that would show slower joins. Two sentences at most. Omit when there is none. A planned effect of the fix is not a caveat; it belongs in What to do.
- **Optional** or **Related.** Optional holds work the proposal explicitly offers as optional rather than recommends; a recommended response stays in What to do even when the owner can approve it separately. Related points to a sibling case. One or two sentences each, of the form "approve X separately; its answer tells you Y" or "case N decides whether X". An alternative the proposal rejected is not optional work; leave it out.

Review status and links follow in the project's format.

## Rules

- Every term is one the owner already uses or is explained in the same sentence. A proposal term that needs a definition is a cue to describe what it does, or to delete the sentence when the owner decides nothing about it. Deleting is usually right; explaining adds new terms, and the explanation itself then needs the proposal.
- Keep the proposal's certainty in both directions: plain is not the same as sure, and a hedge the proposal does not make is a new claim. "Not measured" stays "not measured"; a row count stays a row count, not an incident count; one observed trigger is not the trigger; a consequence of the fix is not today's behavior; a cause the proposal leaves open is not assigned to one side. Write the fix's scope exactly as committed, neither wider nor narrower. Recovery checked only in source is not observed recovery.
- One mechanism sentence per defect.
- A number appears only when it changes what the owner decides. "Two views, one user" belongs. Pixel dimensions, seconds to four decimals and timestamps do not.
- Do not compress. Shorter sentences built from the proposal's nouns are still the proposal. Translate: say what each noun does.

## Delete before finishing

Sweep the draft and delete each of these. They stay in the linked proposal.

- The test plan and which checks will run.
- Rejected implementation alternatives and their technical comparison. Keep the reason for a consequential owner choice.
- Inventories of unchanged behavior. Keep the recovery, fallback, feedback or policy fact that explains why the remaining user outcome is acceptable; "nothing else changes" cannot replace it.
- How the fix behaves on edge inputs (a repeated request, a wrong ID, a missing row), unless the owner must choose one.
- File names, line numbers, changesets, function and enum names.
- How the investigation was done, and what model or evidence proved the mechanism.
- "Nothing has been built or tested yet" and approval reminders. The status line carries them.
- A second statement of a limit already in the caveat.
- Every option of a sibling case. Say what the owner chooses there and link it.
- A count converted to a unit the proposal did not count, and an occurrence line that needs a reread to see how its numbers relate.

## The writer

A fresh context receives this file, the accepted technical proposal, the project's section labels and the applicable owner rulings. No investigation note, raw logs, code, earlier drafts or verdicts. Write the hand-off, run the delete sweep, then answer these reader questions from the text alone. They are review prompts, not extra headings for the hand-off:

- What happened, and how does the user fare?
- When does it happen?
- Is our code wrong, or is this correct handling or a policy choice?
- What will change?
- Why is that response worthwhile, including any material cost?
- What will it leave unresolved or unchanged?

Rewrite any sentence that needed the proposal to answer. Then cut any sentence whose removal leaves those answers intact.

Where the proposal is unclear or contradictory, ask the investigator. Do not guess and do not research. Add no claim, remedy or commitment the proposal does not make. Dropping technical detail is the job. Dropping a limit or owner choice that changes the decision is not allowed.

## The writing judge

A fresh context receives this file, the hand-off and the technical proposal. Read only the hand-off first and answer the reader questions under The writer, one line each. If an answer needs a guess, push back and quote the sentence that failed.

Then compare with the proposal and the chosen project section. Push back on unsupported claims or certainty, a dropped committed response or missing decision-relevant limit, choice or cost, a reporting change presented as recovery, acceptable handling without the recovery, fallback, feedback or absence of remaining loss that makes it acceptable, a wrong section, or content from the delete list. Do not repair the text from your own expertise; name what is missing.

Shortness and omitted technical inventories are not defects. Length alone is never a reason; a harmless wording preference is a note, not a push-back. Writing review shares proposal.md's three-review budget; after that, the batch carries the latest revision with the open objection.

## Publishing as an issue or comment

When the user asks to file the hand-off in a tracker, the issue is the hand-off plus a section for agents. The two parts serve different readers and must not blur.

- **Human part first, verbatim.** The judged hand-off text is the body's opening, unchanged: the project's occurrence and impact labels, then the labeled parts. Do not rewrite it; the writing judge accepted that exact text. Precede it only with the project's checkout or component line when the project uses one.
- **Then `## For agents`.** Everything an implementer needs that a human does not: a few original log rows, the message template and a recurrence query, the checked facts with changeset, files, line references and the verdict per owned stage, the applicable rulings written as rules with the document that owns each, every open question with what its answer would change, the committed operations with the checks they must assert, rejected alternatives, scope, risk, validation route and constraints. Bullets, not pasted prose.
- **The issue stands alone.** A reader with only the tracker and the code checkouts must have everything. No path to a machine-local file, run directory, note or draft. No "see the proposal". Carry the fact into the body instead. Before publishing, scan the body for local paths and run-scoped names; the count must be zero.
- **No run-scoped references.** Case numbers, batch names and dispute appendices exist only inside the triage run. Where the hand-off says "case 12", link the sibling issue by its title, or describe the sibling in a clause if it has no issue. The same for "the second investigator" or "the review": say what was established, not who said it.
- **Redact.** Replace user and session identifiers with tokens such as `user-A` and `session-A`. Remove device identifiers, emails, addresses and paths that name a person or machine. Keep build and changeset identifiers.
- **Mark line numbers with their changeset.** Line references drift. State the changeset they were read at, prefer the symbol name beside the number, and say when the current head has moved.
- **Mark what the proposal did not say.** A fact added from current source, an inferred alternative, or a constraint line written to meet this template is labeled as such in the agent part. The human part makes no new claim.
- **Provenance, not sources.** End with one or two sentences naming the run, its window and both review verdicts. Not a list of files.
- **Labels follow the project's rules.** Attach the priority its rubric supports from the case's counts and window. Attach a kind label only when the hand-off establishes a concrete failure. Never attach a readiness label an agent may not set.
- **Existing issue applies.** When the proposal's recommendation is to update or reopen an existing issue, post a comment there in the same shape, opening with one line on what is new for that issue, and do not relabel or reopen it. A no-action case is not filed unless the user asks; its reopen signal belongs in the report.

## Example

What an owner asked after reading compressed hand-offs, each a sign of a missing answer:

- "Is this changing the copy of the existing error handling, or extending it? What exactly do you want to do?" The change was never stated in one sentence.
- "Where is this DELETE coming from? Does the 500 mean our server is wrong, our handling is wrong, or we need a retry?" The request's purpose and whose code is at fault were never said.
- "I just want to know what happened and what you'll do. The rest of the paragraph is useless to me." Preserved behaviors, numbers and the test plan buried the decision.

Before, the proposal compressed:

> The resize driver currently accepts any frame as acknowledgement and resets escalation on unchanged requests. Correct it to acknowledge authoritative current source dimensions, including when destination allocation returns early, and retain progress across unchanged resends. This makes the existing stronger compositor restart reachable through wrong-size frames and stops resize nudging once source size matches.

After, the hand-off:

> **Why our code is at fault:** the resize code treats any incoming frame as "resize done", even a wrong-size one, and resets its retry count every time it re-sends the same resize request. So its stronger recovery step, hiding and re-showing the browser to force Chromium to redraw, is never reached while wrong-size frames keep arriving.
>
> **What to do:** only count a frame as "resize done" when it is the requested size, and keep the retry count across repeated identical requests so the hide/show step is reached. Add the retry progress to the existing failure log line so next time we can see whether it ran. Engine change. Windows needs its own check.
