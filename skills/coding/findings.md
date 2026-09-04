# Findings

From issue to check-in: how an issue is proved, what it is labeled, how severe it is, whose call it is, and how it leaves the run. Read at your first issue, dismissal, disputed issue, or proposed fix. The words are defined in SKILL.md, the certainty steps too.

## Rows in the database

Six kinds of row. Each has its own revision and its own marks:

| Row | It answers | States |
|---|---|---|
| **Coverage** | Did the run look at this hunk, symptom, cluster, or scenario? | open, covered, gap |
| **Issue** | What is wrong, where, and how sure are we? | new, verified with its step, assumed, contested with its probe, disproved, duplicate, accepted (Nit only) |
| **Question** | What must the user decide? | open, answered |
| **Proposed fix** | Which change answers which issues, in what shape? | draft, marked, rejected |
| **Shelved fix** | Did the fix work? | shelved with its red and green logs, conditions, reviewed |
| **Check-in** | Did it ship? | approved, checked in, dropped |

An edit to an issue clears the marks on its proposed fixes and shelved fixes. An edit to a proposed fix clears only its own mark and its shelved fix. An edit to a shelved fix clears only its review. Never reopen an agreed issue because its cost, wording, shape, or code changed.

Verified means step 4 or 5 with an evidence path. Contested names the probe that settles it. A Bug or Restructure's proposed fix is complete only with its shape, the sites walked, the rulings checked, where its test goes, and its cost; the script refuses a shelved fix on an incomplete one.

## Proving an issue

- When a fifteen-minute probe exists, run it instead of arguing, and parameterize it in physical units rather than the design's own units. No issue closes that a probe could have settled.
- Prefer a test through the shipped code to a replica: a temporary test that drives the real code proves the wiring, and a replica proves only the algorithm.
- A test's existence never closes an issue: verify the property, not the test's name.
- Doc and comment claims are claims to verify against the code, coverage claims included: a named test must exercise the shipped path.
- Dismissals are conclusions to prove: "not our fault", "engine noise", and "by design" close nothing until evidence per occurrence backs them, and engine, plugin, and vendored code count as the project's own for this purpose.
- A probe's verdict inherits its inputs. Two probes that disagree about one mechanism have usually differed in inputs rather than in correctness, so sweep the input class instead of preferring a run.
- Match the evidence to the claim. Running code proves "it can happen" with one counterexample, and measures "how often" and "how much"; it never proves "it cannot happen" unless the run covers every case the claim spans, so a stress run with zero failures is a frequency result and closes no never-claim. To close "never", read the code and walk every path that could reach the bad state, or cite the contract that forbids it. Correctness is proved by reading; likelihood is measured by running. A release-gating never-claim still needs its step-4 evidence: probe the facts the walk depends on, not the outcome.
- Numbers that lower severity get the least challenge, so check them hardest.
- Audit against the real thing rather than proxies, and that includes a record's own claims: a provenance or coverage claim is verified against the external source it names and never against the changeset's own hashes, names or constants. When a verification fails, suspect the observation method before the system.
- Disassembly of a prebuilt dependency is a probe too: the headers state the contract, the archive shows what shipped, so read the artifact instead of arguing from a config flag.
- Probes run in waves: design every probe the diff suggests, then one build and one test run with the owning suite in the filter. A probe designed from another probe's output starts the next wave. Design each probe yourself.
- Within one run, evidence transfers and arguments do not. An issue closed at step 4 or 5 with its evidence in the run directory stays closed. A new reader re-walks an issue closed below step 4 before it suppresses anything new. Across runs, a past report and its files are testimony: verify against the current code or run it again.

## Verdicts

Findings and verdicts are decisions.

- Lead with user impact.
- Severity follows the investigated trigger: how the condition arises, at what scope, roughly how often.
- A claimed failure that cannot realistically occur, because the build catches it or the state is unreachable, is downgraded or rejected with that evidence and stays closed until new evidence.
- An issue whose fix hinges on an unrecorded product stance keeps its facts and opens a question for the user, phrased so the user can answer it without reading code.
- Recorded deliberate choices suppress issues unless new evidence challenges them, and a ruling suppresses only the claims its rationale addresses: check what it ruled on, not what it is near.

## Labels

- **Bug.** A defect with an investigated trigger. Its proposed fix names the test that would have caught it and where that test goes.
- **Restructure.** A structure that invites a class of bugs, proposed with what the new structure deletes. Several bugs sharing a structural cause report as one Restructure with the bugs as evidence.
- **Hardening.** A real defect with low current impact. Fixed in the same touch as the substantive work in that file or subsystem, where the risk is already being tested, and never gates a release on its own. It does not use the Nit-only accepted exit.
- **Nit.** One run of life: fixed when its file is next modified, or marked **accepted** with its reason and dropped from the open list.
- **telemetry-quality.** A defect in what the telemetry says rather than in what the product does: a wrong or missing field, a misleading message, misgrouping, a symbol or release gap. Fixed as a logging or pipeline change under the project's logging policy, and never release-gating on its own.

Standing rulings on labels:

- A document contradicting its own release contract is a Bug, not a nit.
- An unjustified magic number in changed code is an issue on its own.
- A missing place to put a correct test is an architecture issue.
- Your own worse measurement is an issue, not a note.
- A clean claim that fails an audit becomes an issue.
- An open issue in the report is printed as open, never as clean.

## Related issues

When two verified issues together mean something neither means alone, a new failure, a shared root cause, or a higher severity, write that as a new issue linked to both and verify it like any issue. When two proposed fixes overlap, conflict, share a structure, or must go in an order, note that on both before either is shelved. Reconsider only the issues linked to the one that changed.

## Severity

Impact bounds downgrade the instance, never the issue. "Harmless as observed" is a severity note, not a disposition. Release-gating issues need step 4; a release-gating issue may stay assumed only after stating why no fifteen-minute probe exists, and it stays visible.

## Whose call

A choice the user must make is written as a question the user can answer alone:

- what happens, when, and roughly how often, in plain user-experience words;
- how the triggering condition actually arises, investigated in the code and environment rather than hypothesized;
- each option's cost in code impact, measured against the actual code, and in user effect;
- and a recommendation.

Three rules on the question:

- When two fix shapes compete and you genuinely cannot pick, that is still a result with a required shape: name the value the choice turns on, say why it is the user's call, and map it, as in "if you weight X take the narrow fix, if you weight Y take the restructure". An unmapped choice handed to the user is work in progress, not a result.
- Check every option against recorded rulings first, since an option a ruling closes is withdrawn rather than offered, and reopening one takes new evidence.
- A question the user cannot answer from what is written is unfinished work, not a question.

The issue behind a question waits for the answer. Every other issue moves.

## Closing a run

The database and its directory belong to one run. A later run does not read them; its agents treat the past report as testimony.

- Every issue leaves through one exit: a check-in with its regression test, red before the fix and green after; a comment or assert at the site, for code that looks like a bug but is not and for an invariant no test can reach; a ruling or a one-line baseline in the owning feature doc, for a decision and for a measurement no later run could re-derive once the events expire; a todo, for a probe nobody can run yet; or an explicit drop by the user.
- Closing is part of a check-in: record the changeset on the row in the same touch, record every departure from the marked shape, and fix or accept each Nit with its reason.
- Two consecutive passes with nothing new is saturation for this input. Say so in the report; it does not erase open questions or missing external evidence.
