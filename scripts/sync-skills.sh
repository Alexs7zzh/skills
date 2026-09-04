#!/bin/bash
# Link visible skill folders under SRC into the generic agents skills dir and
# Claude's skills dir. A folder whose name starts with _ is hidden.
# Idempotent; prunes managed links whose target is gone or hidden.
# Usage: sync-skills.sh [SRC]   (default: <this repo>/skills)
set -u
SRC="${1:-$(cd "$(dirname "$0")/.." && pwd)/skills}"
DESTS=("$HOME/.agents/skills" "$HOME/.claude/skills")
for DEST in "${DESTS[@]}"; do
  mkdir -p "$DEST"
  for link in "$DEST"/*; do
    [ -L "$link" ] || continue
    target=$(readlink "$link")
    case "$target" in
      "$SRC"/*)
        target_name=$(basename "$target")
        case "$target_name" in
          _*) rm "$link" ;;
          *) [ -e "$link" ] || rm "$link" ;;
        esac
        ;;
    esac
  done
  for skill in "$SRC"/*/; do
    [ -d "$skill" ] || continue
    name=$(basename "$skill")
    case "$name" in _*) continue ;; esac
    [ -e "$DEST/$name" ] || ln -s "$SRC/$name" "$DEST/$name"
  done
done
