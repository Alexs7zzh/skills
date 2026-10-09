# Feature shaping: `--dry-run` for the deploy CLI

No codebase was available. Everything below comes from the request and general knowledge of deploy tooling. Claims about how the CLI works are marked *unverified*.

## 1. Outcome

Before anything changes, the person deploying sees what will change, above all anything that destroys data or takes the service down. What they see matches what then happens, without leaked secrets or manual checking.

## 2. Verdict on the proposal

**Partly delivers.** The common case works only if the preview uses apply's own planning code. That is *unverified*: if the CLI runs imperative steps, "what would change" shrinks to a step list. The flag as stated fails these rows: separate simulator, buried delete, drift before apply, unreadable state, migration hooks, secrets in logs, CI review. Yes, build it, with these requirements:

## 3. Proposal

**Change.** `deploy --dry-run` computes the change set with the planning code `deploy` applies with, prints it, and writes nothing.

**Requirements.**
1. `deploy` executes only the plan it computed. `--dry-run` prints that plan.
2. The output starts with counts per action. Deletes and replacements come first and are marked. Values computed at apply time show as "known after apply".
3. If reading live state fails, exit nonzero. Never print "no changes" in that case.
4. Hooks and migrations are listed, not run.
5. Mask sensitive values.
6. Exit codes: 0 no changes, 2 changes, 1 error. `--output json`.
7. *(D2)* `--plan-out FILE` saves the plan with a fingerprint of the planned resources. `deploy --plan FILE` applies exactly that plan, or refuses if those resources have changed.

**Completion.** Per action type, dry-run output equals what apply executes. Tests cover read failure, skipped hook, masked secret.

**Pre-mortem.**
- Preview and apply code drift apart. Hits R1/R2.
- An error reads as "no changes". Hits R2.
- Dry-run runs a migration. Hits R1.
- People skim long output. Hits R1.
- The fingerprint churns, so people bypass the plan. Hits R4.
- Secrets reach CI logs. Hits R3.

## 4. Decisions for the user

- **D1 (adjacent): operators who skip the preview.** Keep it opt-in, or have interactive `deploy` ask for confirmation when the plan deletes or replaces something.
- **D2 (tradeoff): plan binding now or later.** Without it, a teammate's deploy between preview and apply goes unnoticed. With it, there is more code and a churn risk. Measure: overlapping deploys in deploy logs.
- **D3 (*assumed*): leak ranks below outage.** This only matters when choosing what to cut.
- **D4 (adjacent): rollback and partial apply failure.** The preview does not affect either.

## 5. Idea chain

| Step | Problem it answered | Evidence for that problem | Control it introduced |
| --- | --- | --- | --- |
| Starting state: deploy applies directly | none | none | none |
| Proposal: `--dry-run` prints changes and applies nothing | Operators cannot see what a deploy will change before it happens | *Claimed*: no incident, outage or user report cited | `--dry-run` mode (design choice, open to question per the request); printed change list |

The reshaped design adds these controls: one plan path, destructive-first summary, read-success gate, hook exclusion, masking, exit code, plan fingerprint.

## 6. Experience ladder

| Rung | Outcome | Scenario | Why above the next |
| --- | --- | --- | --- |
| R1 | Irreversible data loss | A config rename makes the tool replace a database or volume | A rollback cannot bring the data back |
| R2 | Users see an outage | Wrong version or target goes live, and the service errors until rollback | It hits end users, not just the team |
| R3 | Credentials exposed (*assumed* below R2) | The preview prints secret values into CI logs | Forces rotation and a breach review, but users are unaffected until misuse |
| R4 | Operator or reviewer time and worry | Someone inspects live state by hand, delays deploys, or approves a PR blind | Costs time only |

## 7. Scenario table

| Scenario | Original | Do nothing | Smaller slice (reqs 1-6) | Reshaped (1-7) |
| --- | --- | --- | --- | --- |
| Common: small change, preview then deploy | Avoids R1/R2 | R4, or R2 | Avoids R1/R2 | Avoids R1/R2 |
| Rename replaces database (R1) | Shown if spotted | R1 | Flagged at top | Flagged at top |
| Preview is a separate simulator; server defaults differ | R1/R2, falsely safe | R1/R2 | Same path; "known after apply" | Same, plus unplanned actions refused |
| 300 changes, one delete buried | R1 likely | R1 | Delete listed first | Delete listed first |
| Teammate deploys between preview and apply | R2/R1 | R2/R1 | R2/R1 | Refused; re-preview: R4 |
| Live state unreadable (expired creds) | May say "no changes": R2 | R2 | Error: R4 | Error: R4 |
| Deploy runs migration hooks | Runs them: R1, or hides them: R2 | R1 | Listed, not run: R4 | Listed, not run: R4 |
| Diff contains secrets, CI log (R3) | R3 | none | Masked | Masked |
| Reviewer wants effect in PR (R4) | R4, runs it locally | R4 | JSON + exit code | Plan artifact reviewed and applied |
| Unmanaged fields churn the fingerprint | n/a | n/a | n/a | Applies refused: R4, bypass risk |

| Option | Contention | Settings cost | Failure contract |
| --- | --- | --- | --- |
| Original | Provider read API rate limit, shared with deploys | none | Undefined: may print "no changes" on error |
| Slice | Read rate limit. Must not take the deploy state lock, or it blocks deploys | `--output json`: a CI job parsing the result and a person reading the same CI log want different formats | Read failure exits 1. Unknown values are marked. Hooks are listed, not run |
| Reshaped | As slice. Plan file vs live state: the deploy yields and the person re-previews | As slice. No fingerprint setting; it is scoped to the planned resources | Stale or missing plan: nothing applied, re-plan message |

## 8. Measurement

| Control | Rung | Stands in for | Class | Source |
| --- | --- | --- | --- | --- |
| `--dry-run` mode | R1, R2 | The actions apply will execute | Estimated: drift and server-computed values diverge | CLI planner (*unverified* that it exists) |
| Printed change list | R1, R2 | Operator notices destructive actions | Action type direct. Data loss estimated by stateful resource type. Whether it was read is unmeasurable | Planner action kinds |
| One plan path (req 1) | R1, R2 | Preview equals apply | Direct: apply checks actions against its plan | Planner |
| Destructive-first summary | R1 | Delete or replace present | Direct | Planner action kinds |
| Read-success gate | R2 | Live state actually known | Direct | Provider API error |
| Hook exclusion | R1 | No side effects from preview | Direct for declared hooks. Unmeasurable for side effects inside scripts | Deploy config |
| Masking | R3 | No secret in output | Estimated: misses secrets in untyped fields | Schema sensitivity marks |
| Exit code / JSON | R4 | Changes present, machine-readable | Direct | Planner |
| Plan fingerprint | R1, R2 | Live state unchanged since preview | Direct where the target exposes versions (Kubernetes resourceVersion, cloud ETags, Terraform state serial), otherwise estimated by state hash | Platform APIs (*unverified* for this target) |
