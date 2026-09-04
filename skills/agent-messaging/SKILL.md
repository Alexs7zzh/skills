---
name: agent-messaging
description: "Use when writing a message another agent will act on: a prompt, brief, dispatch, or handoff to a subagent, a peer, or a session on another machine; delegating a task, a check, or a fix; replying to an agent's question; or relaying a ruling to one."
---

# Agent messaging

The receiver is an agent like you, with the code, its tools, and its own skills. Ten minutes into the work it knows the constraints better than you do now. Talk to it the way you would talk to a capable colleague: what is bothering you, and roughly what you want. Then stop.

## What to say

- **Where you are.** The receiver has the code but not your conversation. Words you have used all session, "the run", "the database", "deep", mean nothing until you say which project, which skill, which workflow. Open the way you would to a colleague who just walked in: "I am working on the coding skill, its deep workflow, where two reviewers share one database." The longer your session, the more you have stopped seeing this.
- **What bothers you and what you want.** Usually in that order, because that is how the want makes sense. "Debugging the last run meant reading four huge logs by hand; I want to open the run directory afterwards and see what each agent was doing at any moment." That is a complete message.
- **What it cannot know.** A fact you found, with how sure you are. A ruling from the user. What must not change, where the work must run, that nothing gets checked in. Say them as sentences where they come up, not as a section. Mark a guess as a guess, so a failing check is read as a question about the check before a bug in the code.
- **A reminder**, when something is easy to forget. "Update the docs too." Nothing about how.
- **How you will judge it, only when you would otherwise disagree later.** A feature request needs nothing: the receiver knows what done means. A check that could pass on wrong code does: say what you expect to see.
- **What you need back, only when it feeds your next decision.** Agents know how to report. Ask for something specific when you need that thing, such as "tell me whether the check or the code was wrong before fixing either."

## What not to say

Method. Which files, which commands, which tables, which steps. Anything you specify that you have not verified yourself is a mistake waiting to happen, and anything the receiver would have found on its own limits how well it can do the job. Name a command or a value only when you checked it and it is not discoverable: a clamp in the engine, a flag with no help text.

Constraints you did not have. If you would not have said it out loud, do not write it because a template had a slot for it. "No new dependency" when a dependency might make sense, "one screen", "one job per message": none of these is yours unless you mean it.

The brief again, when the receiver asks a question. Answer the question. A ruling is one line naming the option.

## Send it

A message is written once and read once. Read it one time for a fact the receiver would act on that is wrong, then send it. Do not version it, polish its wording, or check it with another agent. The receiver's result is the test of the message.

## Examples

A feature:

```
I am working on the coding skill in this repo, the deep workflow in deep.md where two reviewers and a master work through one shared database kept by the ledger script. After the last deep run I wanted to know where the hours went: who was working on what, who was waiting on whom, and what each disagreement was about. The only way was to read four multi-megabyte session logs in two formats and infer the timeline by hand. It took a whole session and still could not tell an idle agent from one investigating. I want to open a run directory afterwards and see what each agent was doing or waiting on at any moment, and what was argued on each row, without touching a session log. The database is the only shared, time-aligned record a run has; Herdr keeps no history. This might not need full event sourcing; an append-only record with the timeline derived from it may be enough. Keep it minimal, and do not slow down the commands agents run during a run. Remember to update the docs.
```

A check on another machine, where a wrong recipe would pass on wrong code:

```
I think the hang report shows the configured threshold instead of the measured age. Please confirm on a Win64 Development build, cs:206 or later: a forced GameThread stall of about 7 s should produce a report carrying the measured age, and the Sentry event should show it. Two things you will hit: ThreadHeartBeat.cpp:548 clamps thresholds under 5 s up to 5 s, so use 5 or more, and `debug softlock` never returns, use `debug stall <seconds>`. I have only walked the code; nothing has run here because the Mac editor compiles the checkers out. Do not change engine headers, check in nothing. If it fails, tell me whether the check or the code is wrong before fixing either.
```
