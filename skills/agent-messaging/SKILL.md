---
name: agent-messaging
description: "Use when writing a message another agent will act on: a prompt, brief, dispatch, or handoff to a subagent, a peer, or a session on another machine; delegating a task, a check, or a fix; replying to an agent's question; or relaying a ruling to one."
---

# Agent messaging

The receiver is an agent with the codebase, its tools, and its own skills. It reads once and acts. Write the brief, and leave the method to it.

## Shape

A message that hands over work carries these slots, in this order, and nothing else. A slot you cannot fill is a reason to wait, not to pad. A reply to a question is the answer alone; a ruling is one line naming its option.

- **Goal.** What is true when the receiver is done, and what bothers us now that makes it worth doing. One or two sentences.
- **Acceptance.** The check that shows it, stated so the receiver can run it and read the answer: a test that fails before and passes after, a log line that appears, a command's exit. "Understood" and "verified" are not checks.
- **Facts.** What you know that the receiver cannot find in seconds: the claim and its site as file:line, the changeset, what was tried and what it showed, and each fact's certainty. Mark belief as belief: "the code is believed correct at step 3" lets the receiver treat a failing check as a question about the check before a bug in the code.
- **Constraints.** Rulings by their option label, the workspace and target, what must not change, who checks in.
- **Report.** Where the answer goes and its shape: a ledger command, a file path, a one-line message. Ask for the result, not a narrative.

## Rules

- **Facts over method.** No step lists, no commands to paste, no scripts, no directory layouts, no backup or restore recipes. A receiver that meets a failing script fixes the script. Name a command or a value only when the receiver could not discover it: a clamp in the engine, a flag with no help text, a project convention that contradicts the default.
- **Nothing the receiver can find in seconds.** File contents, `--help` output, and repository layout are the receiver's to read.
- **One screen.** Past that, the extra lines are method or narrative. Cut them, not words from them.
- **One message, one job.** A question from the receiver gets the answer, never the brief again.
- **A message is not a change.** It is never countersigned, versioned, reviewed for wording, or tested. The whole review is one read for a false premise: a fact the receiver would act on that is wrong. The receiver's result is the test.
- **Never write what the receiver will write itself:** its plan, its evidence layout, its retries, its restore steps.
- **A reminder is one clause.** "Update the docs too" is fine. Expanding it into which docs and what to write is method, and the receiver knows the docs better once it has done the work.

## Example

A check that must run on another machine:

```
Goal: confirm that engine cs:206 reports the measured hang age, not the configured threshold, on a Win64 MEsServer Development build.
Acceptance: a forced GameThread stall of ~7 s yields a hang report whose message carries measured age and effective threshold, and EngineData carries both keys until the report completes; a Sentry event for the run shows the measured value.
Facts: ThreadHeartBeat.cpp:548-552 clamps any configured threshold below 5 s up to 5 s, so use a threshold of 5 s or more. `debug stall <seconds>` (UnrealEngine.cpp:11679) sleeps the GameThread and returns; `debug softlock` never returns. The checkpoint path publishes into its Warning and traps before OnHang, so its report has no ErrorMessage. The code is believed correct at step 3 from a static walk; the local Mac editor compiles the production checkers out, so nothing here has run.
Constraints: engine cs:206 or later; Development, not Editor; change no engine header; check in nothing.
Report: the log paths and the Sentry event id in one message; if the check fails, say whether the check or the code is wrong before fixing either.
```
