# Investigation evidence

Read for deep or joint investigation. Normal work uses SKILL.md's proportionate checks and honest reporting; reading a code-quality lens does not make this capture procedure mandatory.

## Choose the evidence

State the claim and a plausible alternative that would make it wrong. Choose a check whose result could distinguish them, using the boundary, inputs and environment the claim covers. Agreement, a test name or repetition of the implementation is not independent evidence.

| Claim | Useful evidence |
|---|---|
| A defect occurs and the change removes it | A reproducer on the affected code before and after the change, with inputs and results retained |
| Structure changes while behavior is preserved | Relevant behavior checks on both versions plus an argument for changed ownership or invariants |
| A feature meets its goal | Acceptance scenarios derived from the intended experience and rulings, including failure paths; a demo when experience cannot be judged from code |
| A path meets a performance budget | Measurements on that path and workload against the budget, with environment and scaling assumptions |
| A state cannot occur | A code or contract proof covering the ways it could arise and supporting its premises; a clean stress run establishes only its observations |

Choose probe inputs independently of the design's convenient constants or symmetries. Test through shipped code when the claim includes its wiring; a replica establishes only the mechanism it reproduces. For intermittent failures, retain conditions and measured frequency without claiming determinism.

If no available check can distinguish the alternatives, narrow the claim or leave the uncertainty open, saying what would resolve it and why it is unavailable. Do not manufacture a failing test, treat every missing seam as an architecture defect, or ask the user to waive an arbitrary log requirement. Testability is an issue when it prevents an assurance the project actually needs.

## Capture and interpret

Keep planned checks separate from observed results. A plan names the question, method and intended inputs; it must not contain completed-looking results. Observe before interpreting under SKILL.md, Preserve work and evidence.

For an investigation test, probe or measurement you execute, use `node --no-warnings <skill>/scripts/evidence.ts run`; its help supplies the interface. It retains the literal command, selected input snapshots, raw output and actual termination. It uses the same authorization and input-ownership rules as the direct command and requires no database.

A completed `run` verifies the fresh capture and returns `start`, `receipt`, and the `stdout`/`stderr` paths. Read the output supporting the claim before recording an interpretation. No immediate `inspect` command is needed after this verified handoff. Use `inspect` when reusing a capture or checking it after interruption or suspected changes. Receipt creation does not establish a passing test; an interrupted or running capture supports only the partial observations actually received.

Record the capture path, the observation and claim it supports, applicable candidate/baseline and environment, and remaining uncertainty. Selected snapshots are not proof that every build input was captured: stabilize the actual inputs or preserve an immutable candidate, and name the combination exercised.

For an existing external observation that cannot use this runner, retain the actual tool result or original log with invocation and provenance. Do not rerun a live system merely to change record format. For a code proof, retain paths, assumptions and contracts walked; it needs no execution receipt. Keep useful conclusions in the note and long output in artifacts.

## Findings and impact

Name the actual evidence basis: source or observed fact, code/contract proof under stated assumptions, executed check on named inputs, or observation in the running target. These are not certainty scores or a total ordering. A verified claim needs evidence that supports its stated scope; a higher-fidelity observation does not automatically prove a broader claim.

A dismissal has the same burden as the claim it makes. "By design", "engine noise" and "not our fault" need the applicable ruling or evidence. Engine, plugin and vendored code remain investigation targets when they determine the outcome. Investigate a trigger's scope and frequency where relevant, distinguishing measurements from estimates. For maintenance findings, name the affected future task or failure class.

Use labels when they help group findings:

- **Bug:** a defect with an investigated trigger or a supported proof of a violated contract.
- **Restructure:** a concrete maintenance cost or failure mechanism that structural change removes. Apply good-code.md's deletion test.
- **Hardening:** a real defect with low current impact.
- **Nit:** a minor improvement with no substantive impact.
- **telemetry-quality:** a defect in telemetry, judged against its logging or pipeline contract.

Lead with user consequences, ranking findings by impact and grouping minor items. Low measured impact does not prove an invariant sound; investigate numbers that lower severity as carefully as those that raise it. A human ruling suppresses only claims its rationale addresses. New evidence can justify a clearly identified alternative, not silently replace the ruling.

## Working note

Keep one evolving note, not a document per action. Retain the goal, chosen level and authority, baseline, Contract, current understanding, evidence pointers and next question. Add observations and their limits as they arrive. Leave unknowns open instead of inventing complete fields.

Before switching work or losing context, retain useful candidates, unfinished decisions, reasons for rejected alternatives that matter, and the next action. Findings.md owns version applicability and resumption. A private checkpoint can supplement this record, not replace what another reader needs.

Solo deep work keeps this note and its artifacts even when it grows, develops multiple candidates or waits for a user decision. Only a user-selected joint investigation moves those commitments into the shared record under joint.md. Reuse the existing work when changing level; record format does not require repeating the investigation.
