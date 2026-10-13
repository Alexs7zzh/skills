# Workflow trials

Coordinator-only. Trial agents must not read this file or `tests/`.

## Staging

Copy `SKILL.md`, `GOAL.md`, `answer.md`, `audit.md`, `judge.md`, `merge.md`, `contracts.md`, `catalog.json` and `scripts/` to a staging directory, and copy `evals/fixture/` to a separate directory as the target. Run the staged script, so packets point agents at the staged instructions. Give answerers and judges only their packet, never the expected outcomes below.

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
