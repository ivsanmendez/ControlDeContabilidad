# Progress Log

## What Works
- Hexagonal architecture implemented (domain/port/adapter layers)
- Domain core: Expense entity with factory + validation, domain events, Service with CRUD use cases
- Port interfaces: `ExpenseService` (inbound), `Repository`/`EventPublisher` (outbound), `EventSubscriber`
- HTTP adapter: health endpoint + expense CRUD handlers wired via `RegisterRoutes`
- PostgreSQL adapter: full CRUD implementation (Save, FindByID, FindAll, Delete)
- In-memory event bus adapter
- Composition root in `cmd/api/main.go` wires all layers
- React SPA scaffolded with Vite + TypeScript (`web/`)
- Docker Compose (API + PostgreSQL 16 + React dev server)
- GitHub Actions CI pipeline
- Memory bank with SessionStart hook — now loads from AgentFS (local fallback preserved)
- AgentFS vector memory bank (see ADR-04):
  - Local SQLite DB at `.agentfs/control-contabilidad.db`
  - Ollama `nomic-embed-text` 768d embeddings with chunking + 10% overlap
  - Incremental re-indexing via SHA-256 content hash
  - `memory-bank` MCP server in `~/.claude/settings.json`
  - `memory-bank-manager` Claude Code subagent
  - Embedding script: `.agentfs/embed.py index|search|status`
- `orchestrator-agent.sh` — shell script to launch the project-orchestrator agent (`./orchestrator-agent.sh [flags] [prompt]`)
- CLAUDE.md
- Database migrations with goose (`db/migrations/`)
- Domain unit tests (entity + service with fake adapters)
- Convention-aligned PR template (`.github/pull_request_template.md`)
- Production deployment via Podman pod + Cloudflare Named Tunnel
  - Public URL: https://cdg.meyis.work
  - Script: `./deploy.sh`
  - Pod: API + PostgreSQL + cloudflared containers
- Contributor + contribution management (CRUD endpoints + React UI)
- Receipt digital signature system (certsigner adapter, SAT certificate support)
- Contribution category catalog (migration 008, domain/category, CRUD API + UI)
- Security Folio for receipts (see below)
- Monthly Balance Report (see below)
- SPA content negotiation middleware (see below)
- Per-expense receipts with SAT digital signing (see below)

## Recently Completed — Per-Expense Receipts with SAT Digital Signing
Extended the receipt infrastructure to support individual expense receipts alongside contribution receipts, reusing the existing folio counter, certsigner, and receipt domain.

### What Was Built

**Backend:**
- **Migration 013** (`db/migrations/013_add_expense_receipts.sql`):
  - `receipt_type VARCHAR(20)` column (default `'contribution'`)
  - `expense_id BIGINT` FK to `expenses(id)`, nullable
  - `contributor_id` made nullable
  - CHECK constraint: contribution rows need `contributor_id`, expense rows need `expense_id`
  - Partial index on `expense_id`
- **Receipt entity** (`internal/domain/receipt/receipt.go`): `TypeContribution`/`TypeExpense` constants, `ReceiptType string`, `ContributorID *int64`, `ExpenseID *int64`
- **Receipt repo** (`receipt_folio_repo.go`): `nullInt64` helper, updated Save/FindByFolio/scanOne for nullable fields and new columns
- **Expense domain** (`service.go`): `FindDetailedByID` in `Repository` interface, `GetExpenseDetail` method (returns `ExpenseDetail` with `CategoryName`, enforces ownership)
- **Expense postgres** (`expense_repo.go`): `FindDetailedByID` using `expenseDetailSelect + WHERE e.id = $1`
- **Inbound port**: `GetExpenseDetail` added to `ExpenseService` interface
- **Expense handler**: `GetByID` now calls `GetExpenseDetail` (response includes `CategoryName`)
- **Receipt handler**: `expenseSvc` field, `ExpenseReceiptSignature` handler (`POST /expenses/{id}/receipt-signature`), updated `ReceiptSignature` (sets `ReceiptType: TypeContribution`), updated `VerifyReceipt` (returns `receipt_type`, `expense_id`)
- **Router**: `POST /expenses/{id}/receipt-signature` with `PermExpenseReadOwn`
- **i18n**: `expense_not_found_for_receipt`, `failed_to_load_expense` (ES + EN)
- **Tests**: `FindDetailedByID` in fakeRepo, 3 new `TestGetExpenseDetail_*` tests (happy, forbidden, not found)

**Frontend:**
- **Vite proxy**: `/expenses` now has `bypass` for `text/html` (browser navigation to receipt page)
- **Types** (`expense.ts`): `ExpenseReceiptData`, `ExpenseReceiptSignatureResponse`
- **Hooks**: `useExpense(id)` query, `useExpenseReceiptSignature()` mutation
- **Sign dialog** (`expense-receipt-sign-dialog.tsx`): same pattern as contribution receipt
- **Receipt page** (`expense-receipt-page.tsx`): at `/expenses/:id/receipt`, shows expense details, sign & print flow, folio + QR
- **Routing** (`App.tsx`): `/expenses/:id/receipt` outside `AppLayout`, inside `ProtectedRoute`
- **Expense table**: `FileText` icon link per row (mobile + desktop) to receipt page
- **i18n**: `receipt.*` keys in `expenses.json` (ES + EN)

### Expense Receipt Signing Flow
1. User clicks receipt icon on expense row → opens `/expenses/:id/receipt`
2. Page loads expense via `GET /expenses/{id}` (now returns `CategoryName`)
3. User clicks "Sign & Print" → dialog opens with signer name + SAT password
4. `POST /expenses/{id}/receipt-signature` → generates folio, signs canonical JSON, persists to `receipt_folios`
5. Response includes folio + signed data → QR code appears → auto-print

## Recently Completed — Edit Expense (closes #4)
Completed the full expense management UI by adding edit-expense support, making feature #4 fully done. The backend was already complete; this was a frontend-only milestone.

### What Was Built

**Frontend:**
- **`UpdateExpenseRequest` type** (`web/src/types/expense.ts`): request shape for `PUT /expenses/{id}`
- **`useUpdateExpense()` hook** (`web/src/hooks/use-expenses.ts`): mutation that calls `PUT /expenses/{id}`, invalidates expense list on success
- **`ExpenseEditForm` component** (`web/src/components/expenses/expense-edit-form.tsx`): pre-fills all fields from the existing expense; same validation pattern as `ExpenseForm`
- **`ExpenseTable`**: added `onEdit` prop and Pencil icon button per row (mobile + desktop layouts)
- **`ExpensesPage`**: edit dialog state (`editingExpense: Expense | null`), wired to `ExpenseTable` and `ExpenseEditForm`
- **i18n keys** (`form.editTitle`, `form.submitUpdate`, `form.errorUpdate`, `toast.updated`) added in both `messages_es.go` and `messages_en.go`
- Build passes with zero TypeScript errors

**Backend (pre-existing):**
- `PUT /expenses/{id}` handler, domain `UpdateExpense` use case, postgres `Update` method — all complete before this sprint

## Previously Completed — SPA Content Negotiation Fix
Fixed production bug where browser navigation to SPA client-side routes was intercepted by API wildcard routes, causing auth errors.

### Problem
`window.open('/contributions/receipt?...', '_blank')` in a new tab sends a GET request to the server. Go's mux matched `GET /contributions/{id}` (with `id=receipt`) instead of serving the SPA. The auth middleware rejected the request because there was no JWT token in the browser navigation.

### What Was Built
- **`spaContentNegotiation()` middleware** (`cmd/api/main.go:106-127`): wraps the entire mux handler
  - Intercepts GET requests where `Accept` header contains `text/html` and path has no file extension
  - Serves `index.html` for browser navigation, letting React Router handle client-side routes
  - Passes all other requests (API fetch calls, static files) through to the mux
  - Excludes `/health` so monitoring tools always get JSON
  - Gracefully disabled when `index.html` doesn't exist (dev mode without build)
- Mirrors the Vite proxy `bypass` logic in `web/vite.config.ts` (lines 26, 34)

### How It Works
| Request Type | Accept Header | Result |
|---|---|---|
| Browser navigation (new tab, refresh) | `text/html,...` | Serves `index.html` → React Router |
| SPA `fetch()` API calls | `*/*` | Passes to mux → API routes |
| Static files (`.js`, `.css`, `.svg`) | varies, has extension | Passes to mux → file server |
| Health check | any | Excluded → always returns JSON |

## Previously Completed — Monthly Balance Report
Read-only aggregation report showing income vs expenses by month for a given year.

### What Was Built
- **Domain** (`internal/domain/report/`):
  - `report.go` — `MonthAggregate`, `MonthSummary`, `MonthlyBalanceReport` DTOs, `ErrInvalidYear`
  - `service.go` — `Repository` interface, `Service` (`GetMonthlyBalance`)
  - `service_test.go` — 4 unit tests (invalid year, empty year, computation, repo error)
- **Postgres adapter** (`report_repo.go`): `AggregateIncomeByMonth` (SUM contributions), `AggregateExpensesByMonth` (SUM expenses)
- **Ports**: `ReportService` (inbound), `ReportRepository` (outbound)
- **Permission**: `report:read` added to both roles
- **New endpoint**: `GET /reports/monthly-balance?year=YYYY` — returns 12-month report
- **i18n**: `report_query_failed` key (ES + EN)
- **Frontend**: Monthly balance page at `/reports/monthly-balance` with year selector, print support, totals row, negative balances in red
- **Vite proxy**: `/reports` → `http://localhost:8080`
- **Nav**: "Reporte Mensual" / "Monthly Report" link in header

## Previously Completed — Security Folio for Receipts
Persistent, unique folio numbers for every signed receipt. Provides audit trail and verification capability.

### What Was Built
- **Migration 009**: `receipt_folio_counters` (per-year atomic sequence) + `receipt_folios` tables
- **Domain** (`internal/domain/receipt/`):
  - `receipt.go` — `ReceiptFolio` entity, `GenerateFolio()`, `GenerateUUIDSuffix()`, `ErrNotFound`
  - `service.go` — `Repository` interface, `Service` (`GenerateNewFolio`, `SaveFolio`, `VerifyFolio`)
- **Postgres adapter** (`receipt_folio_repo.go`): atomic `NextSequence`, `Save`, `FindByFolio`
- **Ports**: `ReceiptFolioService` (inbound), `ReceiptFolioRepository` (outbound)
- **Permission**: `receipt:verify` added to both roles
- **Updated receipt handler**: folio generation → included in canonical JSON → signed → persisted
- **New endpoint**: `GET /receipts/verify/{folio}` — authenticated folio verification
- **i18n**: 4 new error keys (ES + EN)
- **Frontend**: folio in receipt header, QR encodes folio string, folio text below QR
- **Vite proxy**: `/receipts` → `http://localhost:8080`

### Folio Format
```
REC-{YYYY}-{NNNNNN}-{XXXXXXXX}
```
Example: `REC-2026-000001-A3F7B2C1`

## Previously Completed — Contribution Category Catalog
- Migration 008: `contribution_categories` table, "General" seed, backfill, composite unique constraint
- Domain: `internal/domain/category/` with entity, service, repository
- Full CRUD API + frontend page at `/contribution-categories`
- Contribution form category selector, receipt multi-category cells

## Previously Completed — SAT Certificate Signing + Print-Sign Dialog
- certsigner adapter (SAT format: DER/PEM encrypted PKCS#8, per-request decryption)
- ReceiptSigner port: `Sign(data, password)`
- Receipt endpoint: `POST /contributions/receipt-signature`
- Frontend print-sign dialog flow

## Previously Completed — AAA Framework (#5)
- User domain: entity, tokens, permissions, audit, ports, service + 24 tests
- Expense domain updated: `UserID` field, caller params, ownership checks + 18 tests
- Port interfaces, DB migrations, driven adapters, HTTP middleware
- Go upgraded 1.23 → 1.24

## What's Left to Build
- AI agent driving adapter (#6)
- Persistent event bus (#7)

## Recently Completed — AgentFS Vector Memory Bank
Migrated memory-bank from flat markdown files to a local SQLite/libSQL database with Ollama vector embeddings, enabling semantic search over project knowledge.

### What Was Built
- **AgentFS** (`agentfs v0.6.4`): local agent filesystem at `.agentfs/control-contabilidad.db`
  - All 34 `memory-bank/*.md` files imported via `agentfs fs write`
  - Installed at `~/.cargo/bin/agentfs`
- **Vector index** (table `vec_memory_bank` in same DB):
  - Model: `nomic-embed-text` (Ollama, local, 768 dimensions)
  - Chunking: 4000 chars/chunk, 10% overlap (400 chars), adaptive halving on context overflow
  - Deduplication: SHA-256 content hash — only changed files re-embedded on `index`
- **Embedding script** (`.agentfs/embed.py`):
  - `index` — incremental index, `index --force` to re-embed all
  - `search <query>` — cosine similarity search, returns top 5
  - `status` — shows each file as `current`, `STALE`, or `DELETED`
- **MCP server**: `memory-bank` entry in `~/.claude/settings.json` → `agentfs serve mcp control-contabilidad`
- **SessionStart hook** (`.claude/hooks/load-memory-bank.sh`): reads core docs from AgentFS CLI; falls back to local files if AgentFS unavailable
- **`memory-bank-manager` agent** (`.claude/agents/memory-bank-manager.md`): Claude Code subagent that handles search, read, update, and sync lifecycle

## Known Issues
_(none)_
