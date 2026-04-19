# ADR-04: AgentFS Vector Memory Bank

## Context

The memory-bank was a collection of flat markdown files loaded into context via a SessionStart shell hook. This worked for small sessions but had limitations:
- No semantic search — finding related knowledge required knowing the exact file
- Files only existed locally — no persistence layer or structured access
- The hook dumped all files into context regardless of relevance
- No way for Claude to write back structured memories during a session

## Options Considered

1. **Keep flat files** — simple but no search, no structured access
2. **Cloud vector DB (Pinecone, Weaviate)** — powerful but requires internet + API keys + cost
3. **Turso cloud + AgentFS sync** — cloud-backed but adds network dependency
4. **AgentFS local + Ollama** — fully local, no cloud, no API keys, portable

## Decision

**AgentFS (local) + Ollama `nomic-embed-text` embeddings**

- AgentFS stores files in a local SQLite/libSQL database at `.agentfs/control-contabilidad.db`
- Ollama runs `nomic-embed-text` (137M, F16) locally for 768-dimension embeddings
- A `vec_memory_bank` table in the same DB holds embeddings alongside the AgentFS tables
- The `memory-bank` MCP server exposes AgentFS tools to Claude during sessions
- A `memory-bank-manager` Claude Code subagent handles search, read, and update workflows

## Architecture

```
memory-bank/*.md  ←→  AgentFS DB (.agentfs/control-contabilidad.db)
                           ├── fs_inode / fs_data   (AgentFS filesystem tables)
                           └── vec_memory_bank      (vector index table)

Ollama (localhost:11434)
  └── nomic-embed-text (768d)

~/.claude/settings.json
  └── mcpServers.memory-bank → agentfs serve mcp control-contabilidad

.claude/agents/memory-bank-manager.md
  └── Claude subagent: search → read → edit → sync → re-index
```

## Vector Index Details

| Property | Value |
|----------|-------|
| Table | `vec_memory_bank` |
| Model | `nomic-embed-text` (Ollama) |
| Dimensions | 768 |
| Chunk size | 4000 chars (adaptive: halves on context overflow) |
| Overlap | 10% (400 chars) |
| Multi-chunk strategy | Average all chunk embeddings into one vector per file |
| Change detection | SHA-256 content hash — only changed files re-embedded |
| Similarity | Cosine similarity (pure Python, sufficient for ~35 files) |

## Embedding Pipeline (`.agentfs/embed.py`)

```bash
python3 .agentfs/embed.py index          # incremental — skips unchanged files
python3 .agentfs/embed.py index --force  # re-embed all files
python3 .agentfs/embed.py search <query> # semantic search, returns top 5
python3 .agentfs/embed.py status         # shows current/STALE/DELETED per file
```

**Update workflow** (run after any memory-bank file is edited):
```bash
source $HOME/.cargo/env
agentfs fs control-contabilidad write "<rel-path>" "$(cat memory-bank/<rel-path>)"
python3 .agentfs/embed.py index
```

## Consequences

**Accepted trade-offs:**
- Ollama must be running for embedding (not needed for read-only search once indexed)
- Cosine similarity in pure Python scales to ~hundreds of files; beyond that, sqlite-vec extension needed
- `enable_load_extension` disabled in Apple's Python — sqlite-vec extension cannot be loaded; using pure Python instead
- Chunks are averaged, not stored separately — loses fine-grained chunk-level retrieval

**Benefits:**
- Zero cloud dependency — works fully offline
- Single SQLite file contains both file content and vectors (portable)
- Incremental re-indexing is fast (hash comparison, only changed files re-embedded)
- AgentFS MCP server gives Claude structured read/write access to memory-bank during sessions
- `memory-bank-manager` agent encapsulates the full lifecycle