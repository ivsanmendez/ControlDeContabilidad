#!/usr/bin/env bash
# orchestrator-agent-ubuntu.sh — launch the project-orchestrator Claude agent (Ubuntu/Linux)
#
# Usage:
#   ./orchestrator-agent-ubuntu.sh                        # interactive session
#   ./orchestrator-agent-ubuntu.sh "fix the date bug"     # one-shot prompt, prints and exits
#   ./orchestrator-agent-ubuntu.sh -c                     # continue last session
#   ./orchestrator-agent-ubuntu.sh --effort max "..."     # pass extra claude flags before prompt

# Re-exec with bash if invoked via sh/dash (Ubuntu default /bin/sh is dash)
if [ -z "${BASH_VERSION:-}" ]; then
  exec bash "$0" "$@"
fi

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENT="project-orchestrator"

# Ensure we run from the project root so hooks, CLAUDE.md, and agents resolve
cd "$SCRIPT_DIR"

# --- Resolve claude binary (Ubuntu/Linux) ---
# Claude Code on Linux is typically installed via npm (global) or the standalone deb/rpm.
# Common locations are checked in order.
_find_claude() {
  # 1. Already in PATH (most common after npm -g install or deb install)
  if command -v claude &>/dev/null; then
    command -v claude
    return
  fi
  # 2. npm global bin (resolves even when PATH isn't fully set in non-login shells)
  local npm_bin
  npm_bin="$(npm bin -g 2>/dev/null || true)"
  if [ -n "$npm_bin" ] && [ -x "$npm_bin/claude" ]; then
    echo "$npm_bin/claude"
    return
  fi
  # 3. mise-managed node global bin
  local mise_node_bin="$HOME/.local/share/mise/installs/node/*/bin/claude"
  # shellcheck disable=SC2086
  local found
  found="$(ls $mise_node_bin 2>/dev/null | tail -1 || true)"
  if [ -n "$found" ] && [ -x "$found" ]; then
    echo "$found"
    return
  fi
  echo ""
}

CLAUDE_BIN="$(_find_claude)"

if [ -z "$CLAUDE_BIN" ]; then
  echo "error: 'claude' not found." >&2
  echo "Install Claude Code: npm install -g @anthropic-ai/claude-code" >&2
  exit 1
fi

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
CMD=("$CLAUDE_BIN" --agent "$AGENT" "${CLAUDE_FLAGS[@]}")

if [ ${#PROMPT_PARTS[@]} -gt 0 ]; then
  # One-shot mode: a prompt was supplied → force --print if not already set
  PROMPT="${PROMPT_PARTS[*]}"
  if [ "$PRINT_MODE" = false ]; then
    CMD+=(-p)
  fi
  CMD+=("$PROMPT")
fi

exec "${CMD[@]}"