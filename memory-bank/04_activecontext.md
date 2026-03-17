# Active Context

## Current Phase
SPA content negotiation fix deployed. Resolved production bug where browser navigation to SPA routes (e.g., `/contributions/receipt`) was intercepted by API wildcard routes (`GET /contributions/{id}`), causing auth errors when opening pages in new tabs.

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
- Security Folio system:
  - New `receipt` domain package (`internal/domain/receipt/`) with entity, service, repository
  - Migration 009: `receipt_folio_counters` (per-year atomic seq) + `receipt_folios` tables
  - Folio format: `REC-{YYYY}-{NNNNNN}-{XXXXXXXX}` (year + 6-digit seq + 8 hex chars)
  - Folio included in canonical JSON before signing → part of signed data
  - New permission: `receipt:verify` (both roles)
  - Verification endpoint: `GET /receipts/verify/{folio}`
  - Frontend: folio in receipt header, QR encodes folio string
- SPA content negotiation middleware in `cmd/api/main.go`:
  - `spaContentNegotiation()` wraps the mux, checks `Accept: text/html` for browser navigation
  - Prevents API wildcard routes from catching SPA client-side routes in production
  - Mirrors Vite proxy `bypass` logic used in development

## Next Steps
- [x] Implement PostgreSQL repository (actual SQL queries) — #1
- [x] Database migration strategy — #2 (goose)
- [x] Add domain unit tests with fake adapters — #3
- [x] AAA framework — #5
- [x] SAT certificate signing + print-sign dialog
- [x] Contribution category catalog
- [x] Security Folio for receipts
- [x] Monthly Balance Report
- [ ] Build React UI for expense management — #4

## Open Questions
- API documentation tooling (OpenAPI/Swagger)
- When to introduce AI agent adapter
