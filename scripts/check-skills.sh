#!/bin/bash
# Validate the local cross-agent skill layout and invocation controls.
set -u

ROOT=$(cd "$(dirname "$0")/.." && pwd)
SKILLS="$ROOT/skills"
failures=0
count=0

fail() {
  printf 'error: %s\n' "$1" >&2
  failures=$((failures + 1))
}

for skill_dir in "$SKILLS"/*; do
  [ -d "$skill_dir" ] || continue
  name=$(basename "$skill_dir")
  case "$name" in _*) continue ;; esac
  count=$((count + 1))
  skill_file="$skill_dir/SKILL.md"
  manifest="$skill_dir/agents/openai.yaml"

  [ -f "$skill_file" ] || {
    fail "$name is missing SKILL.md"
    continue
  }
  [ -f "$manifest" ] || {
    fail "$name is missing agents/openai.yaml"
    continue
  }

  declared_name=$(awk '
    NR == 1 && $0 == "---" { in_frontmatter = 1; next }
    in_frontmatter && $0 == "---" { exit }
    in_frontmatter && /^name:[[:space:]]*/ {
      sub(/^name:[[:space:]]*/, "")
      gsub(/^['\''"]|['\''"]$/, "")
      print
      exit
    }
  ' "$skill_file")

  [ "$declared_name" = "$name" ] || \
    fail "$name declares frontmatter name '$declared_name'"

  if grep -Eq '^disable-model-invocation:[[:space:]]*true[[:space:]]*$' "$skill_file"; then
    grep -Eq '^[[:space:]]+allow_implicit_invocation:[[:space:]]*false[[:space:]]*$' "$manifest" || \
      fail "$name is user-invoked for Claude Code but not Codex"
  elif grep -Eq '^[[:space:]]+allow_implicit_invocation:[[:space:]]*false[[:space:]]*$' "$manifest"; then
    fail "$name is user-invoked for Codex but not Claude Code"
  fi

  grep -Eq '^[[:space:]]+display_name:[[:space:]]*' "$manifest" || \
    fail "$name manifest is missing interface.display_name"
  grep -Eq '^[[:space:]]+short_description:[[:space:]]*' "$manifest" || \
    fail "$name manifest is missing interface.short_description"
  grep -Eq '^[[:space:]]+default_prompt:[[:space:]]*' "$manifest" || \
    fail "$name manifest is missing interface.default_prompt"
done

if [ "$failures" -ne 0 ]; then
  printf '%s skill check(s) failed.\n' "$failures" >&2
  exit 1
fi

printf 'Checked %s skills: layout and invocation controls are consistent.\n' "$count"
