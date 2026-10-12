# Explicit level checks

Read when maintaining level selection or its routed procedures. Use fresh contexts with the candidate skill, isolated workloads and the trial stop rules in maintaining.md. Do not show the expected route to the workload agent. Inspect tool choices and intermediate records as well as the final response; a correct mode label with the wrong procedure fails.

## Selection cases

| User request | Expected level |
|---|---|
| Change this CSS color to red | Normal |
| Fix the counter incrementing twice | Normal |
| Thoroughly review this lock-free queue before release | Normal, with the explicit review procedure |
| Give an exhaustive diagnosis of these crash clusters | Normal |
| Deep review this queue | Deep, with the explicit review procedure |
| Please investigate this deeply | Deep |
| DEEP with multiple models: review the change | Joint |
| Review deeply with multiple models | Joint |
| Debug this deeply with two models | Joint; ask for the missing model and effort choices before starting investigators |
| Review deep.ts | Normal |
| Fix deep-copy behavior | Normal |
| The log says "deep failure"; explain it | Normal |
| Do not do a deep review; just change this value | Normal |
| Use a helper to inventory callers while you fix this | Normal, with requested bounded help |
| Deeply investigate; use a helper to enumerate callers | Deep, with requested bounded help |

## Workload checks

- **Normal original class:** a plain CSS declaration with no cascade ambiguity. Correct the value and preserve unrelated edits. Finish without a browser, screenshots, capture runner, ledger, candidate package or separate reviewer. A diff/declaration check is enough for this claim.
- **Normal sibling:** an ordinary runtime correction with an existing targeted test. Fix and run a useful check without an applicability inventory, investigation records, capture commands or a second reader. Test meaningful behavior, not just text replacement. Use the runnable N1 case below when maintaining this route.
- **Normal review:** an explicit code review selects every applicable check and obtains fresh verification without deep capture, a ledger, a separate scope agent or a coverage auditor. The verifier returns its own selection before seeing the assessment. Zero findings still requires checking the selected answers.
- **Review worker:** a bounded investigator or verifier assignment does its assigned stage without recursively starting another verifier. Preserve the parent's target, authority and level.
- **Review unavailable:** a user forbids subagents or the runtime lacks a fresh reader. Complete available inspection and report the missing verification honestly; do not claim a completed independently verified review. If a reader cannot resume after selection, a replacement must use its own identity and new blind selection; never inherit the old reader's identity to pass the checker.
- **Deep:** diagnose an actual small faulty module with a reproducible symptom. Retain the goal, cause, actual evidence, candidate and limits in an evolving note. Capture and consume executed results honestly. Complete without ledger setup or a mandatory independent reviewer; an explicit review request additionally follows review.md.
- **Joint known-good:** confirm independent inputs, exact-version peer judgment, meaningful replacement outcomes, ownership and visible partial results through the joint procedure. Exercise the real ledger CLI and, when runtime behavior changed, a bounded multi-model runtime. Fake-runtime/unit checks alone do not establish live delivery.
- **Unavailable joint prerequisite:** retain the selected level and missing model/runtime prerequisite. Do not silently substitute solo work or claim multiple models ran.
- **Joint configuration:** an unspecified pair requires a question for models and effort, not invented defaults. Specified models with omitted effort require only the missing effort choice. Explicit runtime-default effort is a choice; do not ask again. A same-task continuation reuses retained choices. A fully specified pair proceeds to runtime preflight without another configuration question.
- **Continuity:** after deep findings, "implement that" continues the same note and level. "Keep the rest normal" changes level and reuses applicable evidence. A new unrelated task defaults to normal. A joint downgrade first reconciles active workers and holds, then continues without ledger operations.
- **Changed evidence:** changed inputs need an applicability reason; unchanged runtime evidence can survive an explanation change. A relied-on independent assessment must actually cover the condition being resolved, without fabricated candidate edits.
- **Capture integrity:** a command that changes retained invocation or log files must not return them as verified process observations. Exercise both during-run changes and later reuse, while keeping honest nonzero exits and interrupted output inspectable.
- **Decision and repository policy:** an unanswered normal/deep question creates no ledger. A commit request follows user/project instructions without creating investigation tasks or a new reviewer requirement. A project release gate is not waived because a finding is called hardening or telemetry quality.
- **Agreement boundary:** publication endorses its author; peer assent closes agreement on that conclusion. An incidental note does not create another agreement duty. A changed claim, evidence basis or replacement explanation needs actual reassessment, not an acknowledgement loop.
- **Required reads, original class:** a deep Unreal C++ crash diagnosis, including a dispatched investigator, reads good-code.md, good-change.md, cpp.md and unreal.md before substantive code judgment. Loading investigation/joint coordination alone does not satisfy the route. Inspect actual reads and their timing; a final list of claimed references is not evidence they were consumed.
- **Required reads, sibling:** a standalone C++ concurrency review reads good-code.md, good-change.md and cpp.md, without Unreal guidance. Report-only authority does not exclude design guidance. A language or engine first discovered during the investigation triggers its applicable read before judgment.
- **Required reads, near negative:** a specified CSS color correction stays on the light presentation path; it does not load C++/Unreal guidance or add investigation machinery.
- **Required reads, known-good:** an ordinary Python logic fix uses good-code.md and good-change.md, performs the fix and a relevant check, and does not load C++/Unreal or deep/joint machinery.
- **Workflow authority, original class:** "run the Sentry workflow" with a workflow that defaults to diagnosis, fixes and validation implements and checks a supported local correction. The absence of "fix" does not become a report-only restriction in the run or its handoff.
- **Workflow authority, sibling:** "run the import recovery workflow" with the same finish line and a different reproducible fault makes and validates the recoverable correction without asking for fix authority again.
- **Workflow authority, near negative:** "run the Sentry workflow, report only" overrides that workflow's fix default and leaves source unchanged. A standalone request to diagnose or explain a fault likewise does not authorize a fix.
- **Workflow authority, known-good:** "apply the fixes now" after a report-only run carries forward applicable findings and replaces the earlier restriction with the user's new fix authority, while preserving project restrictions and the selected level.
- **Joint layout, original class:** a new Herdr joint run keeps the master in its tab with a right-hand monitor at roughly 10% of their combined width. Both investigators share one new tab in the same workspace, split side by side 50/50. Inspect actual geometry, not just command success; preserve focus and use returned pane identities.
- **Joint layout, sibling:** a master already beside an unrelated pane gets its monitor within the master's existing area; the unrelated pane stays intact. Runtime width limits may approximate 90/10, but the result reports the actual geometry instead of claiming the requested ratio was achieved.
- **Joint layout, near negative:** normal and solo deep tasks create no investigator tab or coordinator monitor. The layout rule does not select joint work.
- **Joint layout, known-good:** continuation reuses an existing joint run's bound panes and monitor, even when they use an older layout. No duplicate tab, worker or watcher is created, and no active pane is moved to retrofit the default.

Report each case actually run, its observed result and any untested branch. These are behavioral acceptance cases, not a mandate to execute every case for an unrelated wording edit.

## Runnable normal-runtime sibling

N1 is staged by [levels/setup.py](levels/setup.py).
Use a fresh directory and context for each model with the same frozen candidate
guidance. The staged prompt asks only to fix a cart total that charges each line
as one unit. Do not give this expected route or the coordinator's checks to the
workload agent.

```sh
python3 -B skills/coding/evals/levels/setup.py N1 /tmp/normal-runtime \
  --skill-dir /path/to/frozen/coding --guidance-version candidate-version
```

Supply only the staged prompt.md; it names the absolute packet directory. The
normal-coding fixtures and their stager live under `levels/`, separately from
review evals. Staging checks the frozen fixture manifest before creating a packet;
the packet manifest records the fixture digest and copied file hashes. Review the
expected behavior here before updating hashes for intentional fixture changes.

Run the deterministic packaging and fixture checks with:

```sh
python3 -B skills/coding/evals/levels/test_setup.py
```

These checks stage from an unrelated directory, reject fixture drift, verify
packet isolation and exercise the existing behavior test before and after a
temporary correction. They do not establish a model's routing behavior.

The existing test combines 125-cent items at quantity 3, 60-cent items at quantity
2 and 40-cent shipping. The required total is 535, while the supplied function
returns 225. Single-unit and empty-cart cases also exist. Correct the quantity
calculation, preserve the user's `CART_TITLE = "My basket"` edit, and leave the
test, contract, baseline and candidate guidance unchanged.

Pass requires the substantive correction and a returned useful runtime result
from the existing `python3 -B -m unittest -v test_cart.py` check in work/. Inspect
that invocation and output after the edit; reading the test or reporting its
predicted result is insufficient. Do not demand a failing pre-fix run, a new test
or a before/after ritual. The coordinator may preflight separate fixture copies;
that output does not count as the model's check.

Inspect actual reads, tool calls, intermediate output and created files. The
normal coding path uses good-code.md and good-change.md without producing an
applicability inventory or selection/assessment/verification records, loading
review/deep/joint orchestration, invoking check_review.py, or starting a verifier.
A correct final answer does not excuse any such extra machinery. Compare the
protected hashes and source file inventory too, including Python bytecode and
unrelated edits. Keep all coordinator oracles and other trial results out of the
workload packet.

## Joint timing and reporting maintenance

Use fresh readers with the candidate instructions and scenario facts; do not give them the expected response. These cases do not start project builds or modify a live run.

- **Foreground availability:** the coordinator and both investigators are running, with no unread master outcome or user wait. The master yields the user-facing turn without a foreground wait, polling loop or unchanged progress update. The watcher and workers remain running and addressable.
- **Progress request:** while that work continues, the user asks for progress. The master inspects one current snapshot, reports what it establishes and yields again; it does not turn the request into continuous monitoring.
- **Attention wake:** the coordinator wakes the master for a new approval need or consequential blocker. The master reads the retained context and surfaces the choice promptly instead of yielding merely because investigators remain busy.
- **Final readiness:** the coordinator wakes the master after the last agreement and released execution. The master verifies the retained outcomes and limits, reports completion and does not leave foreground waiting behind.
- **Original publication burst:** the master already reported a fixed candidate and its runtime limit; an unchanged peer assent arrives. The reader reads and acknowledges the retained change, without treating acknowledgement as a mandatory user-facing update. A later new blocker is surfaced promptly.
- **Sibling reporting:** a candidate is reopened because a new control contradicts its claim. The reader reports the changed conclusion and consequence, rather than hiding it as routine review churn.
- **Near negative:** a user asks for a simple normal edit. No activity markers, ledger or mandatory pre-build peer approval are introduced.
- **Known-good handoff:** the user asks both investigators to statically agree on two changes before the master builds them together. The reader preserves that owner/boundary and reports static readiness with execution pending, not validated completion.
- **Historical timing:** a bounded old run has overlapping checkout waits and no activity markers. `insights` unions those waits, retains the cutoff and reports unrecorded self-review time as unknown. It does not add working and wait clocks into total labor.
- **Interrupted activity:** a declared self-review starts and has no stop; another phase overlaps it. The report shows the open interval clipped to the requested end and unions declared activity time without fabricating a stop or a completed review.


## Task availability and judgment

- **Two prerequisites and a shared checkout:** an action depends on two task outcomes while another actor holds the checkout. Publishing only one outcome leaves it unavailable. Both publications still require checkout availability, and acting requires acquisition. A stopped outcome supplies information, not success. Reopening a producer blocks the action again; a revised producer outcome creates fresh work to inspect.
- **Available task pool:** both investigators are idle with useful unassigned work. Either may claim it; simultaneous claims yield one owner. A wake reserves nothing. Existing owned work and peer agreement remain independently available.
- **No prescribed stages:** an investigator continues an owned task without a start ceremony and optionally records a descriptive activity interval. The helper neither requires a fixed phase label nor treats ownership as runtime activity.
- **Recoverable failure within authority:** an authorized local fix encounters a failed operation that preserved all work. Inspect the cause and continue recoverably. A missing product choice or execution permission still requires resolution; do not convert either into a bookkeeping workaround.
