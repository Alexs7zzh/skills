# Agent skills

This workspace contains portable skills for Codex and Claude Code.

## Layout

- `skills/` contains the maintained skills.
- `archive/` contains retired variants, kept for reference and never installed.
- `scripts/check-skills.sh` validates each skill's layout and invocation settings.
- `scripts/sync-skills.sh` links the skills into `~/.agents/skills/` and `~/.claude/skills/`.
- `references/` contains source material used while developing the skills. The maintained skills do not depend on it.

`AGENTS.md` contains the workspace instructions. `CLAUDE.md` is a symlink to the same file so both agents read one maintained copy.

## Set up the workspace

To make the skills in this workspace available to Codex or Claude Code on the current machine, run:

```sh
./scripts/sync-skills.sh
```

This links the maintained skills into `~/.agents/skills/` and `~/.claude/skills/`. The script accepts another source directory as its first argument. It adds missing links and removes broken links that it previously created.

### Retire a skill variant

Move retired or historical variants to `archive/`, which is outside the published tree and is never linked or installed. A `_` prefix on a directory under `skills/` hides it from this workspace's scripts only; external installers such as `npx skills` still discover every directory under `skills/`, so a `_` directory is a short-lived working state, not a place to keep old versions.

Run `scripts/sync-skills.sh` after moving or renaming a directory. The script adds missing links and removes managed links whose target is gone or hidden.

## Validate the skills

```sh
./scripts/check-skills.sh
```

The checker skips hidden variants.

## Author or maintain a skill

Follow [`skills/skill-authoring/SKILL.md`](skills/skill-authoring/SKILL.md). Keep the skill portable across agents, then run the checker and a realistic prompt or workflow that exercises the change.

See [`BEFORE_PUBLISHING.md`](BEFORE_PUBLISHING.md) before turning this workspace into a public package or repository.
