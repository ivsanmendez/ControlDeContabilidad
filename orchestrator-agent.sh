#!/usr/bin/env bash
# orchestrate.sh — launch the project-orchestrator Claude agent
#
# Usage:
#   ./orchestrate.sh                        # interactive session
#   ./orchestrate.sh "fix the date bug"     # one-shot prompt, prints and exits
#   ./orchestrate.sh -c                     # continue last session
#   ./orchestrate.sh --effort max "..."     # pass extra claude flags before prompt

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENT="project-orchestrator"

# Ensure we run from the project root so hooks, CLAUDE.md, and agents resolve
cd "$SCRIPT_DIR"

# Separate flags intended for claude from the positional prompt argument.
# Any argument starting with '-' is treated as a claude flag; the first
# non-flag argument (and everything after) becomes the prompt.
CLAUDE_FLAGS=()
PROMPT_PARTS=()
PRINT_MODE=false

for arg in "$@"; do
  case "$arg" in
    -p|--print)
      PRINT_MODE=true
      CLAUDE_FLAGS+=("$arg")
      ;;
    -*)
      CLAUDE_FLAGS+=("$arg")
      ;;
    *)
      PROMPT_PARTS+=("$arg")
      ;;
  esac
done

# Build the claude command
CMD=(claude --agent "$AGENT" "${CLAUDE_FLAGS[@]}")

if [ ${#PROMPT_PARTS[@]} -gt 0 ]; then
  # One-shot mode: a prompt was supplied → force --print if not already set
  PROMPT="${PROMPT_PARTS[*]}"
  if [ "$PRINT_MODE" = false ]; then
    CMD+=(-p)
  fi
  CMD+=("$PROMPT")
fi

exec "${CMD[@]}"