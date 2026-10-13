# Workflow trials

Coordinator-only. Trial agents must not read this file or `tests/`.

## Staging

Copy `SKILL.md`, `answer.md`, `judge.md`, `merge.md`, `catalog.json` and `scripts/` to a staging directory, and copy `evals/fixture/` to a separate directory as the target. Run the staged script, so packets point agents at the staged instructions. Give answerers and judges only their packet, never the expected outcomes below.

Record for each trial: the skill revision, the model per role, every agent's check failures before its pass, and the comparison with the expected outcomes. A slot failure that the check caught is an instruction-following result. Record it apart from a content miss.

## Fixture: a small order service

Expected answers an answerer must reach:

- `src/orders.ts:7`: a POST that changes remote state (XC1 yes) without a dedupe key (XC2 no), repeated by a hand-written loop (XC5 yes, XC7 yes) with no deadline (XC4 no).
- `src/orders.ts:19`: a read bounded by a caller's abort signal (XC4 yes).
- `src/handler.ts:23`: a DELETE per id in an unbounded `Promise.all` over a listing (fan-out FO2, FO3 and FO4 yes).
- `src/config.ts:2`: a secret (CF1 yes) that reaches a log (CF6 yes).
- `src/handler.ts:15`: a catch that returns 200 with an empty body (EH1 yes, EH2 no).
- Four casts on external JSON (DB1 yes, DB2 no, DB3 yes).
- `src/receipts.ts:1`: the adapter for `node:fs/promises` (IM1 yes), bypassed by `src/handler.ts:4` (IM2 yes), with no lint rule (IM3 no).
- `test/orders.test.ts:5`: a patched global `fetch` (TD2 yes).
- `src/inventory.ts:10` and `src/restock.ts:9`: two writers of the same stock row (SW1 yes), each read-modify-write (SW2 yes) without a condition (SW3 no).
- `src/ledger.ts:6`: an insert paired with a Slack post (SW5 yes) that nothing records for later delivery (SW6 no).
- `src/restock.ts:6`: a scheduled entry that `template.yaml` retries twice (EP6 yes), with no dedupe record (EP7 no).
- `DATABASE_URL` read in `src/inventory.ts`, `src/ledger.ts` and `src/restock.ts` (CF5 yes at each).
- `src/errors.ts:1` and `:10`: two error classes with the same fields (ED5 yes), untagged (ED1 no).
- `src/orders.ts:20` and `src/orderStatus.ts:6`: the same order shape decoded twice (DB4 yes at both).
- `@planetscale/database` imported directly in three files (IM2 yes at each, derived by the script).

Expected verdicts from a judge:

- `fix` for XC-unsafe-replay, CF-secret-leak, LG-sensitive, EH-silent-swallow and DB-unchecked-cast.
- `build` for an external-operation wrapper, with `covered_by` rows for at least two of XC-no-deadline, XC-untyped-failure and XC-unrecorded.
- XC-ignores-retry-after stays unresolved, because the provider's documentation is not in the repository. It must not receive `fix`.
- `fix` for SW-lost-update at both stock writers, and for EP-duplicate-delivery at the restock entry. The duplicate delivery also repeats the Slack post, so it relates to SW-unrecorded-effect.
- A primitive proposal, `build` or `local`, for each of: the outbox or effect ledger (SW-unrecorded-effect), the config module (CF-scattered), the database adapter with its import rule (IM-scattered-client), the error family (ED-duplicate-shape, where `leave` is right if the judge shows the purposes differ) and the shared order schema (DB-repeated-shape).

Known weak spots to watch:

- Questions about other files. Haiku searched for the wrong string or did not search, in both directions. IM2, CF5 and DB4 are now derived by the script; the remaining search questions carry a required `searched` field. Read it when an answer looks wrong.
- Questions about provider behavior outside the repository. Ask what the code does with the provider's response instead.

## Results

- 2026-10-13, effect-adoption draft (before the rename). Haiku answerer: every expected fact above was answered as expected; DB4 was a false positive; CF6 and CF7 were answered `unknown` when the repository could settle them. Sonnet auditor: 86 of 90 sampled answers agreed; the check caught two of its `yes` answers without `ev`.
- 2026-10-13, backend-primitives. Haiku answerer, four Opus judges, one Opus consolidator; all passed their checks on the first try except five `refuted` rows written before `note` became required, which their judges fixed when asked.
  - Answerer misses: IM2 answered `no` although `src/handler.ts:4` imports the same module, and XC15 answered `no` instead of `unknown`. Both hid a cluster from every judge, so IM-unenforced-boundary and XC-ignores-retry-after never reached judgment. Nine `unknown` answers, three of them settleable by a search.
  - Judges: every expected `fix` above, plus PG-unbounded, FO-silent-partial and EP-no-deadline. The external-operation `build` covered four clusters. Six answers refuted with evidence (EH3, EP1, CF7, DB5, LG3, TD1). One wrong `leave`: IM-direct-client at `src/handler.ts:4`, reasoned as "no adapter exists", downstream of the IM2 miss.
  - Duplicates across judge groups: `fetchJson` (decode-boundary) restated `shopRequest` (external-call), and LG-sensitive restated CF-secret-leak. The consolidator merged both and three more correct pairs, and kept same-site changes apart.
  - Open: a false `no` from the answerer cannot be recovered by any later stage. Whether a mid-tier answerer model is worth its cost is untested.
- 2026-10-13, backend-primitives on the extended fixture. Trial 2: Haiku answerer formed 10 of 13 expected clusters. IM2 searched for the imported name instead of the specifier, DB4 did not search, XC15 answered about the code when the question asked about the provider, and SW1 looked for deployment config when the other writer was in the code. Repairs: XC15 and SW1 reworded into facts the code shows; IM2, CF5 and DB4 derived by the script; IM1 dropped, because "adapter" could not be stated as a fact.
- Trial 3, same fixture, fresh Haiku answerer on the repaired catalog, then four Opus judges and one Opus consolidator. All 12 expected clusters formed. Every planted primitive received a supported verdict: lost update `fix` (atomic conditional SQL), paired effect `fix` (one transaction) plus `decide` (Slack best effort or outbox), duplicate delivery merged into the conditional-update fix, config module `build`, database adapter with lint rule `build`, shared order schema covered by a `shopJson` `build`, error family `leave` with the evidence that the purposes differ. 43 clusters became 23 actionable lines.
