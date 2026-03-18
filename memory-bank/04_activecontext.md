# Active Context

## Current Phase
Per-expense receipt system with SAT digital signing implemented. Extended the existing receipt infrastructure to support individual expense receipts alongside contribution receipts.

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
- [ ] Build React UI for expense management — #4

## Open Questions
- API documentation tooling (OpenAPI/Swagger)
- When to introduce AI agent adapter
