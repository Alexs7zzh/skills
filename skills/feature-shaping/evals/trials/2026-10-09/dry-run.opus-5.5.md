# Feature shaping: `--dry-run` for the deploy CLI

Basis: the request alone. There was no checkout, issue, or incident data, so every claim about how the CLI works inside is *unverified*.

## 1. Outcome

Before a deploy changes anything, the person deploying sees what will actually change, with anything that destroys data called out first. What gets applied is exactly what they saw. They stop losing data or taking outages from surprise changes, and stop checking the live system by hand before each deploy.

## 2. Verdict on the proposal

**Partly delivers.** An opt-in `--dry-run` helps a careful operator in the common case (row 1), and it gives reviewers output to read (row 9). It misses in these cases:
- the operator skips it (row 2);
- target state changes between the preview and the apply (rows 4, 9);
- the preview runs on a separate simulation path from the apply (row 5);
- a destructive line is buried in a long diff (row 6).

It also creates a new failure: secrets printed into CI logs (row 7). The problem it answers is *claimed*. No incident or rollback evidence came with the request (Decision 1).

## 3. Proposal

**Change.** Split deploy into plan, then apply, on one code path.
- Every `deploy` first computes a plan using the same planner the apply executes. It prints a summary: counts by action (create, update, replace, delete), with destructive actions (delete, or replacement of stateful resources) listed first, then the detail. Sensitive values are masked.
- `deploy --dry-run` prints that plan and exits without applying.
- If the plan has destructive actions, applying needs explicit confirmation, and the prompt names the affected resources. Non-destructive plans apply after printing.
- Non-interactive runs (no TTY) follow Decision 2.
- Stage 2, only if Decision 3 calls for it: `deploy --dry-run --out <file>` saves the plan, and `deploy --plan <file>` applies exactly that plan. It refuses if the target changed after the plan was computed.

**Rulings.** `--dry-run` never writes to the target and never takes the deploy write lock. The preview must not be a separate simulation.

**Completion.**
- A rename that forces delete-and-recreate of a stateful resource is shown as destructive and does not apply without confirmation.
- On a test target, the actions in a dry run match the actions of the apply that follows.
- A known secret field never appears in output.
- Stage 2: a saved plan is refused after another deploy changed the target.

**Pre-mortem risks.**
- Operators confirm by reflex. Hits rung 1.
- The planner labels a replacement as an update. Hits rung 1; the completion test covers it.
- Noisy diffs (field ordering, defaults) train people to skip the output. Hits rungs 1 and 3.
- The no-TTY change breaks existing scripts, or people add `--yes` everywhere. Hits rung 4, or the protection is lost.
- A mandatory plan blocks deploys when reading state fails during an incident. The outage on rung 3 lasts longer. *Unverified* whether apply already reads state.
- A secret in a field nobody marked sensitive gets printed. Hits rung 2.
- Frequent dry runs in CI use up API quota that real deploys share. Hits rung 4.

## 4. Decisions for the user

1. **Evidence.** The problem is claimed. Count recent rollbacks or incidents where a deploy did something unexpected. If there are none, do nothing, or ship only `--dry-run` on the shared planner. If there are some, ship stage 1.
2. **No-TTY runs with destructive changes.** (a) Keep applying without confirmation: nothing breaks, but CI is unprotected (row 8). (b) Refuse unless `--yes` or a saved plan is given: CI is protected, but existing scripts break once.
3. **Stage 2 saved plans.** Needed only if deploys run from CI after a reviewed preview. Without them, the reviewed preview and the applied change can differ (rows 4, 9).
4. **What needs confirmation.** (a) Destructive changes only: less fatigue, but a harmful non-destructive change is caught only if someone reads the output (row 11). (b) Every change: catches row 11, but more fatigue means more reflexive yes answers.
5. **Assumed ordering.** Secret exposure ranks above an outage. Swap them if your secrets are short-lived and rotated automatically.
6. **Adjacent rungs.** How fast a bad deploy can be rolled back, how long a deploy takes, and an audit of who deployed what. The proposal changes none of these. Say if any should be in scope.

## 5. Idea chain

| Step | Problem it answered | Evidence for that problem | Control it introduced |
| --- | --- | --- | --- |
| 0. Deploy applies directly | none (starting state) | none | none |
| 1. Proposal: `--dry-run` prints changes, applies nothing | Operator can't see a deploy's effect beforehand | *claimed*, no source | `--dry-run` flag (opt-in mode); printed change list. User's proposal under review, not a ruling |

## 6. Experience ladder

| Rung | Outcome | Scenario | Why above the next |
| --- | --- | --- | --- |
| 1 | Data lost for good | Renaming a database in config makes deploy delete and recreate it | Lost data can't be recovered; a leaked secret can be rotated |
| 2 (*assumed*) | Secret exposed | Dry run in CI prints a DB password into org-readable build logs | Exposure is permanent and silent until rotated; an outage is visible and ends at rollback |
| 3 | Customers see an outage | An unnoticed config change drops a load-balancer rule | Customers pay, not just the team |
| 4 | Operator or reviewer checks the live target by hand, or delays the deploy | Pre-deploy manual inspection; PR review sees config text, not its effect on drifted state | Lowest: costs time, not data or uptime |

## 7. Scenario table

Options: **Orig** = opt-in `--dry-run`. **None** = do nothing. **Slice** = proposal stage 1. **Reshaped** = stages 1 and 2.

| # | Scenario | Orig | None | Slice | Reshaped |
| --- | --- | --- | --- | --- | --- |
| 1 | Common case: small expected change | Sees it; no rung | Rung 4 | No rung | No rung |
| 2 | Hotfix, preview skipped, change deletes a resource | Rung 1 | Rung 1 | Confirmation catches it | Caught |
| 3 | Rename forces DB delete and recreate | Caught only if run and read | Rung 1 | Flagged, blocked | Flagged, blocked |
| 4 | Another deploy or drift between preview and apply | Preview wrong; rung 1 or 3 | Rung 1 or 3 | Seconds-long window | Stale plan refused; rung 4 |
| 5 | Preview simulated apart from apply | False confidence; rung 1 or 3 | Rung 1 or 3 | Same planner; matches | Matches |
| 6 | 300-line diff, one delete inside | Likely missed; rung 1 | Rung 1 | Listed first, confirmed | Same |
| 7 | CI log of preview contains a secret | Rung 2 unless masked | Not exposed | Masked | Masked |
| 8 | CI deploy, no TTY, destructive change | Rung 1 (applies unconfirmed, as today) | Rung 1 | Rung 1 or refused (Decision 2) | Refused without approved plan |
| 9 | Reviewer approves preview; CI applies later | May differ; rung 1 or 3 | Rung 4 | Same as Orig | Exact plan applied |
| 10 | State read fails during an incident | Dry run fails; apply unchanged | Unchanged | Deploy blocked; rung 3 longer (*unverified*) | Same |
| 11 | Harmful non-destructive config change | Visible if run and read | Rung 3 | Shown, no prompt; depends on reading | Same |
| 12 | Value known only at apply (image digest) | Shown "known at apply" | n/a | Same | Same; plan pins the rest |

| Option | Contention | Settings cost | Failure contract |
| --- | --- | --- | --- |
| Orig | Reads target state; shares API quota with real deploys. Must not take the deploy lock; the preview yields | Flag is a per-run mode; no stored setting | State read fails: dry run errors, apply unaffected. Wrong preview: nothing stops the apply |
| None | none | none | Today's behavior |
| Slice | Every apply now reads state first: more API calls and longer deploys (*unverified*) | TTY is detected, not set. `--yes` serves automation attached to a TTY | No plan, no apply (fails closed, names the failed read). A misclassified destructive change reaches rung 1 |
| Reshaped | As Slice, plus storing the plan file | Plan path is per run | Stale, missing, or corrupt plan: refused. Target has no version: re-plan and compare (estimated) |

## 8. Measurement

| Control | Rung | Stands in for | Class | Source |
| --- | --- | --- | --- | --- |
| `--dry-run` opt-in flag | 1, 3 | Operator saw and accepted the exact change before it applied | Estimated (rows 2, 4, 5, 6) | Request. Direct alternative: plan inside every apply, as Terraform's plan/apply does |
| Printed change list | 1, 3 | Operator noticed the destructive changes | Estimated (row 6) | Request |
| Action classification (delete/replace) | 1 | Change is irreversible | Direct if the planner knows the action type (*unverified*) | General pattern: Terraform plan actions |
| Destructive confirmation | 1 | Consent to an irreversible change | Direct at apply; diverges on reflexive yes | Proposal |
| Same-planner rule | 1, 3 | Preview equals applied actions | Direct by construction | kubectl client vs server dry run is the known divergence |
| Staleness check | 1, 3 | Target unchanged since plan | Direct if target exposes a version or serial, else estimated by re-plan (*unverified*) | Terraform rejects stale saved plans |
| Secret masking | 2 | No secret value reaches output | Estimated: misses unmarked fields | Proposal (*unverified* that sensitive fields are typed) |
| TTY detection | 1 (row 8) | A human is present to confirm | Estimated: unattended TTY, CI pseudo-TTY | Platform `isatty` |
| `--yes` / plan file | 1 (row 8) | Approval of this specific change | Plan file direct; `--yes` estimated (approves anything) | Proposal |
