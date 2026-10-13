---
name: backend-primitives
description: "Sweep a TypeScript backend's boundary code for defects, for shared primitives worth building, and for Effect concepts to adopt, using fixed questions per site."
disable-model-invocation: true
---

# Backend primitives

Find the target repository, any narrowed paths or kinds, the rulings file and any model choices in the request. Run every step below in order. Implement nothing. Accepted verdicts become code changes only when the user asks for them, under the project's coding workflow.

## Terms

Each term has one meaning in every file of this skill.

- **Site**: one place in the source that a kind's pattern matched, with an id such as `S0012`.
- **Kind**: a class of boundary site in `catalog.json`, such as `external-call` or `import`. Each kind has its questions.
- **Answer**: one token for one question at one site: `yes`, `no`, `unknown` or `n/a`, with its citation. answer.md owns the rules. Questions a repository search settles exactly, such as which files import a module, the script answers itself.
- **Rule**: a catalog entry that maps a combination of answers to a concept. Its lane is `defect`, `primitive` or `adopt`.
- **Concept**: the remedy a rule points at, either a project primitive or an Effect API.
- **Cluster**: one rule's matching sites, with an id such as `C03`. A site whose deciding answer is `unknown` is unresolved.
- **Verdict**: a judge's decision for sites of a cluster. judge.md owns the tokens and their criteria.
- **Ruling**: the user's accept, reject or defer on a verdict, kept in the rulings file.
- **Run directory**: scratch for one sweep, outside the target repository. `inventory` creates it and prints its path.
- **Script**: `scripts/sweep.py`. `python3 scripts/sweep.py --help` lists its commands. Each command's last line names the next step.

## Roles and models

| Role | Count | Reads | Recommended model |
| --- | --- | --- | --- |
| Coordinator | you | this file and the script's output | the session model |
| Answerer | one per answer shard | answer.md, its packet, the source | the cheapest model available |
| Judge | one per judge group | judge.md, its packet, the source | the strongest model available |
| Consolidator | one | merge.md, its packet | the strongest model available |

Use the user's model and effort choice for each role. When the user named none, use the recommendation and list it among the premises in the reply. If the harness cannot run a requested model, use the closest one it offers and list the substitution. Every agent is fresh. Answerers see questions, never rules, so a fact is not shaded by the remedy it would select.

## Rules for every step

- No agent writes anything except the one file its brief names. No agent builds the target, runs its code or tests, or uses the network. Reading and searching the source are expected. The only script any agent runs is this skill's script.
- Give each agent the skill directory's path and its packet. Add nothing else: no diagnosis, no expected findings.
- When an agent's file fails its check, that agent fixes it before the next step starts.
- Stop for the user only at the cost gate in step 1 and for rulings in step 5.

## 1. Set up

1. Run `python3 scripts/sweep.py inventory <root>`. Add `--kinds` or `--paths` when the request narrows scope. It prints the run directory, the revision and the site count per kind. If it reports nothing to sweep, tell the user and stop.
2. Run the `api`, `boundary` and `shard` commands in the order the script names them. `api` checks the catalog's Effect names against the installed package; when Effect is not installed, names stay unverified. `boundary` counts unwrapped boundary uses with @effect/tsgo, when the project has it.
3. Cost gate. If the shard count exceeds the user's limit, or exceeds 30 when the user set none, report the counts per kind and ask the user to narrow scope. Then run `inventory` again with `--kinds` or `--paths`; it creates a new run directory.

The rulings file is the path the user names, else `backend-primitives.rulings.json` at the repository root. The script uses that default when you pass no `--rulings`.

## 2. Answer

Launch one answerer per shard, all at once. Each brief is the output of `python3 scripts/sweep.py packet <run> <shard>`. When all have finished, run `python3 scripts/sweep.py check <run> --stage answers`, and return each failing shard's lines to its answerer.

## 3. Map

Run `python3 scripts/sweep.py map <run>`. It prints the guarantee coverage, the clusters and the judge groups. If no rule matched, report the coverage and stop.

## 4. Judge

Launch one judge per group, all at once. Each brief is the output of `python3 scripts/sweep.py judge-packet <run> <group>`. Then run `python3 scripts/sweep.py check <run> --stage verdicts`, and return failures to their judges.

Then launch one consolidator with the output of `python3 scripts/sweep.py merge-packet <run>`. It merges the same change proposed by different groups. When it finishes, run `python3 scripts/sweep.py check <run> --stage merges`. On a pass it prints one line per verdict, in reply order, with merged rows folded into the rows that absorb them.

## 5. Reply and rule

Reply in this order:

1. One line of counts: sites, clusters, and verdicts by token.
2. Every `fix` line, with its consequence.
3. Every `decide` line, with its question and recommendation.
4. `build`, `adopt` and `local` lines as a checklist. Write each with the rules it covers and the rows it merges.
5. The guarantee coverage table from `<run>/coverage.md`, and the boundary table from `<run>/boundary.md` when it exists.
6. The premises taken: model roles and scope narrowing. Then the run directory.

When more than 15 lines fall under steps 3 and 4 of the reply, show the 15 with the most sites and say where the rest are listed. Ask the user to rule by verdict id: accept, reject or defer, with a reason. Record each ruling with `python3 scripts/sweep.py rule <run> --decision <token> --verdicts <ids> --reason <text>`, adding `--scope <glob>` only when the user widens a ruling beyond the verdict's files. The rulings file is the one file in the repository this skill writes.

## Maintaining this skill

Read [GOAL.md](GOAL.md) first. Run `python3 tests/test_sweep.py` after changing the catalog or the script. For a workflow trial with agents, read [evals/workflow.md](evals/workflow.md) as coordinator.
