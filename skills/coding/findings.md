# Findings

From claim to delivery: how a claim is proved, what decision follows, which remedy answers it, and how a concrete landing reaches the user. Read at your first finding, dismissal, contested claim, or remedy. The certainty steps are defined in SKILL.md.

## Work objects

Keep six objects separate. Each has its own revision and state:

| Object | It answers | States |
|---|---|---|
| **Coverage item** | Did the run account for this hunk, symptom, cluster, or scenario? | open, accounted, gap |
| **Claim** | What is true? | candidate, verifying, verified, assumed, contested, disproved, dup, accepted (Nit only) |
| **Decision** | Who chooses, and has the choice been made? | agent-decidable, needs-ruling, needs-external-evidence, decided |
| **Remedy** | What change should answer which claims? | draft, reviewed, fixable, rejected |
| **Landing** | Did this implementation work? | implementing, landed, red-green-proved, fix-reviewed |
| **Delivery** | May this landing enter the product? | awaiting-approval, approved, checked-in, dropped |

Relationships carry invalidation. One remedy may answer several claims, and one claim may have several remedy options. A claim edit invalidates the decisions, remedies, and landings that depend on it. A remedy edit invalidates only its review and dependent landings. A landing edit invalidates only its red-green proof and landing review. Never reopen an agreed fact because its cost, wording, fix shape, or implementation changed.

## Proving a claim

- When a fifteen-minute probe exists, run it instead of arguing, and parameterize it in physical units rather than the design's own units. No Claim closes that a probe could have settled.
- Prefer the shipped seam to a replica, since a temporary test driving the real code proves the wiring and a replica proves only the algorithm.
- A test's existence never closes a claim: verify the property, not the test's name.
- Doc and comment claims are claims to verify against the code, coverage claims included: a named test must exercise the shipped path.
- Dismissals are conclusions to prove: "not our fault", "engine noise", and "by design" close nothing until evidence per occurrence backs them, and engine, plugin, and vendored code count as the project's own for this purpose.
- A probe's verdict inherits its inputs. Two probes that disagree about one mechanism have usually differed in inputs rather than in correctness, so sweep the input class instead of preferring a run.
- Match the evidence to the claim. Running code proves "it can happen" with one counterexample, and measures "how often" and "how much"; it never proves "it cannot happen" unless the run covers every case the claim spans, so a stress run with zero failures is a frequency result and closes no never-claim. To close "never", read the code and walk every path that could reach the bad state, or cite the contract that forbids it. Correctness is proved by reading; likelihood is measured by running. A release-gating never-claim still needs its step-4 evidence: probe the facts the walk depends on, not the outcome.
- Numbers that lower severity get the least challenge, so check them hardest.
- Audit against the real thing rather than proxies, and that includes a record's own claims: a provenance or coverage claim is verified against the external source it names and never against the changeset's own hashes, names or constants. When a verification fails, suspect the observation method before the system.
- Disassembly of a prebuilt dependency is a probe too: the headers state the contract, the archive shows what shipped, so read the artifact instead of arguing from a config flag.
- Probes run in waves: design every probe the diff suggests, then one build and one test run with the owning suite in the filter. A probe designed from another probe's output starts the next wave. Design each probe yourself.
- Within one run, evidence transfers and arguments do not. A Claim closed at step 4 or 5 with its evidence in the run directory stays closed. A new reader re-walks a Claim closed below step 4 before it suppresses anything new. Across runs, a past report and its artifacts are testimony; verify the Claim against the current code or execute it again.

## Verdicts

Findings and verdicts are decisions.

- Lead with user impact.
- Severity follows the investigated trigger: how the condition arises, at what scope, roughly how often.
- A claimed failure that cannot realistically occur, because the build catches it or the state is unreachable, is downgraded or rejected with that evidence and stays closed until new evidence.
- A finding that hinges on an unrecorded product stance keeps its factual claim and opens a **needs-ruling** Decision, phrased as a question the owner can decide from.
- Recorded deliberate choices suppress findings unless new evidence challenges them, and a ruling suppresses only the claims its rationale addresses: check what it ruled on, not what it is near.

## Labels

- **Bug.** A defect with an investigated trigger. Its proposal names the test that would have caught it and that test's seam.
- **Restructure.** A structure that invites a class of bugs, proposed with what the new structure deletes. Several bugs sharing a structural cause report as one Restructure with the bugs as evidence.
- **Hardening.** A real defect with low current impact. Fixed in the same touch as the substantive work in that file or subsystem, where the risk is already being tested, and never gates a release on its own. It does not use the Nit-only accepted exit.
- **Nit.** One run of life: fixed opportunistically when its file is next modified, or dispositioned **accepted** with its reason and removed from the open ledger.
- **telemetry-quality.** A defect in what the telemetry says rather than in what the product does: a wrong or missing field, a misleading message, misgrouping, a symbol or release gap. Fixed as a logging or pipeline change under the project's logging policy, and never release-gating on its own.

## Composition

Composition is a relation, not a terminal label. When related verified claims together imply a new failure, root cause, or severity, record a derived Claim linked to them and verify it normally. When remedies overlap, conflict, share a structure, or require an order, record that constraint on the linked Remedies before either landing. Recompute only the connected group whose claim or remedy changed.

Standing rulings on labels:

- A document contradicting its own release contract is a Bug, not a nit.
- An unjustified magic number in changed code is a finding on its own.
- A missing correct seam is an architecture finding.
- Your own worse measurement is a finding, not a note.
- A clean claim that fails an audit becomes a finding.
- A deadline snapshot does not turn an open Claim into a clean verdict.

## Severity

Impact bounds downgrade the instance, never the finding. "Harmless as observed" is a severity note, not a disposition. Release-gating claims need step 4; a release-gating claim may stay assumed only after stating why no fifteen-minute probe exists, and it stays visible.

## Whose call

A choice the owner must make is handed over as a decision package the owner can decide from alone:

- the question in plain user-experience words covering what happens, when, and roughly how often;
- how the triggering condition actually arises, investigated in the code and environment rather than hypothesized;
- each option's cost in code impact, measured against the actual code, and in user effect;
- and a recommendation.

Three rules on the package:

- When two fix shapes compete and you genuinely cannot pick, that is still a result with a required shape: name the value the choice turns on, say why it is the owner's call, and map it, as in "if you weight X take the narrow fix, if you weight Y take the restructure". An unmapped choice handed to the owner is work in progress, not a result.
- Check every option against recorded rulings first, since an option a ruling closes is withdrawn rather than offered, and reopening one takes new evidence.
- A question the owner cannot decide from the package is unfinished work, not a ruling request.

## Closing a run

The ledger and its directory belong to one run. A later run does not read them; its agents treat the past report as testimony.

- Each object reaches its own terminal state. A verified defect is answered by a checked-in Remedy with its regression test, a comment or assert that records the invariant, a ruling or baseline in the owning feature doc, a carried external-evidence task, or an explicit drop.
- Closing a delivery is part of a fix: record its changeset in the same touch as check-in, disposition every departure from the approved remedy, and fix or accept each Nit with its reason.
- Two consecutive passes with nothing new is saturation for the current run. Record it in the snapshot; it does not erase open external evidence or owner decisions.
