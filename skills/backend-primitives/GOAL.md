# Goal

Read before discussing or changing this skill.

## Why

A TypeScript backend gets its safety from a few shared primitives at its boundaries. These are where the code meets something outside the process: an entry runner that sets the deadline and maps failures, a config module, one wrapper for external operations that owns timeouts, typed failures and replay policy, a conditional record store, and an outbox for paired effects. When each call site restates these mechanics instead, the copies drift. A change gets retried without a dedupe key, a secret reaches a log, a failure is swallowed as success.

Ask an agent where such a codebase can improve and it returns a list. Ask again and it returns a different list. Each run picks its own sites, its own concepts and its own idea of fit, so the lists never converge and nobody can tell what was checked.

This explicitly invoked skill separates the work:

- A script lists every boundary site.
- Cheap agents state facts about each site, with citations.
- The script maps the facts to defects, primitives and Effect concepts by a fixed rule table.
- Strong agents judge only the clusters the rules produce.
- The user rules on the verdicts, and the rulings persist across runs.

Effect is the preferred way to build the mechanics: schedules, timeouts, typed errors, schemas, layers. The skill's goal is the primitives, not a count of Effect calls.

## Values

- **Facts before judgment.** An answerer states what the code does, with a citation. It does not decide what the code should do. "Should this retry?" is two facts and a rule: is the failure transient, and is repeating the change safe.
- **Known coverage.** The inventory names every site the run covers, and the check fails on any site left unanswered. A sweep that cannot say what it skipped is the problem this skill exists to fix.
- **Rules live in code.** The rule table maps facts to concepts. Two runs over the same answers produce the same clusters, so a disagreement is about a fact, which can be checked at its citation.
- **Unknown is work.** An answer the code cannot settle is `unknown`, with the missing fact named. A rule that depends on it yields an unresolved candidate, never a silent no. A judge settles it at the source or carries the limit.
- **Every rule has a way out.** Each rule carries the condition under which its remedy does not fit, and the judge checks it at the sites. `leave` is a verdict with evidence, not an omission.
- **Primitives over sprinkled calls.** When many sites share the same facts, the remedy is one primitive that owns the decision. Pasting the same Effect call into each site is not it. One change that removes several rules' facts covers them, and the report shows it once.
- **Defects first.** Some fact combinations are bugs whatever the library. The report leads with them.
- **Measure guarantees, not adoption.** The coverage table counts sites that have each guarantee: a deadline, a dedupe key, a typed failure, a decoded input. It does not count Effect usage. Rewarding Effect usage produces wrapped pure code with no gain.
- **Enforce boundaries in tooling.** Where a fact or rule can hold without agents, it should. A question a search settles exactly is answered by the script, because cheap models search for the wrong string. Examples: a lint rule that confines client imports to their adapter, and tsgo's counts of unwrapped boundary uses.
- **The installed version is the API truth.** Effect renamed much of its API between v3 and v4, and most published guidance is v3. Concept API names are checked against the installed declarations.
- **Cheap models for facts, strong models for judgment.** The skill recommends model roles; the user decides them. Judges check facts at their citations, and a refuted answer is recorded against its question, so weak questions show up.
- **Rulings are durable; runs are not.** The run directory is scratch. The rulings file is the small record a later run reads.
- **The script stays small.** It holds only what agents cannot do reliably: the complete inventory, the shape checks, the rule mapping, the counts and the rulings. Everything else stays in the instructions.

## Maintenance

The catalog grows by evidence. A question earns its place when its answers change a rule match and judges rarely refute them. A rule earns its place when its candidates receive fix, build, adopt or local verdicts on real code. Remove questions no rule reads and rules whose candidates judges always leave. Test catalog and script changes with `python3 tests/test_sweep.py`. Expected agent behavior on the fixture is in `evals/workflow.md`, which trial agents must not read.
