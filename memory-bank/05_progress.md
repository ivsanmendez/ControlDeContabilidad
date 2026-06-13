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
  - Public URL: https://cdc.meyis.work
  - Script: `./deploy.sh`
  - Pod: API + PostgreSQL + cloudflared containers
- Contributor + contribution management (CRUD endpoints + React UI)
- Receipt digital signature system (certsigner adapter, SAT certificate support)
- Contribution category catalog (migration 008, domain/category, CRUD API + UI)
- Security Folio for receipts (see below)
- Monthly Balance Report (see below)
- SPA content negotiation middleware (see below)
- Per-expense receipts with SAT digital signing (see below)
- Vehicle access control system (#4, all phases) — AccessControls + Vehicles CRUD APIs, auto-evaluation service, pending-sync tracking (`physical_synced_at`), HouseDetailPage extended with Access Controls and Vehicles sections; migrations 017–019; PR #9 merged to main 2026-06-12
- Camera access configuration per contributor (PR #10, merged 2026-06-13) — contributors carry `camera_access` (bool), `camera_email`, and `camera_phone` fields; contributor form shows email/phone fields conditionally when access is enabled; contributor table and house detail page display a camera icon indicator with the registered credentials

## Previously Completed — Vehicle Access Control (#4, all phases)
Full implementation of vehicle access control tied to houses: automatic evaluation, physical-device sync tracking, and a reworked house detail page.

### What Was Built

**Backend:**
- **Migration 017**: `access_controls` table with `physical_synced_at` column for pending-sync tracking
- **Migration 018**: `vehicles` table with FK to `houses`
- **Migration 019**: `vehicle_access_controls` join table linking vehicles to access controls
- **AccessControl entity + CRUD API**:
  - `GET/POST /houses/{id}/access-controls` — list and create access controls per house
  - `GET/PUT/DELETE /access-controls/{id}` — single access control management
  - `GET /access-controls/pending-sync` — returns records where `physical_synced_at IS NULL`
  - `POST /access-controls/evaluate` — manual trigger for auto-evaluation of all houses
- **Vehicle entity + CRUD API**:
  - `GET/POST /houses/{id}/vehicles` — list and create vehicles per house
  - `GET/PUT/DELETE /vehicles/{id}` — single vehicle management
  - `POST /vehicles/{id}/access-controls/{control_id}` — associate a vehicle with an access control
- **Automatic evaluation service** (`EvaluateHouse` / `EvaluateAll`):
  - Sets status to `warning` at 2 months arrears
  - Sets status to `inactive` at 3+ months arrears
  - Runs on the evaluate endpoint and can be scheduled
- **Pending-physical sync tracking**: `physical_synced_at` timestamp; `NULL` means not yet pushed to physical access-control device; cleared on successful sync

**Frontend:**
- **HouseDetailPage** extended with two new collapsible sections: "Access Controls" and "Vehicles"
- Access Controls section: lists controls, status badges (active/warning/inactive), pending-sync indicator, create form
- Vehicles section: lists vehicles per house, create form, link to associate with an access control

### Build Status
All CI jobs passing (Go vet + tests + build, TypeScript build). Merged to main via PR #9 on 2026-06-12.

## Previously Completed — Per-Expense Receipts with SAT Digital Signing
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

## Known Issues / Operational Notes

### 2026-05-07 — "permisos insuficientes" when creating a house (403)

**Symptom:** Any authenticated user with role `user` gets a 403 "permisos insuficientes" when calling `POST /houses`.

**Root cause:** `house:create` is an admin-only permission. `internal/domain/user/permission.go` grants `RoleUser` only `PermHouseRead`. The route enforces `RequirePermission(PermHouseCreate)`, which rejects non-admin callers.

**Permission matrix:**

| Permission | user role | admin role |
|---|---|---|
| house:create | no | yes |
| house:read | yes | yes |
| house:update | no | yes |
| house:delete | no | yes |
| house:assign_contributor | no | yes |

**Fix applied (2026-05-07):** Promoted `falliv@gmail.com` to `admin` directly in the database:
```sql
UPDATE users SET role = 'admin', updated_at = NOW() WHERE email = 'falliv@gmail.com';
```
User must log out and log back in to receive a new JWT with the updated role claim.

**Additional fix (2026-05-09):** Password for `falliv@gmail.com` was changed. Combined with the admin promotion above, the account has had both its role and its password updated.

**Future admin promotion command:**
```bash
psql "postgres://postgres:postgres@localhost:5432/controldecontabilidad?sslmode=disable" \
  -c "UPDATE users SET role = 'admin', updated_at = NOW() WHERE email = '<email>';"
```
Then the user must re-login to refresh their JWT.

**Known UX gap (pending improvement):** The frontend does not conditionally hide or disable the "Create House" button for `user`-role accounts, so non-admin users can still attempt the action and hit the 403. See `04_activecontext.md` — Pending Improvements.
