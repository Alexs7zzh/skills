# Workflow trials

Coordinator-only. Trial agents must not read this file or `tests/`.

## Staging

Copy `SKILL.md`, `GOAL.md`, `owners.md`, `pilot.md`, `answer.md`, `audit.md`, `judge.md`, `merge.md`, `contracts.md`, `catalog.json` and `scripts/` to a staging directory, and copy `evals/fixture/` to a separate directory as the target. Run the staged script, so packets point agents at the staged instructions. Give answerers and judges only their packet, never the expected outcomes below.

Record for each trial: the skill revision, the model per role, every agent's check failures before its pass, and the comparison with the expected outcomes. A slot failure that the check caught is an instruction-following result. Record it apart from a content miss.

## Fixture: a small order service

Expected answers an answerer must reach:

- `src/orders.ts:7`: a POST that changes remote state (XC1 yes) without a dedupe key (XC2 no), repeated by a hand-written loop (XC5 yes, XC7 yes) with no deadline (XC4 no).
- `src/orders.ts:19`: a read with a caller's abort signal and no visible caller timer (XC4 unknown). A signal alone is not a deadline.
- `src/handler.ts:23`: a DELETE per id in an unbounded `Promise.all` over a listing (fan-out FO2, FO3 and FO4 yes).
- `src/config.ts:2`: a secret (CF1 yes) that reaches a log (CF6 yes).
- `src/handler.ts:15`: a catch that returns 200 with an empty body (EH1 yes, EH2 no).
- Four casts on external JSON (DB1 yes, DB2 no, DB3 yes).
- `src/receipts.ts:1`: the same `node:fs/promises` specifier also imported at `src/handler.ts:4` (IM2 yes), with no lint rule (IM3 no).
- `test/orders.test.ts:5`: a patched global `fetch` (TD2 yes).
- `src/inventory.ts:10` and `src/restock.ts:9`: two writers of the same stock row (SW1 yes), each read-modify-write (SW2 yes) without a condition (SW3 no).
- `src/ledger.ts:6`: an insert paired with a Slack post (SW5 yes) that nothing records for later delivery (SW6 no).
- `src/restock.ts:6`: a scheduled entry that `template.yaml` retries twice (EP6 yes), with no dedupe record (EP7 no).
- `DATABASE_URL` read in `src/inventory.ts`, `src/ledger.ts` and `src/restock.ts` (CF5 yes at each).
- `src/errors.ts:1` and `:10`: two error classes with the same fields (ED5 yes), untagged (ED1 no).
- `src/orders.ts:20` and `src/orderStatus.ts:6`: the same order shape decoded twice (DB4 yes at both).
- `@planetscale/database` imported directly in three files (IM2 yes at each, with positive hints to confirm).

Expected verdicts from a judge:

- `defect` for XC-unsafe-replay, CF-secret-leak, LG-sensitive, EH-silent-swallow and DB-unchecked-cast.
- `primitive` remedy for an external-operation wrapper, with duplicate remedies consolidated for at least two of XC-no-deadline, XC-untyped-failure and XC-unrecorded.
- XC-ignores-retry-after stays unresolved, because the provider's documentation is not in the repository. It must receive `unresolved` until the deciding facts are corrected and remapped.
- `defect` for SW-lost-update at both stock writers, and for EP-duplicate-delivery at the restock entry. The duplicate delivery also repeats the Slack post, so it relates to SW-unrecorded-effect.
- An improvement/defect with a `primitive` or `local` remedy, for each of: the outbox or effect ledger (SW-unrecorded-effect), the config module (CF-scattered), the database adapter with its import rule (IM-scattered-client), the error family (ED-duplicate-shape, where `fine` is right if the judge shows the purposes differ) and the shared order schema (DB-repeated-shape).

Known weak spots to watch:

- Questions about other files. Haiku searched for the wrong string or did not search, in both directions. IM2, CF5 and DB4 now have positive hints that answerers must confirm; the remaining search questions carry a required `searched` field. Read it when an answer looks wrong.
- Questions about provider behavior outside the repository. Ask what the code does with the provider's response instead.

## Maintenance regressions

Run `python3 tests/test_sweep.py`. Supplied answer/verdict rows test script mechanics, not agent accuracy. The suite covers all answer-state combinations; unknown eligibility; explicit n/a and the unused-response exception; named-type search misses; hint confirmation and alias corrections; source/config/bundle freshness; exact site rulings; audit sampling, regeneration and stale confirmations; refutation/remapping; merge priority and decisions; finite deadlines; separate cache capacity/freshness; bounded judge groups; inspection records; boundary-primitive exceptions; v3 declarations; tsgo location comparison and absent tooling.

Use `evals/contracts-fixture/` with kinds `external-call,entry-point` for the small boundary-contract trial. Include: an unknown deployment retry policy; a caller-only abort signal; a sibling with a visible finite timer; an intentional public read; and an unused foreign response. Expect unknowns to remain visible, the finite timer to count, explicit public auth to count without inventing a protected resource, and only the catalog's explicit no-input/unused-or-opaque-response exceptions to allow unconditional n/a. Do not show these outcomes to workers.

## 2026-10-13 maintenance result

Failing case: the prior static review reproduced unknown prerequisites disappearing, stale inputs remaining consumable, and defect severity lost during merges. Expected: unresolved work remains visible, changed inputs invalidate results, and merged remedies retain findings. No failed live skill invocation was supplied; load status for those original cases is unknown. Sibling checks found alias corrections, audit regeneration, same-group covered_by, and unexported declaration paths with the same failure classes.

Owning layers: helper record validation, state transitions and rule mapping; catalog criteria; worker handoffs. Strengthened those constraints, replaced the exclusive verdict token with finding/remedy/decision, removed covered_by, and added the targeted audit and conditional contract resource. The fresh reviewer returned correction, audit, applicability and API findings; all were repaired with deterministic regression coverage.

Checks: `python3 skills/backend-primitives/tests/test_sweep.py` passed 22 tests, including original defects, unseen siblings, near negatives and a complete supplied-record fixture workflow. `scripts/check-skills.sh` passed all nine skills. Real backend, installed tsgo execution, production TypeScript/lint execution and the earlier Haiku/Opus model matrix remain deferred. The tsgo comparison test uses supplied diagnostics; Effect API tests use fixture declarations.

Fresh-context trial: one answerer, one auditor, two judges and one consolidator, all using the session's default model (the tool did not report an exact model id). Five sites in `contracts-fixture/`; staged bundle `e66317909ead0526a7532a085c22eeeb83ad823e592be1df35d04047770b505c`.

- Answerer: check passed after creating the missing answers directory. Six intended deadline, applicability and explicit-public-auth observations matched. Two unsupported read-only negatives were later caught by the auditor.
- Auditor: first check correctly failed for those two withheld confirmations. Coordinator changed them to unknown, including dependent questions. Regenerated audits passed on the two remaining eligible negatives; this was all eligible negatives in this small fixture, not a discovery-completeness claim.
- External judge: check passed after creating the missing verdict directory. Refuted two response-schema negatives: text was returned intact and consumers were absent. Reconcile archived coverage/verdicts; answers, audit, map and both judge checks then passed. Final external findings: 12 unresolved and four improvements.
- Entry judge: the checker rejected fine on unknown delivery facts. The corrected unresolved row passed. This conservative result, even for the constant health handler's no-effects counter-condition, needs calibration on the real backend; it is not a supported defect.
- Consolidator: first check passed. Merged the notification deadline into entry-owned deadline propagation while preserving both decisions; kept proposals separate where the retained proposal did not fulfill every obligation. Final report: 26 groups, with unknowns retained.

The trial exposed no-input and opaque-response applicability gaps. Explicit catalog exceptions now handle them; missing consumers still mean unknown. Setup commands now create worker output directories. These narrow follow-ups have deterministic coverage. Captured trial records were replayed through the revised helper before the last question wording refinements: every stage passed. Final wording also makes the runtime-default evidence policy explicit and makes EP3 ask about classification plus exhaustive expected-failure mapping, including unclassified rejections and an exception for entries without expected fallible work. These final wording refinements have not had another fresh-model trial; measure their usefulness on the real backend. Unavailable facts must stay unknown.

## Continuation maintenance result

Failing case: the follow-up review identified rulings tied to whole-run digests, full rejudging after corrections, live edits invalidating input checks, and unchecked hint contradictions in primitive rules. Expected: decisions converge across unchanged facts, independent judgments survive corrections, and all rejected positive hints receive review. These were code-review findings; a failed live invocation and its load status were not supplied.

Failure class and owning layer: helper identity, snapshot, dependency tracking and audit record validation. Strengthened those mechanisms; replaced audit reset with fingerprinted confirmation reuse and prose refutations with checked corrections. Added a three-round correction bound and one shared client-contract assessment. Held reject and defer rulings remain listed; accepted work remains active. Pattern discovery stays explicitly incomplete; AST discovery and additional backend profiles wait for real-codebase evidence.

Checks: 26 deterministic tests cover original cases, sibling dependency changes, unchanged near negatives, and a complete supplied-record workflow. Tests include audit refutation through reconciliation, mandatory primitive hint audits, confirmation reuse, verdict carry-forward, rulings across runs, snapshot integrity, and nested workspace dependency citations. The repository validator passes all nine skills. A fresh read-only reviewer found the nested dependency snapshot omission; it is repaired and regression-tested. No additional model workflow or real-backend run was performed in this continuation, to keep the requested static review bounded. The earlier model trial above remains evidence for its earlier workflow only.

## Historical results

These trials used earlier schemas and catalogs. Their original tokens and observations below are historical, not current expectations.

- 2026-10-13, effect-adoption draft (before the rename). Haiku answerer: every expected fact above was answered as expected; DB4 was a false positive; CF6 and CF7 were answered `unknown` when the repository could settle them. Sonnet auditor: 86 of 90 sampled answers agreed; the check caught two of its `yes` answers without `ev`.
- 2026-10-13, backend-primitives. Haiku answerer, four Opus judges, one Opus consolidator; all passed their checks on the first try except five `refuted` rows written before `note` became required, which their judges fixed when asked.
  - Answerer misses: IM2 answered `no` although `src/handler.ts:4` imports the same module, and XC15 answered `no` instead of `unknown`. Both hid a cluster from every judge, so IM-unenforced-boundary and XC-ignores-retry-after never reached judgment. Nine `unknown` answers, three of them settleable by a search.
  - Judges: every expected `fix` above, plus PG-unbounded, FO-silent-partial and EP-no-deadline. The external-operation `build` covered four clusters. Six answers refuted with evidence (EH3, EP1, CF7, DB5, LG3, TD1). One wrong `leave`: IM-direct-client at `src/handler.ts:4`, reasoned as "no adapter exists", downstream of the IM2 miss.
  - Duplicates across judge groups: `fetchJson` (decode-boundary) restated `shopRequest` (external-call), and LG-sensitive restated CF-secret-leak. The consolidator merged both and three more correct pairs, and kept same-site changes apart.
  - Open: a false `no` from the answerer cannot be recovered by any later stage. Whether a mid-tier answerer model is worth its cost is untested.
- 2026-10-13, backend-primitives on the extended fixture. Trial 2: Haiku answerer formed 10 of 13 expected clusters. IM2 searched for the imported name instead of the specifier, DB4 did not search, XC15 answered about the code when the question asked about the provider, and SW1 looked for deployment config when the other writer was in the code. Repairs: XC15 and SW1 reworded into facts the code shows; IM2, CF5 and DB4 derived by the script; IM1 dropped, because "adapter" could not be stated as a fact.
- Trial 3, same fixture, fresh Haiku answerer on the repaired catalog, then four Opus judges and one Opus consolidator. All 12 expected clusters formed. Every planted primitive received a supported verdict: lost update `fix` (atomic conditional SQL), paired effect `fix` (one transaction) plus `decide` (Slack best effort or outbox), duplicate delivery merged into the conditional-update fix, config module `build`, database adapter with lint rule `build`, shared order schema covered by a `shopJson` `build`, error family `leave` with the evidence that the purposes differ. 43 clusters became 23 actionable lines.

## 2026-10-14 real-run maintenance result

- Failing case: the explicitly loaded skill's backend run inventoried 1,008 sites but incorrectly marked installed Effect APIs unavailable, repeated missing dependency/platform questions, rejected judge corrections at reconciliation, and stopped at the correction cap without a report. Expected: inspect accessible evidence, share conditional guarantees, validate replacements consistently, and always account for current and pending work. The run and its source were inspected read-only.
- Failure class: runtime export targets were not resolved to adjacent declarations; ignored dependency paths were treated as absence; answer/correction checks drifted; correction files stood in for judgment passes; stopping had no checked reporting path. Repeated notes supplied a review signal, not proof of inaccurate answers. Siblings covered .mjs exports, explicitly blocked exports, optional wrapper settings, changed shared facts, interrupted groups, repeated close and resume.
- Owning layer and change: strengthened helper resolution, validation and lifecycle handling. Added checked owner facts with site bindings and a registry for dated primary-source excerpts. Replaced broad-first dispatch with an owner pilot and focused continuation; added missing helper callers before sharding. Conditional follow-ups derive only when their gates are false or unknown. The pilot exposes repetition, corrections and answer-record counts; it does not pretend those counts measure tokens or elapsed time.
- Rule disposition: strengthened existing question criteria and cancellation-source evidence, added a distinct static-credential comparison question, replaced report-from-memory stopping with `close`, and kept finer verdict dependencies deferred. The live pilot exposed a conflicting XC7 definition; the question now consistently covers project retry loops with or without a timer.
- Checks: 38 deterministic tests pass, including complete supplied-record workflows. The original resolver case also passes against the backend's installed Effect 4.0.3: every catalog API resolves. Near negatives reject stale shared bindings, bypass inheritance, changed external excerpts, missing applicable questions, blocked exports and invalid cached verdicts. The validator passes all nine skills. Source `references/` remained unchanged.

Fresh workflow trial: staged bundle `9aa2df289cf9394872703e3da135baf13294566c02e05d2fd3f8a48be8d5fbf3`, four operation sites after owner discovery. Owner and judge used GPT-6.1-Sol after Astra capacity failures; the answerer used GPT-6-Luna. This is a small maintenance trial, not a model ranking or a full backend sweep.

- The owner found both exported helper callers missed by patterns, recorded one owner, four memberships, five conditional facts and four grouped missing claims. Its protections check passed. The direct fetch bypass and `retry:false` call remained distinct from the default retry path.
- The answerer used 13 shared references. Its first check rejected bindings to the wrapper file for caller sites; corrected bindings to those callers passed. Unknown external/runtime evidence stayed unknown. The audit selected zero eligible negatives; its empty branch passed, which supplies no claim about auditor accuracy.
- The judge produced 18 rows and passed the verdict check. It refuted XC7 at two sites because its question required a timer while its yes criterion required only a loop. Pilot assessment recorded 2/4 refuted sites and the repeated claim, chose repair, and closed with three checked groups, 22 pending candidate judgments and two disputed sites. This trial used the earlier XC7 wording; the later wording has the focused checks below.
- A fresh implementation reviewer found repeated-close dispute loss, pre-map cap consumption, loss of rows from interrupted groups, a missing protections pointer and a missing new-rule packet field. Each was fixed and reproduced in regression checks. A subsequent cap-close-resume probe exposed duplicate pending corrections; deduplication now preserves distinct conflicting replacements, and the reviewer confirmed two closes followed by a successful resume clear the disputes.

`question-cases.json` holds stable source scenarios and expected tokens for XC7, EH1/EH2/EH3, PG2 and SW4. When running a trial, supply each scenario with its current catalog question and omit `expected`. On the current wording, fresh Luna and GPT-6.1-Sol contexts each matched all 13 cases, including ordinary exceptions, actual aborts, caller-only signals, finite page deadlines, page-count limits, operation recognition and library-owned retries. These supplied source cases test interpretation, not repository search accuracy. Raw trial artifacts remain at `/tmp/backend-question-trial/` and `/var/folders/07/kf81zwdj60d7zc5_s818t2xh0000gn/T/backend-owners-trial-fz8el6pw/` on the maintenance machine; these paths are evidence locations, not runtime dependencies.

A full new 1,008-site sweep, a cost comparison against the old workflow, external-provider retrieval and the unavailable Astra matrix were not run. Dependency visibility and evidence integrity have executable regressions; backend checks read a fresh snapshot and installed declarations; no target code or tests ran. The final helper fixes were checked by regressions and the fresh reviewer, rather than rerunning the entire staged model workflow.

## Owner-boundary and pilot-repair regressions

Use `owner-boundaries-fixture/` for the owner producer and focused-continuation consumer. Copy it outside the skill before inventory. Give the owner reviewer only its packet. It must discover the HTTP and job receipt/reminder calls and the two helper-to-transport calls. The job loop retries both operations; HTTP does not use that project loop, and the shared helpers have both callers. Missing platform/runtime retry evidence remains unknown. One request timer surrounds the job loop; its signal crosses AsyncLocalStorage and the helper chain; `await scope.run` settles before cleanup. Owner focus must include those contributing entry, crossing and cleanup sites, even across kinds.

For the corrected-pilot trial, supply a checked pilot state with one job operation corrected from XC5 no to yes after its caller loop was found. Label supplied prior answers and judgments synthetic. Omit reusable XC5/XC7 facts so the continuation must account for the shared correction. Expect a current repair record, a conditional shared fact or corrected binding, an affected sibling outside the corrected pilot, and focused selection containing the contributing boundaries. HTTP and mixed helper callers must not inherit a job-only claim without a qualifying binding. A clean pilot needs no repair record. A correction to one explicit `retry:false` override is site-local when the existing shared fact already excludes it; it must not manufacture a new shared claim.

The helper regressions cover the observed optional-audit replacement and an unseen sibling with initially empty sample slots. Refresh neither replaces retired members nor fills unused slots. Explicit expansion, a newly answered batch and new mandatory hint contradictions still work. Other regressions cover unknown/excluded coverage, stale report rejection and remapping with independent verdict reuse, current pilot repair digests, a missing sibling, a no-sibling search, site-local repair and clean expansion.

## 2026-10-14 focused-run maintenance result

- Failing case: a backend session explicitly loaded the skill for a focused Database review and implementation. Refreshing a 30-answer optional audit replaced eight corrected members with eight new members. Pilot corrections did not reliably become reusable caller facts, and owner focus selected 252 external-call sites but none of the 36 inventoried entries. Expected: a bounded optional cohort, an explicit account of shared pilot repairs and contributing-boundary coverage. The session and its records were inspected read-only.
- Failure class: resampling an evolving eligible set silently widens optional work; free-text pilot continuation omits reusable repairs; owner membership alone omits the runners and crossings that supply guarantees. Siblings include initially unused audit slots, a second caller under the same retry loop, mixed HTTP/job helpers, cleanup and explicitly excluded boundaries.
- Owning layer and change: strengthened helper selection, freshness and expansion gates; replaced the existing pilot continuation instruction with a checked repair record and sibling evidence; extended the existing owner record with entry/crossing/cleanup coverage. The helper checks identity and current records; source review still establishes the truth of facts and sibling conclusions.
- Rule disposition: strengthened the existing audit, owner and pilot steps; added conditional `pilot.md` detail and stable fixture cases. No new reviewer role or general architecture policy.
- Checks: 44 deterministic tests passed, including six new regressions. A subsequent validation-order guard passed its strengthened targeted regression. A fresh reviewer confirmed its stale-coverage and missing-resource findings were repaired and found no remaining concrete defect. `scripts/check-skills.sh` passed all nine skills; `git diff --check` passed. Original mechanisms, unseen siblings, near negatives and known-good supplied-record workflows are covered. These supplied rows do not measure model accuracy.

Fresh owner trial: GPT-6-Astra at high effort, bundle `8c49e27a1c8793bc6de7ebbe4f1e13a6f810de1f7164c6ca0ff0881a58a80bfb`. It discovered all six missing helper calls, distinguished the job loop from HTTP and mixed callers, and produced two owners, fourteen conditional facts, entry/crossing/cleanup coverage and three grouped unknowns. Its protections check passed first try. No provider policy was invented from the fixture’s names. Source and owner records feed the separate continuation trial below.

Fresh continuation trial: GPT-6.1-Sol at high effort, bundle `e1621d4ecf0b11e293345b85c519a9840f2c2974224dbdc751125547af870c56`. Prior pilot answers and judgments were explicitly synthetic inputs; the continuation itself inspected source. It added conditional XC5/XC7 job facts, split HTTP/job/mixed caller descriptions and coverage, inspected the unpiloted job reminder and contrasting HTTP receipt, and recorded both shared-fact and binding repairs. No existing shared bindings needed refresh. The final checks passed and `shard --owners O-mail` selected eleven new sites across external calls, entries, error handling, timing and resources, retaining the original pilot and leaving the client-contract site pending. It correctly described clean-pilot and isolated `retry:false` exceptions without manufacturing shared repairs.

The coverage-freshness checker caught a real ordering miss in this trial: after the final coverage split, verdict checking and attempted continuation failed until remapping. Remapping retained fourteen independently supported supplied rows; final protections, answers, audit, map, verdict, pilot-decision and focused-shard checks passed. The audit had zero eligible negatives in this intentionally narrow supplied state; audit sampling behavior is established by deterministic regressions, not auditor accuracy here. A02 remained unanswered as intended for this continuation-stage trial.

The final bundle differs from the continuation trial only by moving coverage validation before map output mutation; its targeted regression and the fresh reviewer checked that guard. Raw trial and review artifacts are under `/var/folders/07/kf81zwdj60d7zc5_s818t2xh0000gn/T/backend-skill-update-p9okuep5/` on the maintenance machine. Those paths are evidence locations, not runtime dependencies. A full new backend sweep, a cost comparison, and fresh answerer/auditor/judge trials were not run: the changed model decisions belong to the owner and coordinator stages. These small passing trials establish exercised behavior, not a causal model-quality comparison.
