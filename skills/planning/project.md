# Project context

## Read existing configuration

Follow the repository's agent instructions to the project context or existing tracker instructions. Read that file before resolving a bare task identifier or choosing a destination. An explicit task URL identifies its own tracker and project; a bare number needs the configured project. If multiple destinations remain plausible, ask which one rather than guessing from source control.

Read the referenced task's body, relevant discussion, parent, children, blockers, and linked goals or evidence needed for the request. Check current relationship state before calling work ready. Do not substitute a title or cached ready label for the task. If access fails, state what could not be read and preserve the limitation.

Follow the requested action after lookup. Scoping, interviewing, synthesis, and dependency changes use their planning methods. Implementation and code review use the coding workflow when available. An issue reference locates context; it does not authorize implementing every linked task or skipping a prerequisite. If the request is only "work on this," use the issue's kind and completion condition to establish the intended work, asking only when materially ambiguous.

## Configure when requested or needed

Inspect existing repository instructions, tracker configuration, and maintained document locations before creating anything. Reuse them when they already express the project choices. A source-control remote is a clue, not a decision to use its issue tracker. Ask only for missing choices that cannot be established from the user's instructions or project configuration.

Keep project context to the information consumers need:

- Task provider and destination: repository, workspace/team, or local directory and file convention. Include how bare identifiers are resolved.
- Where human goals/rulings, engineering guidance, and operator procedures are maintained.
- Project-specific labels, relationships, or delivery conventions that differ from discoverable defaults. Link existing delivery instructions instead of copying them.

Use an existing suitable file; if none exists, `docs/agents/project.md` is a default. Keep the filename discoverable through one short instruction in the repository's existing agent entry file to read it before choosing or working from tasks. Do not require the planning skill to be invoked for that pointer to take effect. Preserve the project's existing arrangement between agent entry files.

When authorized to configure, write the known choices and verify the pointer and document links. Keep generic interviewing, dependency reasoning, and retention rules in this skill. Keep enough literal project context for an agent without this skill to locate the correct work. Do not put credentials in the context, install a provider, create labels, or change tracker state merely to document an existing configuration.

If the context replaces older instructions, preserve project-specific policies and repair references. Remove duplicated generic workflow prose. Report what was configured and any unresolved choice; do not make the user confirm an already established provider again.
