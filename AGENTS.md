# Skills workspace

This workspace develops and tests portable skills for Codex and Claude Code.

- Treat `skills/` as the source of truth. Follow `skills/skill-authoring/SKILL.md` when creating, reviewing, testing, debugging, or maintaining a skill.
- Retired or historical variants live in `archive/`, outside the published tree; nothing installs from there. A `_` prefix on a directory under `skills/` hides it from the sync and validation scripts only, and an external installer still discovers it, so a `_` directory does not stay under `skills/` past the session that made it.
- Read only the references that the task needs. Keep `references/` unchanged, and do not make skills depend on it.
- Keep changes scoped. After changing a skill, run `scripts/check-skills.sh` and the nearest realistic workflow check.
