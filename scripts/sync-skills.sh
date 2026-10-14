#!/bin/bash
# Link visible skill folders under SRC into the generic agents skills dir and
# Claude's skills dir. A folder whose name starts with _ is hidden.
# Idempotent; prunes managed links whose target is gone or hidden.
# Usage: sync-skills.sh [SRC]   (default: <this repo>/skills)
#        sync-skills.sh --install-hooks   (sync after Git updates too)
set -eu
ROOT=$(cd "$(dirname "$0")/.." && pwd)
INSTALL_HOOKS=false
if [ "${1:-}" = "--install-hooks" ]; then
  INSTALL_HOOKS=true
  shift
fi
if [ "$#" -gt 1 ] || { "$INSTALL_HOOKS" && [ "$#" -ne 0 ]; }; then
  printf 'Usage: %s [SRC] | --install-hooks\n' "$0" >&2
  exit 1
fi
SRC="${1:-$ROOT/skills}"
SRC=$(cd "$SRC" && pwd)

if "$INSTALL_HOOKS"; then
  HOOKS=$(git -C "$ROOT" rev-parse --git-path hooks)
  case "$HOOKS" in /*) ;; *) HOOKS="$ROOT/$HOOKS" ;; esac
  HOOK_SCRIPT="$ROOT/scripts/sync-skills-after-git.sh"
  # Check every destination before installing, so an existing hook stays intact.
  for hook in post-merge post-checkout post-rewrite; do
    path="$HOOKS/$hook"
    if [ -e "$path" ] || [ -L "$path" ]; then
      if [ ! -L "$path" ] || [ "$(readlink "$path")" != "$HOOK_SCRIPT" ]; then
        printf 'Cannot install auto-sync: existing hook at %s. Call %s from it instead.\n' "$path" "$HOOK_SCRIPT" >&2
        exit 1
      fi
    fi
  done
  mkdir -p "$HOOKS"
  for hook in post-merge post-checkout post-rewrite; do
    [ -L "$HOOKS/$hook" ] || ln -s "$HOOK_SCRIPT" "$HOOKS/$hook"
  done
  printf 'Installed Git hooks for automatic skill sync.\n'
fi

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
