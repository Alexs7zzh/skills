# Editing this skill

Read this once, after the user says yes to changing their local copy. The goal is to turn a review miss into the smallest instruction that would reliably catch it next time, without growing a checklist that weakens the rest of the skill. These levers are ranked by how reliably each changed behavior when tested; prefer the top of the list.

1. Output-contract slots execute reliably; process bullets asking the same thing mostly do not. Add the section that proves the behavior happened.
2. Object sweeps, nouns to enumerate, beat activity instructions.
3. Sharp mechanism cues are load-bearing. An absent cue produces confident false cleans, not silence.
4. Checklist bulk beyond the cues dilutes. The codebase carries project-type facts, so docs earn lines only by stating deviations from a strong reviewer's defaults.
5. Enumerate-then-close doubles recall for 10-20% more cost.
6. Probes beat argument.
7. Cheap agents never own verdicts.
8. Noise control comes from recorded policy, not caution.
9. One-line behavior cues fire about half the time. Enforce behaviors through levers 1 and 2.
10. Encode lessons in structure before instructions: unrepresentable state > CI-failing lint or test > canonical helper > runtime check > doc rule.

Keep the split the read-set table in SKILL.md shows: one concept, one section, and one read moment, one file, because a rule copied into two places drifts; every pointer carries the trigger that sends the reader there, because a file mentioned without its trigger does not get read. `ledger.sh` and `ledger.sql` are the deep-run protocol in executable form: a rule that can be a constraint or a trigger goes there before it goes in prose, per lever 10. Analysis always runs; edits wait for a yes, so that review evidence becomes the smallest reliable instruction rather than a growing checklist.
