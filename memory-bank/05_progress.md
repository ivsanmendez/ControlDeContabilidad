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
- Memory bank with SessionStart hook auto-loading
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

## Recently Completed — SPA Content Negotiation Fix
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
- React expense management UI (#4)
- AI agent driving adapter (#6)
- Persistent event bus (#7)

## Known Issues
_(none)_
