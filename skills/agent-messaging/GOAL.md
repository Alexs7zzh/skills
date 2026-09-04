# Goal

Why this skill exists and what it values. Read before discussing or changing it.

## Why

Agents write to agents all day: dispatches, handoffs, questions, rulings. Left alone they write long messages full of steps, and the steps are wrong more often than the goal is, because the sender does not know the receiver's code, constraints, or tools as well as the receiver will after ten minutes of reading. Every instruction the receiver would have worked out itself is a chance to misalign it and a limit on how well it can do the job.

## Values

- **The receiver knows better.** It reads the code, finds the constraints, and chooses the method. The sender's job is to say what is true when the work is done and why we want it.
- **Motivation travels, method does not.** "Debugging a run means reading four multi-megabyte logs" tells the receiver what problem to solve. A list of tables to create does not, and it fails as soon as the receiver learns something the sender did not know.
- **A reminder is not an instruction.** "Update the docs too" names something easy to forget. It does not say how.
- **Correctness comes from the receiver's result**, never from reviewing the message. Messages are written once and read once.
