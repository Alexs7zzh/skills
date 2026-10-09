## 1. Outcome

Users can see which environment and resources a deployment would affect, spot unwanted changes, and reconsider before anything changes. They can distinguish known changes from effects the CLI cannot predict.

## 2. Verdict on the proposal

**Partly delivers.** A preview is worth building, but “prints what would change” needs a precise contract. It can otherwise create false confidence in the **hidden hooks**, **incomplete inputs**, **large deployment**, and **concurrent change** scenarios below.

The request establishes that deployment applies changes directly. It supplies no incident or user evidence showing which surprises matter most; that need remains **claimed**.

## 3. Proposal

Add `deploy --dry-run` to preview a deployment:

- Use the same planning logic and resolved configuration as deployment.
- Show the resolved target and proposed creates, updates, deletes, and replacements. Make destructive operations prominent.
- Enforce a read-only execution path, including hooks and plugins. If that cannot be guaranteed, stop with an error.
- Identify unknown effects and missing inputs explicitly. An incomplete preview must return a nonzero status.
- Describe the result as a prediction against the state observed during planning. A later deployment may differ.

Start with a smaller slice if necessary: the same read-only planner, target identity, and operation summary for supported resource types. Reject unsupported types explicitly; add detailed property diffs later.

These are **design choices**. Implementation feasibility is **unverified** because no checkout or deployment platform was supplied.

**Pre-mortem risks:** planning accidentally invokes a mutating hook (R1); summaries hide destructive changes (R1); prediction diverges from deployment or becomes stale (R1/R2); unknowns look like a clean result (R2). These appear below.

## 4. Decisions for the user

- **Assumed ordering:** prioritize unintended damage over uncertainty, then review effort. Alternatively, prioritize speed for disposable environments; this favors the smaller summary slice.
- **Snapshot versus stronger assurance:** keep this flag as an honest preview, or separately build reviewed-plan application with drift checks. The latter reduces differences between review and execution but adds workflow and implementation cost.
- **Summary versus detailed diffs:** start smaller for earlier coverage, or include property changes immediately when operation names alone cannot support useful review.
- **Adjacent: recovery after a partially failed deployment.** Leave recovery outside this feature, or pursue it separately; previewing does not provide rollback.

## 5. Idea chain

| Step | Problem it answered | Evidence for that problem | Control it introduced |
|---|---|---|---|
| Current direct deployment | Put requested changes into effect | Current behavior: user request; original rationale unknown | None identified |
| Proposed preview | Discover unwanted changes before applying | Claimed need; no incidents supplied | `--dry-run` — proposed design |

The user’s rulings are to work without a checkout and leave files unchanged.

## 6. Experience ladder

| Rung | What the person experiences | Scenario | Why above the next rung |
|---|---|---|---|
| R1 | Unwanted changes or loss | Wrong target; hidden deletion | Damage exceeds uncertainty — *assumed* |
| R2 | Cannot trust the prediction | Missing state; unknown effects | Uncertainty exceeds review effort — *assumed* |
| R3 | Slow or difficult review | Thousands of changes | Effort exceeds informed review — *assumed* |
| R4 | Understands changes before proceeding | Complete, readable preview | Desired outcome |

## 7. Scenario table

Cells describe plausible outcomes, not verified implementation behavior. **Original** assumes only the stated printing behavior; its unspecified guarantees remain **unverified**.

| Scenario | Do nothing | Original flag | Reshaped design | Smaller slice |
|---|---|---|---|---|
| Common: supported, stable deployment | R1: discover after applying | R4: useful preview | R4: useful preview | R4: operation review |
| Wrong account or environment | R1: wrong target changes | R1: target may be unclear | R4: resolved target visible | R4: resolved target visible |
| Delete or replace among updates | R1: surprise loss | R1: destructive change buried | R4: destructive change prominent | R4: destructive summary |
| Large deployment; consequential change buried | R1: surprise change | R3/R1: output overwhelms | R3: grouped, detailed review | R2: insufficient detail |
| Hidden hooks or plugin writes | R1: effects occur | R1: preview may mutate | R2: stop if isolation unsupported | R2: reject unsupported |
| Missing state or read permissions | R1: changes discovered late | R2/R1: incomplete looks complete | R2: incomplete; error status | R2: incomplete; error status |
| Provider effects known only during apply | R1: unexpected effects | R2/R1: certainty overstated | R2: unknown effects identified | R2: unsupported or unknown |
| Concurrent change after preview | R1: unexpected result | R1: stale prediction trusted | R2: snapshot limitation explicit | R2: snapshot limitation explicit |
| Planner and executor interpret inputs differently | R1: unexpected result | R1: misleading prediction | R2: residual risk; shared logic | R2: same residual risk |

| Option | Contention | Settings cost | Failure contract |
|---|---|---|---|
| Original flag | Reads/output compete; yielding unspecified | Preview versus execute: reviewer versus release automation | Missing inputs, hooks: unspecified |
| Reshaped design | API quotas shared; preview respects limits and stops; output grouped | Same mode choice; detect target/configuration; no new thresholds | Preserve known results; identify unknowns; error on incomplete/unsafe preview |
| Smaller slice | Same quotas; less output; preview yields | Same mode choice; product fixes supported scope | Unsupported resources fail explicitly; supported preview remains readable |

## 8. Measurement

No code or platform API could be inspected. “Direct” below describes a quantity measurable or enforceable at its source; existing support is **unverified**.

| Control | Protects | Real quantity | Classification / divergence | Source |
|---|---|---|---|---|
| `--dry-run` mode | R1 | Deployment mutations during preview | **Direct** through effect enforcement; flag alone is a proxy | Request; proposed contract — *unverified* |
| Printed prediction | R1/R2 | Effects of a future deployment | **Estimated**; drift, provider behavior, missing inputs | Request; scenario reasoning |
| Shared planning logic | R1/R2 | Agreement between planned and executed operations | **Direct** for shared interpretation; future effects still estimated | Proposed contract — *unverified* |
| Read-only boundary; reject unsafe paths | R1 | Mutating calls, hooks, plugin effects | **Direct** where effects are controlled; unsupported paths must stop | Proposed contract — *unverified* |
| Target and destructive-change display | R1/R3 | Resolved target; operation types | **Direct** from resolved plan; human recognition remains uncertain | Proposed contract — *unverified* |
| Unknown markers; incomplete error status | R2 | Missing inputs and unsupported predictions | **Direct** for detected gaps; undetected gaps remain a risk | Proposed contract — *unverified* |
| Snapshot qualification | R1/R2 | State changes after observation | **Estimated**; label cannot prevent concurrent changes | Proposed contract; concurrency scenario |
| Smaller operation summary | R1/R3 | Consequences a reviewer must understand | **Estimated**; consequential property changes may be hidden | Proposed smaller slice |
| Any preview as assurance of safety | R1 | Whether deployment causes business harm | **Unmeasurable** from a plan alone; depends on user intent and external behavior | General reasoning |