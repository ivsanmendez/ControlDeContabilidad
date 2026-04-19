#!/bin/bash
set -euo pipefail

AGENTFS_BIN="${HOME}/.cargo/bin/agentfs"
AGENT_ID="control-contabilidad"
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"

# Fallback: if agentfs is not available, load from local files
if [ ! -x "$AGENTFS_BIN" ]; then
  MEMORY_DIR="$PROJECT_DIR/memory-bank"
  if [ ! -d "$MEMORY_DIR" ]; then
    echo "Memory bank not found"
    exit 0
  fi
  echo "=== MEMORY BANK LOADED (local fallback) ==="
  for file in "$MEMORY_DIR"/[0-9][0-9]_*.md; do
    [ -f "$file" ] || continue
    echo "--- $(basename "$file") ---"
    cat "$file"
    echo ""
  done
  for readme in "$MEMORY_DIR"/*/README.md; do
    [ -f "$readme" ] || continue
    subdir=$(basename "$(dirname "$readme")")
    echo "--- $subdir/README.md ---"
    cat "$readme"
    echo ""
  done
  echo "=== END MEMORY BANK ==="
  exit 0
fi

echo "=== MEMORY BANK LOADED (AgentFS) ==="
echo ""

# Load core documents in numbered order
while IFS= read -r line; do
  # lines from "agentfs fs ls /" look like "f 01_projectbrief.md"
  type="${line:0:1}"
  name="${line:2}"
  [[ "$type" == "f" ]] || continue
  [[ "$name" =~ ^[0-9][0-9]_ ]] || continue
  echo "--- $name ---"
  "$AGENTFS_BIN" fs "$AGENT_ID" cat "$name" 2>/dev/null
  echo ""
done < <(cd "$PROJECT_DIR" && "$AGENTFS_BIN" fs "$AGENT_ID" ls / 2>/dev/null)

# Load subdirectory READMEs for awareness
for subdir in api decisions deployment features frontend templates; do
  readme_content=$(cd "$PROJECT_DIR" && "$AGENTFS_BIN" fs "$AGENT_ID" cat "$subdir/README.md" 2>/dev/null) || continue
  echo "--- $subdir/README.md ---"
  echo "$readme_content"
  echo ""
done

echo "=== END MEMORY BANK ==="