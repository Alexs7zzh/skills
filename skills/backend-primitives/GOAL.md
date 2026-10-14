# Goal

Read before discussing or changing this skill.

## Why

A TypeScript backend gets its safety from a few shared primitives at its boundaries. These are where the code meets something outside the process: an entry runner that sets the deadline and maps failures, a config module, one wrapper for external operations that owns timeouts, typed failures and replay policy, a conditional record store, and an outbox for paired effects. When each call site restates these mechanics instead, the copies drift. A change gets retried without a dedupe key, a secret reaches a log, a failure is swallowed as success.

Ask an agent where such a codebase can improve and it returns a list. Ask again and it returns a different list. Each run picks its own sites, its own concepts and its own idea of fit, so the lists never converge and nobody can tell what was checked.

This explicitly invoked skill separates the work:

- A script lists every site its patterns match and reports the discovery limits. Pattern coverage is not whole-backend coverage.
- A strong agent establishes shared owner, library and platform facts with explicit applicability conditions. Sites reference those facts only with evidence that the conditions hold.
- A small pilot checks owners and exceptions before broad dispatch. Cheap agents then fill gaps at the selected sites, with citations.
- The script maps the facts to defects, primitives and Effect concepts by a fixed rule table.
- Strong agents audit every contradiction of a search hint and selected answers that exclude defect candidates. They then judge the remaining clusters. Sampling leaves an explicit unaudited remainder.
- Judges recommend which changes to pursue, explain their behavior and regression risks, and carry unfinished work forward. The user decides unsettled product tradeoffs; those rulings persist across runs.

Effect is the preferred way to build the mechanics: schedules, timeouts, typed errors, schemas, layers. The skill's goal is the primitives, not a count of Effect calls.

## Values

- **Facts before judgment.** An answerer states what the code does, with a citation. It does not decide what the code should do. "Should this retry?" is two facts and a rule: is the failure transient, and is repeating the change safe.
- **Known coverage.** The inventory names every site the run covers, and the check fails on any site left unanswered. A sweep that cannot say what it skipped is the problem this skill exists to fix.
- **Rules live in code.** The rule table maps facts to concepts. Two runs over the same answers produce the same clusters, so a disagreement is about a fact, which can be checked at its citation.
- **Unknown is work.** An answer the code cannot settle is `unknown`, with the missing fact named. A rule that depends on it yields an unresolved candidate, never a silent no. A judge settles it at the source or carries the limit.
- **Every rule has a way out.** Each rule carries the condition under which its remedy does not fit, and the judge checks it at the sites. A finding of `fine` needs evidence.
- **Primitives over sprinkled calls.** When many sites share the same facts, the remedy is one primitive that owns the decision. Pasting the same Effect call into each site is not it. One change that removes several rules' facts covers them, and the report shows it once.
- **Start with shared owners.** The default run prioritizes heavily reused owners, their bypasses and exceptions, together with the entry, crossing and cleanup boundaries that supply their guarantees. An exhaustive sweep is available on request. A focused report accounts for the untouched inventory as pending; narrowing the work never makes that inventory clean.
- **Shared evidence has conditions.** A wrapper name is not a guarantee. Shared facts name the method, options, deployment or caller conditions that make them apply. Provider defaults, deployed settings and client behavior remain distinct. Pilot corrections to a shared claim repair its reusable evidence and caller bindings before expansion. Site-specific corrections stay local. Repeated notes are a review signal, not proof of poor work.
- **Defects first.** Some fact combinations are bugs whatever the library. The report leads with them.
- **Progress with accountable tradeoffs.** A useful primitive may justify a broad change. Risk calls for a concrete migration and verification plan, not automatic deferral. The agent owns engineering recommendations; the user should decide product outcomes without first having to choose technical tasks.
- **No unintended regression is the target.** Intended behavior changes, including API changes, are proposed explicitly. Existing obligations and recovery paths constrain the remedy. A source review identifies risks and the evidence needed to control them; it cannot certify an unimplemented change as regression-free.
- **Measure guarantees, not adoption.** The coverage table counts sites that have each guarantee: a deadline, a dedupe key, a typed failure, a decoded input. It does not count Effect usage. Rewarding Effect usage produces wrapped pure code with no gain.
- **Enforce boundaries in tooling.** Where a fact or rule can hold without agents, it should. Pattern searches supply positive evidence for an answerer to confirm or correct; a miss proves no absence. Examples: a lint rule that confines client imports to their adapter, and tsgo diagnostics that expose missed discovery sites.
- **The installed version is the API truth.** Effect renamed much of its API between v3 and v4, and most published guidance is v3. Concept API names are checked against the installed declarations.
- **Cheap models for facts, strong models for judgment.** The skill recommends model roles; the user decides them. Judges check facts at their citations, and a refuted answer is recorded against its question, so weak questions show up.
- **Rulings are durable; observations expire.** A site ruling follows its source anchor and deciding facts across runs. Unrelated edits do not reopen it. Rejected and deferred work stays listed outside judging; acceptance does not prove implementation. An explicit broad policy is a separate choice.
- **Preserve independent work.** A run reviews a frozen source snapshot. Corrections reopen affected verdicts and their declared dependencies; independently supported verdicts survive. Shared client contracts are assessed once for the run, with distinct contracts named in the evidence.
- **A bounded run still has a result.** Optional audit sampling has a known scope; repairing answers does not silently purchase another sample. Count correction rounds by judgment pass, not files. At a limit or a change in priorities, a checked partial report retains current supported findings and names unresolved and unreviewed work. A cache is never a report.
- **The script stays bounded.** It owns inventory, input integrity, shape checks, rule mapping, counts and rulings. Keep discovery in the standard library until a real target demonstrates a need for a parser.

## Maintenance

The catalog grows by evidence. A question earns its place when its answers change a rule match and judges rarely refute them. A rule earns its place when its candidates produce supported defects or useful improvements on real code. Remove questions no rule reads and rules whose candidates are always fine. Test catalog and script changes with `python3 tests/test_sweep.py`. Expected agent behavior on the fixture is in `evals/workflow.md`, which trial agents must not read.
