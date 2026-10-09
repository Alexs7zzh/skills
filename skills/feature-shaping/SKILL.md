---
name: feature-shaping
description: "Find the outcome a feature idea serves, test the idea against it, and propose a better shape when one exists."
disable-model-invocation: true
---

# Feature shaping

Input: a feature idea, a proposed change, or an issue. Output: one chat report that says what the idea is for, where it misses, and how to shape it. The report is the only output; code, issues and docs stay unchanged.

## 1. Gather the idea and its history

Read the request. If it names an issue, read it with its parents, predecessors, linked issues and rulings under the project's tracker rules. Read code only to answer a named factual question the proposal needs: a Measurement cell, a Contention cell, a failure contract, or evidence an issue cites.

Write the **idea chain**: one row per earlier design that led to the proposal, and one for the proposal itself.

| Step | Problem it answered | Evidence for that problem | Control it introduced |
| --- | --- | --- | --- |

A **control** is a value, mode or rule a design sets to stand for what it wants: a count, a timeout, a cap, a sort order, a flag. Every row names its controls, or "none" for the starting state.

Evidence is a measurement, a crash report or a user report, with its source. A problem stated without one is *claimed*. A claimed problem alone cannot keep a control; it becomes a measurement to take or a decision for the user.

Mark each constraint by commitment, whoever said it: a *ruling* the user has settled, or a *proposal* still open, including the user's own "maybe five". A proposal may be changed by the steps below; a ruling may not. When a later step overturns the premise behind a ruling, mark it *overturned* for the Decisions section.

## 2. Dig to the outcome

For each row of the idea chain, ask: what does a person notice if this is absent? Make the answer the next question. Keep digging past a control name. Stop when the answer names what a person sees, feels, waits for, loses or pays, or a hard limit such as a crash, lost data, a platform rule or a cost.

Write the **experience ladder**: every distinct outcome the digging surfaced, ordered worst first. Each rung has a scenario in which a user meets it and a reason it sits above its neighbor (losing typed input is worse than a slow save because the work must be redone). Where the evidence does not fix an order, rank it yourself and mark the rung *assumed*.

A rung is **adjacent** when the proposal would not change whether a user meets it. A scenario in which the person does not use the proposal at all (skips the flag, leaves the setting off) is not a failure of the proposal; the need it exposes is adjacent. Adjacent rungs stay off the ladder and out of the design; each gets one line in Decisions.

## 3. Find the proxies

For every control in the idea chain and in the proposal:

- Name the rung it protects.
- Build a **divergence case**: a realistic situation where the control is satisfied and the rung still fails, or the control is exceeded while the rung is fine. Vary input size and shape, the environment the product runs in, the platform, concurrent users of the same resource, and stale or missing inputs.
- If a divergence case exists, the control is a **proxy**. Name the real quantity it stands in for.

Each control then carries two separate fields. **Stands for**: the real quantity it is a proxy for, or "itself" when no divergence case exists. **Measured**: how the product can observe or enforce that real quantity: **direct** (measured where it happens), **estimated** (through a stand-in, listing its divergence cases) or **unmeasurable** (best effort, with the reason). A control can be measured directly and still be a proxy; dwell time is measured exactly and stands for interest. Search for code that already measures, records or enforces the real quantity (a counter, a sampler, a log field, a validator, a limit) before assuming none. When the codebase is silent, check the platform API, with a web lookup if needed. A stand-in is acceptable only when the real quantity cannot be measured at acceptable cost. Record the source: file, API or page.

## 4. Walk the scenarios

Draft the options: the original proposal, **do nothing**, a **reshaped design** when a scenario row fails the original, built on direct quantities where step 3 found them, and a **smaller slice** when part of the proposal alone protects the top rungs.

Build the **scenario table**. One row per divergence case, per ladder rung's scenario, and for the common case. One column per option. Each cell is the rung the person lands on, in a few words.

For each option that adds a mechanism, also record:

- **Contention**, if the option uses a shared resource (memory, screen space, a rate limit, a lock): what else uses it, and who yields when it runs short.
- **Settings cost.** Every value the design leaves to the user. A fact the system can read (hardware, account, configuration) gets detected. A setting earns its place only when two users in the same environment want different values; name those two users. Otherwise the design picks the value.
- **Failure contract.** When an input the mechanism depends on is missing or wrong, or the limit is exceeded anyway, what still works and which rung results.

## 5. Shape the proposal

Keep what the original gets right. Change only what fails a scenario row. The reshaped design serves ladder rungs only. Write it in the form the original used, such as an issue's change, rulings and completion sections, so the user can paste it. A constant you chose without evidence (a percentage, a count, a duration) is a *placeholder*; mark it so and say what measurement would set it.

Pre-mortem it: the reshaped design shipped and failed badly. List the causes, each with the rung it hits. Add each cause as a scenario row or a named risk.

## 6. Report

Required sections, in this order:

1. **Outcome.** One or two sentences on what the person gets, written as what they see, feel, wait for or lose.
2. **Verdict on the proposal.** Delivers, partly delivers or misses, with the failing scenario rows named.
3. **Proposal.** The reshaped design in the original's form, or "keep as is" with the rows that support it. Pre-mortem risks follow it.
4. **Decisions for the user.** Only choices: *assumed* rung orderings, tradeoffs, *overturned* rulings and adjacent rungs, each with its options and what changes between them. A fact you could not check is marked *unverified* where it is used, not here.
5. **Idea chain.** The table from step 1.
6. **Experience ladder.** The ladder from step 2.
7. **Scenario table.** With contention, settings cost and failure contract per option.
8. **Measurement.** The two fields from step 3 for every control: the rung it protects, what it stands for, how the real quantity is measured, source.

Sections 1 to 4 stay under 400 words when the chain has no predecessor designs, only the starting state and the proposal, and under 800 otherwise. Sections 5 to 8 are tables with cells of a few words; a table that would have one row is stated in the Verdict instead. Before sending: every ladder rung appears in a scenario row, every control has a Measurement line, every *assumed* and *overturned* mark and every adjacent rung has a Decisions entry, and the Outcome contains no control name.
