# Diagnose

The route from an observed symptom to a supported cause and, when authorized, a reviewed candidate.

## Choose the mode

State plain or deep beside how far you are going.

| The investigation | Mode |
|---|---|
| A bounded symptom or coherent cluster without a risk surface | Plain |
| Independent clusters that exceed one judgment context, a cause on a risk surface, or a requested deep or exhaustive diagnosis | Deep; read [deep.md](./deep.md) for joint coordination |

Risk surfaces are listed in good-code.md. Choose by the work, not by whether symptoms arrived in one export or several. Escalate if new evidence requires deep coordination, retaining the investigation so far.

## Gather the input

Record the user's symptom, expected experience, affected version and environment, available traces or reports, and any reproduction steps. Group telemetry by the behavior or mechanism to investigate; retain the original artifacts. A master can gather and group input without choosing a cause.

## Build the feedback loop

Find the shortest useful observation that distinguishes the symptom from expected behavior. Inspect enough code and environment to locate an entry point, replay path, or test seam. This reconnaissance does not commit you to a causal theory.

When possible, produce one agent-runnable command that exposes the exact symptom and can be repeated against a candidate. Reduce irrelevant inputs, pin controllable time or randomness, and shorten the iteration. A trace replay, integration test, running-instance script, differential comparison, or harness may serve; findings.md, Evidence, decides what each establishes.

For intermittent failures, retain the observed rate and conditions and improve reproducibility without claiming determinism you did not achieve. For telemetry from shipped builds, an assertion over captured rows can locate affected cases but cannot show that a local fix changed the shipped behavior. State that limitation and seek a code-level check when one can reach the mechanism.

If the full loop is unavailable, retain the best signal, what it establishes, and the missing input or access. Continue code or contract analysis that can narrow the uncertainty. Ask for external evidence only when it is needed for the remaining claim.

## Investigate and develop

1. Reproduce or establish the symptom as precisely as the available evidence permits. Minimize the case without removing the failure mechanism.
2. Form falsifiable hypotheses where alternatives remain. For each live alternative, name the observation that would distinguish it; do not invent a quota of theories when evidence already selects one.
3. Run discriminating experiments, controlling the variables needed to interpret them. For performance, establish the relevant baseline before attributing cost. Use the probe rules in SKILL.md.
4. Develop a candidate as understanding becomes concrete, per good-change.md. The reproducer and useful experiments stay with the change; the candidate can test a causal hypothesis before another reviewer agrees. Trace sibling mechanisms and related causes before claiming the wider problem resolved.
5. Validate, retain, and independently review the candidate through good-change.md. Report-only work retains its examined proposal and experiments for later continuation.

Use findings.md, Working record, from the initial investigation, or continue the shared record in a deep run. Cover every input cluster with a supported cause or an explicit gap; an export assertion alone is not verification of a code cause.

## Report

Use the records in findings.md. Separate supported causes from open hypotheses and show what evidence could resolve the remaining alternatives. State whether each candidate addresses the user's actual symptom and which environment was checked.

For a recurring field failure, investigate whether the project's detection or recovery policy should have exposed it, and whether that mechanism worked. A missing or inert detector is an issue when it defeats an actual diagnostic obligation, not merely because another watchdog could be added.

Show proposed fixes and candidates with their states, user decisions, and missing evidence. Keep relevant pass counts and useful retrospective deltas in the notes. End with validation per SKILL.md.
