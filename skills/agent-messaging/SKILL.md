---
name: agent-messaging
description: "Use when writing a message another agent will act on: a prompt, brief, dispatch, or handoff to a subagent, a peer, or a session on another machine; delegating a task, a check, or a fix; replying to an agent's question; or relaying a ruling to one."
---

# Agent messaging

The receiver is an agent like you, with the code, its tools, and its own skills. Ten minutes into the work it knows the constraints better than you do now. Write what only you know, and leave the rest to it.

## What only you know

- **Why.** What bothers you, what better looks like, and what the user asked for. The receiver cannot read this anywhere. Without it, it solves the problem it guesses at.
- **What done looks like.** How you will tell it worked: the test that fails now and passes after, the log line that appears, the report you will read. If no check exists, say what you would look at.
- **Facts you hold that it cannot find in seconds.** The line you found, what you tried and what it showed, the value the engine clamps to, the flag with no help text. Each with how sure you are. Mark a belief as a belief, so a failing check is read as a question about the check before a bug in the code.
- **Constraints from outside the work.** The user's rulings, by name. What must not change. Who checks in. Which machine.
- **Where the answer goes**, and its shape: a database command, a file, one line.

Use the parts that apply. A reply to a question is the answer. A ruling is one line naming the option.

## What to leave to the receiver

Method: which files, which commands, which tables, which steps, in what order. Anything you specify here that you have not verified yourself is a mistake waiting to happen, and anything the receiver would have found on its own is a limit on how well it can do the job. It will read the code, `--help`, and the repo. Name a command or a value only when you checked it and it is not discoverable.

A reminder is different from an instruction. "Update the docs too" names something easy to forget and says nothing about how. That is fine.

Several jobs in one message are fine when they belong together; say which is which. Repeating the brief when the receiver asks a question is not: answer the question.

## Send it

A message is written once and read once. Read it one time for a fact the receiver would act on that is wrong, then send it. Do not version it, review its wording, or check it with another agent. The receiver's result is the test of the message.

## Examples

Handing over a build, where the motivation carries the work:

```
Goal: after a run, a fresh agent can see from the run directory alone where each agent's time went, what each was working on and when, and what was argued on each row, without reading any session log. Today that means reading four multi-megabyte logs in two formats, and it took a whole session last time.
Done when: a read-only command over a finished run prints per-agent working, waiting, and blocked time, and per-row state changes with who and when, and the numbers agree with what the database shows.
Facts: the database is the only shared, time-aligned record; Herdr keeps live state and no history. One-second timestamps are too coarse for parallel agents. A run has a few hundred actions, so replaying history is cheap. This may not need full event sourcing.
Constraints: the minimal change that meets the acceptance, no new dependency for this alone, nothing that slows the commands agents run during a run. Remember to update the docs.
Report: the command name, one sample of its output, and the files changed.
```

Handing over a check on another machine, where the facts carry the work:

```
Goal: confirm that engine cs:206 reports the measured hang age, not the configured threshold, on a Win64 Development build; the current report may be lying to us about how long hangs last.
Done when: a forced GameThread stall of ~7 s yields a hang report carrying the measured age and effective threshold, and the Sentry event shows the measured value.
Facts: ThreadHeartBeat.cpp:548 clamps any configured threshold below 5 s up to 5 s, so use 5 s or more. `debug stall <seconds>` sleeps the GameThread and returns; `debug softlock` never returns. The code is believed correct at step 3 from a static walk; nothing here has run, because the Mac editor compiles the checkers out.
Constraints: cs:206 or later, Development not Editor, no engine header changes, check in nothing.
Report: log paths and the Sentry event id; if it fails, say whether the check or the code is wrong before fixing either.
```
