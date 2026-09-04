# Goal

Why this skill exists, what it values, and why its features have their shape. Read before discussing or changing it, and let every suggestion follow it.

## Why

Good code and good change are the same in every project, so one skill serves review, diagnosis, and writing. It is used every day on real code, so it has to produce correct fixes without a person watching, and it has to leave a record the person can read later.

## Values, in the order they win

1. **Correct code.** Proved, not argued: a probe over reasoning, a test red before the fix and green after, a second reader who did not write the work. Nothing below this line is bought by giving this up.
2. **The user can see and steer.** Every issue, every fix with the reason it took this shape, every question with its options, and a record of what happened and when, readable later. The run is meant to go unattended, but the window stays open: the user can ask how it is going, and can come back to any decision and choose the other way.
3. **No wasted time.** Within the first two, the workflow removes waiting, back-and-forth, and ceremony: no agent idles while work is ready, no step exists only to confirm another step, no report is stamped twice. Speed comes from the shape of the workflow, never from cutting rigor.

## How we think about the workflow

- **Information continuity.** The agent that investigated an issue holds the details: the code it read, the probe it ran, the dead ends. Handing the fix to another agent throws that away and makes the second agent rebuild it from a message that can never be complete. So the phases a human names, find, verify, propose, fix, check, are logically true but the wrong shape for agents. The one who understood the bug writes the test and the fix; a second reader judges the result. Judge every step by what information it moves and what it loses.
- **Agents' limits shape the mechanisms.** They have limited attention, forget, and agree with themselves. Hence a database that remembers state, subagents for bulk, two model families that check each other, and the rule that nobody marks their own work.
- **Keep pushing on the concepts.** The workflow is not finished. Each run's record shows where time and information were lost; the fix is to rethink the shape, not to add a step.

## What we do not do

- **The workflow does not try to be smart.** No mechanism unless it is proved necessary. A forgotten release of the checkout is an unclear instruction, and the fix is the instruction, not a timeout. Agents follow instructions well now; scripts hold state, gates, and messages, the things that must never be forgotten, and everything else is a plain instruction.
- **Scripts are not engineered for edge cases nobody has hit.** Agents can read `--help` and fix a failing script.
- **Docs do not carry history.** They say what to do, in plain words defined once.
