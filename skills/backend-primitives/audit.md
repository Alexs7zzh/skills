# Audit selected answers

Read answer.md and the source snapshot named in the packet. Inspect every pending answer and each hint it contradicts. Search by object identity, including the paths needed to establish absence. The packet includes every hint contradiction and a sample of other negatives that exclude defect rules.

Append one result per pending id to the named output file. Preserve existing confirmations. Copy the fingerprint from the packet:

```json
{"id":"S0012:XC1","fingerprint":"<packet fingerprint>","result":"confirmed","evidence":["src/read.ts:12"],"searched":"operation implementation and callers under src/"}
```

When the answer is wrong, use `result: "refuted"` with evidence and searched, plus a `correction` object. Run `facts` for its current `before` digest. The correction contains `site`, `before`, `reason` and a complete replacement `answers` object following answer.md. Correct dependent answers too. When several audited questions concern one site, use the same complete replacement for each refutation.

Run the packet's check. The coordinator applies refutations with `reconcile --stage audit` before regenerating the packet. Confirmations carry forward only while their fingerprint matches. A pass accounts for the selected answers; unselected negatives and discovery exclusions remain unaudited.
