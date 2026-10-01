# The hand-off

Read when writing or judging the owner-facing text of a judged proposal: a report case block, a brief or an issue. The owner reads this text instead of the proposal. A fresh writer produces it from the accepted technical proposal; the investigator does not write it.

## Who reads it

The owner knows the product and decides what to approve. They have not read the proposal, the code or the logs, and will not. They read many of these in one sitting. If they reread a sentence, work out what a term means, or open the proposal to learn what the fix does, the hand-off failed.

## Shape

Write these parts in this order, as short paragraphs. Use the project's labels when it supplies them; otherwise label each part with its bold name. The whole block after the occurrence and impact lines stays under 250 words, and most cases need about 150. A reporting-only or no-action case stays under 100. A longer block is keeping proposal content. The budget is a ceiling, not a target.

- **What happened.** When it happens: the user action or system event. What the player or system saw. Whether the behavior is a bug, expected, or still unclassified. If the owner would not otherwise know what the feature is doing, spend one or two sentences on the ordinary case before the failure. Counts go only where the project's occurrence and impact labels ask for them, and each of those labels is one line.
- **Why our code is at fault.** One or two sentences: what the code does today and what it should do instead. Name the mechanism in product words (the retry count, the message, the request, the cleanup job), not subsystem words (the resize driver, the failure boundary, the acknowledgement). Skip this part when no code change is recommended.
- **What to do.** The change in one to three plain sentences. Then, if an owner could reasonably expect more, one sentence on what it will not do: the join still fails, the hang is not prevented. Then where the work lands, in a few words: engine or project, backend, copy that needs translation, a platform that needs its own check.
- **Caveat.** The one uncertainty that could change the decision, and what to do if it turns out wrong. Two sentences at most. Omit when there is none.
- **Optional** or **Related.** A separately approvable question the proposal commits to, or a sibling case, each in one or two sentences that say what the owner is choosing there. An alternative the proposal rejected is not optional work; leave it out.

Review status and links follow in the project's format.

## Rules

- Every term is one the owner already uses or is explained in the same sentence. A proposal term that needs a definition is a cue to describe what it does instead.
- One mechanism sentence per defect.
- A number appears only when it changes what the owner decides. "Two views, one user" belongs. Pixel dimensions, seconds to four decimals and timestamps do not.
- State what is unproven once, in the caveat. Do not hedge every sentence.
- Do not compress. Shorter sentences built from the proposal's nouns are still the proposal. Translate: say what each noun does.

## Delete before finishing

Sweep the draft and delete each of these. They stay in the linked proposal.

- The test plan and which checks will run.
- The rejected alternative and why it lost.
- What the fix preserves or leaves unchanged. Write "nothing else changes" when that matters.
- How the fix behaves on edge inputs (a repeated request, a wrong ID, a missing row), unless the owner must choose one.
- File names, line numbers, changesets, function and enum names.
- How the investigation was done, and what model or evidence proved the mechanism.
- "Nothing has been built or tested yet" and approval reminders. The status line carries them.
- A second statement of a limit already in the caveat.
- Every option of a sibling case. Say what the owner chooses there and link it.

## The writer

A fresh context receives this file, the accepted technical proposal, the project's section labels and the applicable owner rulings. No investigation note, raw logs, code, earlier drafts or verdicts. Write the hand-off, run the delete sweep, then read it as the owner and answer from the text alone: what broke, when, is our code wrong, what will change, what will not. Rewrite any sentence that needed the proposal to answer. Count the words against the budget.

Where the proposal is unclear or contradictory, ask the investigator. Do not guess and do not research. Add no claim, remedy or commitment the proposal does not make. Dropping technical detail is the job. Dropping a limit or owner choice that changes the decision is not allowed.

## The writing judge

A fresh context receives this file, the hand-off and the technical proposal. Read only the hand-off first and write one line each: what broke, when, is our code wrong, what will change, what will not. If any line needs a guess, push back and quote the sentence that failed. Then compare with the proposal. Push back if the hand-off makes a claim the proposal does not, drops a limit or owner choice that changes the decision, implies a failed operation will succeed when the work changes reporting only, sits under a section whose meaning its committed work does not satisfy, or exceeds the budget with items from the delete list. Shortness, dropped file names and dropped preserved-behavior lists are not defects. Do not repair the text from your own expertise; name what is missing. Writing review shares proposal.md's three-review budget; after that, the batch carries the latest revision with the open objection.

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
