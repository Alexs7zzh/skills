#!/bin/bash
# Git runs this hook from the updated worktree, including linked worktrees.
set -eu
ROOT=$(git rev-parse --show-toplevel)
exec "$ROOT/scripts/sync-skills.sh"
