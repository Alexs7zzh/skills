# Judge the clusters

Your packet contains every matched rule for a bounded set of sites. Other judges may handle more sites of the same kind. Check the cited facts before supporting a defect. For improvements or fine findings, inspect five sites or all if fewer, plus every unresolved site; list the inspected site ids in `inspected` and state the sampling limit in `limit` when others remain. A sample is not evidence that every site's facts were independently checked.

Check shared facts once at their owner, then check each inspected site's binding, options and exceptions. Repeated unsupported claims belong in the pilot assessment; repeated notes alone do not refute a fact. Read the counter-condition before proposing a remedy. If the cited code contradicts a fact, or settles an unknown, record a refutation with corrected answers. The coordinator applies corrections and remaps before you judge the result. Use the packet's `facts` command for complete answer sets and their digests.

For an API proposal, resolve the installed package's exports and type declarations, including the owning workspace package. List the actual proposed `apis` as Module.symbol values. The script checks those symbol names, not signatures or semantics. Missing alternative APIs in a concept are advisory. If Effect is absent or incompatible, use an unresolved finding when API facts are needed, or an improvement with a local or primitive proposal and `decision: true` for conditional adoption. Do not present an unchecked Effect remedy as ready.

For endpoint, authorization, client-error or exception-handling proposals, read [contracts.md](contracts.md). It defines those boundaries and the staged exception-handling migration.

## Finding

Choose one token, using the first matching criterion:

1. `refuted`: source contradicts or settles a deciding fact. Supply corrections, not a remedy.
2. `unresolved`: required facts remain unknown. Name the missing source in `limit`; no supported change yet.
3. `defect`: established facts violate a cited contract through a named path and consequence, after checking the counter-condition.
4. `fine`: the counter-condition holds or an implemented primitive already owns the guarantee. Cite why.
5. `improvement`: a concrete shared guarantee or maintenance task justifies a change without an established defect.

## Remedy and decision

For a defect or improvement choose one remedy:

- `primitive`: one shared owner for the guarantee. Extend an existing owner when available. Convenience helpers require at least three sites in two files. A boundary primitive may start at one site when you name the entry or adapter boundary and the compiler, lint or registration gate future sites must pass.
- `effect`: an installed, compatible Effect API implements the remedy directly.
- `local`: a change to existing code requiring neither a shared primitive nor direct Effect adoption.

Other findings use `none`. Independently set `decision` to true when an unsettled user-owned behavior, cost or library choice is required. A defect can need a decision and a primitive. Reuse explicit user rulings; do not ask for a settled choice again.

Pure in-memory helpers, standard collections and clear early-exit loops need no Effect conversion without a boundary guarantee to gain.

## Records

Each cluster site gets exactly one row. Split rows where outcomes differ.

```json
{"id":"J01-1","cluster":"C001","finding":"defect","remedy":"primitive","decision":false,"sites":["S0012"],"inspected":["S0012"],"evidence":["src/orders.ts:40"],"consequence":"lost responses repeat a charge","proposal":"route charges through chargeOnce","signature":"chargeOnce(input, operationId)","boundary":"payment adapter","enforcement":"restrict provider imports to the payment adapter","layer":"primitive"}
```

- `id`: group id plus dash and number. `sites`: a unique list or `"all"`.
- `evidence`: source citations read. `inspected`: site ids actually inspected, including every site for defects/refutations/unresolved facts.
- `consequence`: required for defects. `proposal` and `layer`: required for defects/improvements. Layer is schema, error, config, primitive, service, entry or test.
- `apis`: required for an Effect remedy; list only the installed APIs the proposal uses.
- `signature` and `enforcement`: required for primitives. `boundary`: required for a primitive below the convenience-helper minimum.
- `question` and `recommendation`: required when `decision` is true.
- `counter`: required for fine. A proposed fix does not make the current site fine. Keep its finding and consequence; the consolidator merges duplicate remedies.
- `limit`: required for unresolved findings and sampled findings. Missing facts cannot become a supported finding by saying they were settled in prose.
- `fact` and `corrections`: required for refuted. `fact` names the rule's deciding question. Each covered site supplies a complete replacement answer set:

```json
{"site":"S0012","before":"<digest from facts>","reason":"the caller supplies a finite deadline","answers":{"XC1":{"a":"no","ev":"src/orders.ts:40"},"XC4":{"a":"yes","ev":"src/handler.ts:10"}}}
```

The abbreviated answers above illustrate the shape; supply every applicable question, including dependent questions whose applicability became true. The shared answer validator derives false or unknown follow-ups and enforces hint refutations at every correction stage. Correct all changed facts together. If several judges correct the same site, their replacement sets must agree before reconciliation.

Run the packet's check. Refutations then go through `reconcile`; they cannot be merged into a final report.

## Continuing after corrections

Judge only the packet's pending sites. Retained verdicts in `carried.jsonl` are read-only. When only part of a cluster is pending, list those site ids explicitly; `sites: "all"` means the entire cluster. Add `depends_on: ["S0012"]` for other inventoried sites whose answers support your verdict. A change to any listed dependency reopens that verdict. Source citations stay bound to the run snapshot.
