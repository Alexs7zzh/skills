# Judge the clusters

Each cluster is one rule's matches: the sites whose answers meet the rule's facts. Your group holds every cluster of each of its kinds, so one site can appear in several clusters. You decide what each site needs. Answerers established the facts with cheap models, so check each fact at its citation before a verdict rests on it.

## Reading

Read the cited evidence for every site a `fix`, `decide` or `refuted` row covers. For other rows, read at least five sites, or all of them if fewer, including every unresolved site. Settle an unresolved site's missing fact at the source when the repository can settle it.

An API name you propose must exist in the installed package. The packet lists the concept's checked APIs and any that are missing. Look up any other name in `node_modules/effect/dist/<Module>.d.ts` before you write it. When Effect is not installed, the names are unverified; an `adopt` proposal then names the Effect version the packet gives.

## Verdicts

Give each site exactly one verdict. One row may cover many sites. Split a cluster into several rows when its sites need different verdicts. Take the first token whose criterion holds:

1. `refuted`: the source contradicts one of the rule's facts at these sites. Name the question in `fact`, cite what contradicts it, and say what the source shows in `note`.
2. `fix`: at these sites the facts lead to a consequence through a named path, and the counter-condition does not hold. Consequences: an effect applied twice, a lost update, an exposed secret, success reported for work that did not happen, work killed in the middle of a change, a hang past the caller's limit. Any lane can produce a fix.
3. `decide`: the change would alter behavior the user sees or pays for, and the facts cannot settle which way. Examples: a failure a user sees, a latency or retry budget on a request path, cost, data retention, a deployment setting, the choice of library. Give the question and your recommendation.
4. `leave`: the counter-condition holds at these sites; or a project primitive already owns the decision; or another row in this file removes these facts at these sites. Cite the evidence. When another row removes the facts, set `covered_by` to that row's id.
5. `build`: the sites share the facts, and the remedy is one project primitive used at three or more sites in two or more files. If a project wrapper already covers part of it, the proposal extends that wrapper.
6. `adopt`: an Effect API covers it as it stands, and every API it needs exists in the installed version.
7. `local`: a change at these sites that needs neither a new primitive nor an Effect API.

Wrapping pure in-memory code, swapping standard collections for Effect ones, or converting a working loop that exits early earns `leave` with that reason.

## Fields

```json
{"id": "J01-1", "cluster": "C03", "verdict": "fix", "sites": ["S0012", "S0019"], "evidence": ["src/orders/create.ts:40", "node_modules/client/dist/retry.js:12"], "consequence": "a lost response repeats the order: the client retries 5xx three times without a key", "proposal": "send the order id as the provider's idempotency key", "layer": "service"}
```

- `id`: the group id, a dash, and a number.
- `sites`: a list of the cluster's site ids, or `"all"`.
- `evidence`: one or more `path:line` citations you read.
- `fact` and `note`: for `refuted`, the question id whose answer the source contradicts, and what the source shows instead.
- `consequence`: for `fix` and `decide`, what goes wrong and through which path.
- `proposal`: the change. For `build`, give the primitive's name, a one-line signature, the Effect APIs it composes, and the rules it removes. For `adopt` and `local`, name the first site to change.
- `question` and `recommendation`: for `decide`.
- `counter`: for `leave`, the condition or reason that holds.
- `covered_by`: for `leave` only, the id of a `fix`, `build`, `adopt` or `local` row in this file whose change removes this rule's facts at these sites. For example, a wrapper that gives every call a deadline, a typed failure and a span covers the clusters that ask for each of those.
- `layer`: for `fix`, `build`, `adopt` and `local`, where the change starts: `schema`, `error`, `config`, `primitive`, `service`, `entry` or `test`. Work is ordered by layer, so what a later change depends on lands first.
- `limit`: required when a row other than `refuted` covers an unresolved site. Write the fact still missing, or `settled at path:line`. A `fix` row needs every fact settled.

You are done when the check command at the end of the packet passes.
