# Memory Bank

Read files in numbered order. Lower numbers = higher priority for context loading.

## Core Documents (always read)
| File | Purpose |
|------|---------|
| `01_projectbrief.md` | Project scope, goals, and tech stack overview |
| `02_techstack.md` | Tool versions, runtime details, port mappings |
| `03_architecture.md` | Repo layout, service diagram, data flow |
| `04_activecontext.md` | Current phase, recent decisions, next steps |
| `05_progress.md` | What works, what's left, known issues |
| `06_kanban.md` | Kanban board state and GitHub Project link |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| [`decisions/`](decisions/) | Architecture Decision Records (ADRs) |
| [`features/`](features/) | Feature-specific design docs and requirements |
| [`api/`](api/) | API endpoint docs, schemas, contracts |
| [`frontend/`](frontend/) | Component docs, state management, routing |
| [`deployment/`](deployment/) | Production deployment and infrastructure guides |
| [`templates/`](templates/) | Community notice and document templates |

## AgentFS Vector Backend

All files in this directory are mirrored to a local AgentFS SQLite database at `.agentfs/control-contabilidad.db` with Ollama vector embeddings for semantic search.

| Tool | Command |
|------|---------|
| Semantic search | `python3 .agentfs/embed.py search "<query>"` |
| Re-index after edits | `python3 .agentfs/embed.py index` |
| Check index health | `python3 .agentfs/embed.py status` |
| Sync file to AgentFS | `agentfs fs control-contabilidad write "<path>" "$(cat memory-bank/<path>)"` |

Use the `memory-bank-manager` Claude Code subagent to search, read, and update documents while keeping AgentFS and the vector index in sync automatically.

## Naming Convention
- Files use `NN_name.md` format (e.g., `01_projectbrief.md`)
- Lower numbers = higher priority / read first
- Leave gaps in numbering (01, 02, 05, 10...) to allow inserting later