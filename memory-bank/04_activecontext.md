# Active Context

## Current Phase
Feature #4 "Vehicle Access Control" (GitHub issue #4 — Control de Acceso Vehicular por Casa) is fully implemented across all four phases. Builds are passing. The issue is ready to move from Backlog to Review on the Kanban board, pending a PR and final testing pass.

## Recent Decisions
- Hexagonal architecture (ports & adapters) for the Go backend
- Outbound port interfaces defined in domain package (Go idiom: consumer defines interface)
- Inbound port interfaces in dedicated `port/` package (shared by HTTP + future agent adapters)
- In-memory synchronous event bus (replaceable with NATS/Kafka later)
- `github.com/lib/pq` as PostgreSQL driver
- goose for database migrations (`db/migrations/`)
- Convention-aligned PR template (ADR-02)
- Production deployment: Podman pod + Cloudflare Named Tunnel
- AAA framework design (ADR-03)
- SAT certificate signing (per-request password decryption)
- Contribution categories (migration 008, domain/category, CRUD API + UI)
- Security Folio system (shared by contributions and expenses):
  - `receipt` domain package (`internal/domain/receipt/`) with entity, service, repository
  - Migration 009: `receipt_folio_counters` + `receipt_folios` tables
  - Migration 013: extended `receipt_folios` for expenses (`receipt_type`, `expense_id`, nullable `contributor_id`, CHECK constraint)
  - Folio format: `REC-{YYYY}-{NNNNNN}-{XXXXXXXX}` (year + 6-digit seq + 8 hex chars)
  - Folios shared globally — both receipt types use same counter sequence
  - Verification endpoint: `GET /receipts/verify/{folio}` — returns `receipt_type` to distinguish
- Per-expense receipts:
  - `POST /expenses/{id}/receipt-signature` — signs individual expense with SAT certificate
  - `GetExpenseDetail` service method (returns `CategoryName`) for receipt data
  - Frontend: receipt page at `/expenses/:id/receipt`, sign dialog, receipt icon in expense table
  - Vite proxy for `/expenses` now has `bypass` for `text/html` (browser navigation to receipt page)
- SPA content negotiation middleware in `cmd/api/main.go`

## Next Steps
- [x] Implement PostgreSQL repository (actual SQL queries) — #1
- [x] Database migration strategy — #2 (goose)
- [x] Add domain unit tests with fake adapters — #3
- [x] AAA framework — #5
- [x] SAT certificate signing + print-sign dialog
- [x] Contribution category catalog
- [x] Security Folio for receipts
- [x] Monthly Balance Report
- [x] Per-expense receipts with SAT signing
- [x] Build React UI for expense management — #4

- `project-orchestrator` Claude Code subagent (`.claude/agents/project-orchestrator.md`):
  - Primary/default agent — replaces bare Claude for all project tasks
  - Enforces commit conventions, Kanban workflow, architecture rules, i18n, testing
  - Delegates knowledge queries to `memory-bank-manager`
  - Defines full environment, tool preferences, and per-workflow steps
- AgentFS local vector memory bank (ADR-04):
  - `memory-bank/` migrated to AgentFS SQLite DB (`.agentfs/control-contabilidad.db`)
  - Ollama `nomic-embed-text` (768d) embeddings stored in `vec_memory_bank` table
  - Chunking with 10% overlap, adaptive chunk size (4000 → 2000 chars on overflow)
  - SHA-256 content hash for incremental re-indexing (only changed files re-embedded)
  - `memory-bank` MCP server registered in `~/.claude/settings.json`
  - SessionStart hook updated to load from AgentFS (local fallback preserved)
  - `memory-bank-manager` Claude Code subagent at `.claude/agents/memory-bank-manager.md`
  - `orchestrator-agent.sh` script at project root — launches `project-orchestrator` agent via `claude --agent project-orchestrator`; supports interactive, one-shot (`--print` auto-added), and pass-through Claude flags (`--effort`, `--model`, `-c`)
- English-only code identifiers (ADR-05):
  - All Go, TypeScript, SQL, HTTP route, and i18n key identifiers must be in English — no exceptions
  - i18n translation *values* (user-facing strings) still follow the locale
  - `casa` → `house` rename complete: commit `6cccf8f` on `feature/access-control` branch, 33 files touched (domain, adapter, handler, port, migrations, full React SPA)
  - Rule enforced in CLAUDE.md and `project-orchestrator` agent
- House feature frontend complete:
  - `/houses` routes wired in React Router
  - `HousesPage` and `HouseDetailPage` components implemented

## Next Steps
- [x] Implement PostgreSQL repository (actual SQL queries) — #1
- [x] Database migration strategy — #2 (goose)
- [x] Add domain unit tests with fake adapters — #3
- [x] AAA framework — #5
- [x] SAT certificate signing + print-sign dialog
- [x] Contribution category catalog
- [x] Security Folio for receipts
- [x] Monthly Balance Report
- [x] Per-expense receipts with SAT signing
- [x] AgentFS vector memory bank + memory-bank-manager agent
- [x] Build React UI for expense management — #4
- [x] English-only code identifiers enforced (ADR-05), `casa` → `house` rename complete
- [x] House feature frontend wired (/houses routes, HousesPage, HouseDetailPage)
- [x] Vehicle Access Control — all 4 phases implemented (AccessControl + Vehicle CRUD APIs, auto-evaluation service, pending-sync tracking, HouseDetailPage extended) — #4

## Next Actions
- Move GitHub issue #4 to "Review" on the Kanban board and open a PR
- After #4 merges → move to "Done" and consider starting #5 (User Admin CRUD) or #6 (Filter contributors by house)

## Pending Improvements
- **Frontend: hide house creation controls for non-admin users** — The "Create House" button (and any other house mutation controls) should be conditionally rendered based on the authenticated user's role or permissions. Currently a `user`-role account can see and click the button but will receive a 403 from the API. The fix requires reading the role/permissions claim from the JWT (or a `/me` endpoint) in the React SPA and gating the UI accordingly. (Tracked from 2026-05-07 investigation — see `05_progress.md` Known Issues.) Workaround applied to `falliv@gmail.com`: promoted to `admin` role (2026-05-07) and password changed (2026-05-09).

## Open Questions
- API documentation tooling (OpenAPI/Swagger)
