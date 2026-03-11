# Active Context

## Current Phase
Security Folio for Receipts feature completed. Each receipt signing event now generates a unique persistent folio (`REC-YYYY-NNNNNN-XXXXXXXX`), included in signed data, stored in the database, and displayed on printed receipts. A verification endpoint allows folio lookup.

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

## Next Steps
- [x] Implement PostgreSQL repository (actual SQL queries) — #1
- [x] Database migration strategy — #2 (goose)
- [x] Add domain unit tests with fake adapters — #3
- [x] AAA framework — #5
- [x] SAT certificate signing + print-sign dialog
- [x] Contribution category catalog
- [x] Security Folio for receipts
- [ ] Build React UI for expense management — #4

## Open Questions
- API documentation tooling (OpenAPI/Swagger)
- When to introduce AI agent adapter
