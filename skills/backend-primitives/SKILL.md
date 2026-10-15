---
name: backend-primitives
description: "Sweep a TypeScript backend's boundary code for defects, for shared primitives worth building, and for Effect concepts to adopt, using shared evidence and fixed questions at selected sites."
disable-model-invocation: true
---

# Backend primitives

Find the target repository, any narrowed paths or kinds, a custom rulings file and any model choices in the request. Run the assessment below before changing target code. A review-only request ends with recommendations. When the request includes adjustments or fixes, continue from the checked report into implementation under the project's coding workflow; that request already authorizes the work.

## Terms

Each term has one meaning in every file of this skill.

- **Site**: one place in the source that a kind's pattern matched, with an id such as `S0012`. The `client-contract` kind is one shared assessment per run; its anchor locates an entry point, and its answer covers every named client contract.
- **Kind**: a class of boundary site in `catalog.json`, such as `external-call` or `import`. Each kind has its questions.
- **Answer**: one token for one question at one site: `yes`, `no`, `unknown` or `n/a`, with its citation. answer.md owns the rules. Pattern searches supply positive hints. Answerers confirm or correct them; a search miss supplies no answer.
- **Shared fact**: a sourced answer owned by a project wrapper, library or platform contract, with conditions and exceptions. A site needs a checked binding to inherit it.
- **Rule**: a catalog entry that maps a combination of answers to a concept. Its lane is `defect`, `primitive` or `adopt`.
- **Concept**: the remedy a rule points at, either a project primitive or an Effect API.
- **Cluster**: one rule's matching sites, with an id such as `C03`. A site whose deciding answer is `unknown` is unresolved.
- **Verdict**: a record with a finding, a remedy and a separate decision flag. judge.md owns their criteria.
- **Ruling**: the user's accept, reject or defer on a verdict, kept in the run's rulings file.
- **Run directory**: scratch for one sweep, outside the target repository. `inventory` creates it and prints its path.
- **Script**: `scripts/sweep.py`. `python3 scripts/sweep.py --help` lists its commands. Each command's last line names the next step.

## Roles and models

| Role | Count | Reads | Recommended model |
| --- | --- | --- | --- |
| Coordinator | you | this file, script output and final report.json | the session model |
| Owner reviewer | one before shards | owners.md, its packet, source and registered evidence | the strongest model available |
| Answerer | one per answer shard | answer.md, its packet, the source | the cheapest model available |
| Auditor | one per audit packet | audit.md, its packet, the source | the strongest model available |
| Judge | one per judge group | judge.md, its packet, the source | the strongest model available |
| Consolidator | one | merge.md, its packet | the strongest model available |

Use the user's model and effort choice for each role. When the user named none, use the recommendation and list it among the premises in the reply. If the harness cannot run a requested model, use the closest one it offers and list the substitution. Every agent is fresh. Answerers see questions, never rules, so a fact is not shaded by the remedy it would select.

## Rules for every step

- During assessment, workers write only the output their packet names and run this skill's checks. The coordinator runs the stage commands, which own run artifacts and authorized rulings. Nobody runs target code or tests during assessment; the coordinator may run installed tsgo diagnostics through `boundary`. Only the coordinator may retrieve primary documentation for a named missing platform contract, then register a short excerpt with `evidence`, its URL and retrieval date. Workers cite that immutable run evidence. Source reads and searches are allowed.
- Give each worker the skill directory and packet, without expected findings. Queue workers within available agent capacity. Return check failures to their owner.
- When an agent's file fails its check, that agent fixes it before the next step starts.
- Stop for the user at the cost gate or when a user-owned choice blocks further authorized work. A request to focus or finish closes the current assessment through `close`.

## 1. Set up

1. Run `python3 scripts/sweep.py inventory <root>`. Add `--kinds` or `--paths` when the request narrows scope. It prints the run directory, the revision and the site count per kind. If it reports no matches, report that result with the discovery limits and stop; it is not a clean-backend verdict.
2. Read `<run>/discovery.md`. Its pattern limits apply even when no sites match. Run `api` and `boundary`. The first resolves Effect names against installed declarations; the second compares installed tsgo diagnostics with discovery. Missing tools remain unmeasured.
3. Run `owners`. Give its packet to one fresh owner reviewer following [owners.md](owners.md). Import requested provider evidence with `evidence`; use `add-sites` for discovered callers and contributing boundaries before sharding. Owner coverage names the entry, crossing and cleanup sites that supply each guarantee, or their sourced exclusions. Finish when `check --stage protections` passes.
4. Run `pilot` to select a small sample across heavily used owners, bypasses and kinds. Complete steps 2–4 below for those shards before expanding. After checked judgments, run `pilot --assess`. Inspect repeated claims at their citations and the corrected-site count. Use record counts and available worker usage to assess cost; missing token or timing data stays unmeasured. Repetition alone is not failure. When any pilot site was corrected, follow [pilot.md](pilot.md) to account for site-local repairs, changed shared facts and caller bindings before expansion.
5. Record the pilot's decision with `pilot --assess --decision focus|expand|repair --reason <evidence>`. Default to `focus`: use `shard --owners <ids>` for owners and their contributing boundaries, or `--sites <ids>` for an explicitly selected set. Use unscoped `shard` for a requested exhaustive sweep. It appends only unassigned sites. A `repair` decision blocks expansion until reassessed.
6. Before dispatching an expanded batch, apply the cost gate. If its shard count exceeds the user's limit, or 30 when none was set, ask for a narrower scope. Existing checked work remains usable; narrow the next selection instead of restarting the inventory.

`rule` writes `<run>/rulings.json` and `map` reads it, so rulings end with the run's scratch directory. To carry them into a later run in the same session, pass that file with `--rulings` to the later run's `map` and `rule`. A custom file must be outside the target's tracked tree. When `map` or `rule` notes an old `backend-primitives.rulings.json` at the target root, relay the note to the user. Do not move, merge or delete that file yourself. When `rule` cannot write its file, ask the user to allow writes to the printed path.

Inventory copies source and configuration into `<run>/source`. Workers read that snapshot; live repository edits do not invalidate the run. Snapshot edits or skill bundle changes require a new inventory. Installed libraries are not frozen; judges recheck their cited defaults. Results describe the snapshot, so check live changes before implementing them. Old run formats require a new inventory. Rulings without site identities, from an older format, cannot suppress findings.

## 2. Answer

Queue one answerer per newly selected shard. Each brief is the output of `python3 scripts/sweep.py packet <run> <shard>`. When all have finished, run `python3 scripts/sweep.py check <run> --stage answers`, and return each failing shard's lines to its answerer.

## 3. Audit and map

Run `python3 scripts/sweep.py audit <run>`. It selects every contradiction of a positive hint, across all rule lanes, plus a bounded sample of negatives that exclude defect rules. The optional sample stays fixed while its answered batch is repaired; corrected members consume their original slots. Increase the sample explicitly to inspect more optional answers. A newly answered batch starts a new sample; mandatory hint contradictions are always included. A fresh auditor follows `audit-packet.md` and [audit.md](audit.md). Use `--all` for every eligible answer; `--sample 0` selects only mandatory hint contradictions. Checked confirmations carry forward when their facts match. Run `check --stage audit` even for an empty packet. Report the selected and eligible counts and the unaudited remainder.

For structured audit refutations, run `reconcile --stage audit`. For other corrections, use `facts` to obtain current values and digests, then `correct --file <corrections.jsonl>` with complete replacement answer sets. Check answers, audit and map again. Corrections preserve independently checked verdicts whose declared dependencies remain unchanged. The cap counts distinct mapped judgment passes, not correction files; audit corrections before the first map do not consume mapped judgment passes. At three correction rounds the script writes a checked partial report. Reply from it without launching another round; raise `--max-rounds` only when the user requests continuation.

Run `python3 scripts/sweep.py map <run>`. It prints the guarantee coverage, the clusters and the judge groups. If no active rule matched, use the generated report for coverage, held rulings and untouched sites. For a pilot, assess that clean mapped sample before deciding whether to expand. Rejected and deferred findings with unchanged deciding facts are held outside judging. Accepted work remains active until the source supports its completion. Use `--include-held` only when revisiting those decisions.

## 4. Judge

Queue one judge per group with pending sites. `judges/*.json` lists pending coverage; `carried.jsonl` contains checked verdicts retained from earlier rounds. Groups contain at most 80 unique sites by default; `map --sites-per-judge N` changes that budget. All rules for a site stay together. The same rule can occur in multiple groups. Each brief is the output of `python3 scripts/sweep.py judge-packet <run> <group>`. Then run `python3 scripts/sweep.py check <run> --stage verdicts`, and return failures to their judges.

If judges refute or settle facts, run `reconcile` to apply their corrections. Conflicting corrections require the judges to resolve their cited evidence. Then check answers, repeat the audit and map, and judge only pending sites. Unapplied refutations remain disputed work in a partial report; they cannot become supported findings.

For the pilot, assess and choose the continuation before consolidation. When the chosen work is finished, launch one consolidator with the output of `python3 scripts/sweep.py merge-packet <run>`. It merges duplicate remedies within and across groups while preserving every finding. When it finishes, run `python3 scripts/sweep.py check <run> --stage merges`. On a pass it prints one line per verdict, in reply order, with merged rows folded into the rows that absorb them.

For a correction cap, a changed priority or a requested narrow finish, run `close`, optionally with `--clusters <ids>` or `--owners <ids>`. It remaps current checked answers, retains validated findings, and writes `report.json` and `report.md` with pending candidates, disputed answers and untouched inventory. These findings are not consolidated. Never construct a report from a reuse cache or memory.

## 5. Recommend and continue

Read `<run>/report.json`; it preserves all findings, consequences and decisions under merged changes. Reply in this order:

For up to 15 supported groups, keep the main reply within 600 words unless the user requests the full detail. Use one short row per change, summarizing its main risk and decisive check; keep test matrices and source detail in the linked report. Group unresolved facts by missing evidence and put coverage limits in one short paragraph.

1. The recommended work and why it is worth doing, leading with established defects. Label a focused or capped assessment partial. Explain each proposed behavior change in terms of an affected caller or operator.
2. A compact account of each supported change: benefit, intended before/after behavior, regression mechanism, planned verification and recommended action. Use the judge's records; give row ids as references, not as questions the user must decode. Combine duplicate remedies while retaining each member's risks and obligations.
3. Only unsettled user-owned choices, with feasible alternatives, their consequences and a recommendation. Separate them from engineering work already authorized.
4. Held and dropped proposals with their reasons and next steps where required. Distinguish agent recommendations from explicit user rulings. On self-review, revisit the evidence for these dispositions; risk, breadth or lack of urgency alone does not settle them. Keep prior proposals accounted for when recommendations change.
5. Unresolved facts and missing evidence; counts of inventoried, answered and pending sites and findings; discovery and audit limits; contributing-boundary coverage and exclusions. Link the detailed report and coverage artifacts. Say that absent tooling is unmeasured, not zero violations.
6. Model and scope premises and the run directory.

If improvements exceed 15 groups, show the 15 with the greatest supported consequence or shared guarantee and link report.json for the rest. Keep all defects, user-owned choices and unresolved facts visible. Omitted rows retain their actions in the report.

Record explicit user rulings with `rule --decision <token> --verdicts <ids> --reason <text>`. Agent recommendations are not user rulings. A ruling includes merged members. Add `--scope <glob>` only for an explicitly requested broad policy. Exact rulings bind the source anchor, rule and deciding answers. Unrelated edits do not reopen them; changed deciding facts do. List counts of held reject and defer rulings, with report.json for their details. Accepted work stays visible until evidence shows it implemented. A ruling never counts as proof that a guarantee holds.

For authorized implementation, carry every supported proposal and its action into the coding workflow. Recheck the live source, implement pursued changes and run their verification. Work held for an accessible engineering check starts with that check. Develop recoverable candidates for unsettled tradeoffs when useful; present the concrete result before asking the user to choose. A correction cap ends assessment, not independently supported implementation. Disputed or unknown findings remain pending. Close with implemented changes, observed checks, remaining risks, and an explicit disposition for each unimplemented proposal. Planned verification is never a passing result.

## Maintaining this skill

Read [GOAL.md](GOAL.md) first. Run `python3 tests/test_sweep.py` after changing the catalog or the script. For a workflow trial with agents, read [evals/workflow.md](evals/workflow.md) as coordinator.
