# Deep investigation

Read only when the user selects deep or joint investigation under SKILL.md. This method adds causal reasoning and retained evidence, not a database or a mandatory second agent. Joint work adds joint.md. The selected level does not authorize source edits that the user did not request.

Read [good-code.md](./good-code.md) for judgment, [evidence.md](./evidence.md) for checks and the working note, and [findings.md](./findings.md) for retained claims and continuity. When developing a candidate, apply [good-change.md](./good-change.md). Read cpp.md or unreal.md only for their language or engine.

## Establish the question

Identify the requested outcome, target version and environment. Retain the Contract: required behavior and its source, applicable rulings and exceptions, and the consumer where the consequence occurs, following SKILL.md's Authority and judgment. Keep unresolved assumptions explicit.

- **Review:** identify the code or diff and existing local changes. Cover the requested scope and the callers, owners or contracts it affects. Do not turn an unrelated pre-existing style concern into requested work. Unchanged code matters when the change depends on it or makes it a new sole path or boundary.
- **Diagnosis:** retain the symptom, expected experience, original traces and reproduction conditions. Group reports by mechanism or behavior, not just their arrival format. A captured telemetry row establishes an observation, not that a local patch corrected the shipped behavior.
- **Feature or change:** identify acceptance scenarios, including affected failure outcomes. Investigate the design questions that remain; do not invent a defect or a sequence of hypotheses when the requirement is settled.

Keep one evolving note from the start. Its current understanding, evidence pointers and next question should let another reader continue without repeating discovery.

## Resolve the uncertainty

1. Establish the symptom or disputed claim as precisely as the available evidence permits. Find the shortest useful observation that distinguishes it from expected behavior. Reduce a reproducer without removing the failure mechanism; pin controllable timing or randomness where useful.
2. Where alternatives remain, name the observation that would distinguish them. Run useful experiments instead of extending an argument they could settle. An obvious cause does not need a quota of alternative theories. Investigate surprising results by checking the observation method and inputs too.
3. Develop a candidate while the mechanism and affected boundary are in context, when implementation is authorized. The candidate can test the hypothesis. For report-only work, retain an examined proposal and useful outside-checkout experiments. Neither a proposal nor an experiment needs a phase approval.
4. Check the candidate against the original claim and actual acceptance conditions. Trace sibling mechanisms before claiming a wider class resolved. If a check is unavailable, use another method that can answer the question or narrow the conclusion with the missing evidence stated.
5. Reassess the claim, change and evidence together. Reuse checks whose inputs and assumptions still apply under findings.md, Continuity. Solo deep work does this locally; joint work gets the independent judgments described in joint.md. Do not label a self-check independent review.

These steps can overlap. A known cause need not be rediscovered; a failing test is not mandatory for every kind of change. Preserve interrupted or partial evidence without calling it completion. Batch independent checks on stable inputs; a check whose design depends on an earlier result belongs after that result is read.

For a recurring field failure, examine whether the project's detection or recovery policy should have exposed it and whether it did. A missing detector matters when it defeats an actual obligation, not because another watchdog could be added.

## Conclude and continue

Account for the requested questions with supported outcomes or explicit gaps. A stopped, disproved, impossible or intentionally unchanged outcome is not a successful fix. Further work needs a remaining uncertainty or uncovered obligation, not repeated clean passes or pass counts.

Report the goal, supported findings and their consequences, implemented changes or proposals, evidence and limits, and unresolved decisions. Rank substantive findings by impact and group minor ones. Say what was actually checked and which candidate/environment the result covers. Keep long logs and routine detail in the retained artifacts; do not turn every note into a report to the user.

Retain useful candidates, validation and unfinished work for continuation. If the user changes the level, carry the applicable work into its new record without repeating discovery.
