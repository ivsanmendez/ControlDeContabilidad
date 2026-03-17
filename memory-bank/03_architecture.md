# Architecture

## Hexagonal Architecture (Ports & Adapters)

The Go backend follows hexagonal architecture to support future AI agent adapters and event-driven orchestration.

```
┌─────────────────────────────────────────────────────────────┐
│                    cmd/api/main.go                          │
│                  (Composition Root)                         │
└────────┬──────────────────────────────────┬─────────────────┘
         │                                  │
┌────────▼────────────┐         ┌───────────▼──────────────┐
│  DRIVING ADAPTERS   │         │   DRIVEN ADAPTERS        │
│  (inbound)          │         │   (outbound)             │
│                     │         │                          │
│  adapter/httpapi/   │         │   adapter/postgres/      │
│  [future] agent/    │         │   adapter/eventbus/      │
│  [future] grpc/     │         │   adapter/certsigner/    │
│                     │         │   adapter/bcrypt/        │
│                     │         │   adapter/jwt/           │
│                     │         │   [future] nats/         │
└────────┬────────────┘         └───────────┬──────────────┘
         │ depends on                       │ implements
         ▼                                  ▼
┌──────────────────────────────────────────────────────────┐
│                     PORTS                                 │
│  port/inbound.go    → ExpenseService, AuthService, etc.  │
│  domain/expense/    → Repository, EventPublisher ifaces  │
│  port/outbound.go   → EventSubscriber, ReceiptSigner     │
└──────────────────────────┬───────────────────────────────┘
                           │
              ┌────────────▼──────────────┐
              │       DOMAIN CORE         │
              │   domain/expense/         │
              │                           │
              │   Entity + factory        │
              │   Domain events           │
              │   Service (use cases)     │
              │   Zero external deps      │
              └───────────────────────────┘
```

## Repository Layout
```
ControlDeContabilidad/
├── cmd/api/main.go              # Composition root (wires all adapters)
├── internal/
│   ├── domain/expense/          # Expense hexagon (zero external deps)
│   │   ├── expense.go           # Entity, factory, domain errors
│   │   ├── event.go             # Domain events
│   │   └── service.go           # Service + outbound port interfaces
│   ├── domain/contribution/     # Contribution hexagon
│   │   ├── contribution.go      # Entity (CategoryID), factory, errors, ContributionDetail DTO
│   │   └── service.go           # Repository interface + Service (CRUD use cases)
│   ├── domain/contributor/      # Contributor hexagon
│   │   ├── contributor.go       # Entity, factory, errors
│   │   └── service.go           # Repository interface + Service
│   ├── domain/category/         # Contribution category catalog hexagon
│   │   ├── category.go          # Entity (Name, Description, IsActive), factory, errors
│   │   └── service.go           # Repository interface + Service (CRUD + ListActive)
│   ├── domain/receipt/          # Receipt folio hexagon (security folios)
│   │   ├── receipt.go           # Entity (ReceiptFolio), folio generation, errors
│   │   └── service.go           # Repository interface + Service (GenerateNewFolio, SaveFolio, VerifyFolio)
│   ├── domain/report/           # Monthly balance report hexagon
│   │   ├── report.go            # MonthSummary, MonthlyBalanceReport DTOs, errors
│   │   └── service.go           # Repository interface + Service (GetMonthlyBalance)
│   ├── domain/expense_category/ # Expense category catalog hexagon
│   │   ├── expense_category.go  # Entity, factory, errors
│   │   └── service.go           # Repository interface + Service (CRUD)
│   ├── domain/user/             # User/auth hexagon
│   │   └── ...                  # Entity, tokens, permissions, audit, service
│   ├── port/
│   │   ├── inbound.go           # Driving ports (ExpenseService, AuthService, ContributionService, ContributorService, CategoryService, ExpenseCategoryService, ReceiptFolioService, ReportService)
│   │   └── outbound.go          # Type aliases for driven ports (repos) + EventSubscriber, ReceiptSigner, ReceiptFolioRepository, ReportRepository
│   └── adapter/
│       ├── httpapi/             # HTTP driving adapter
│       ├── postgres/            # PostgreSQL driven adapter
│       ├── eventbus/            # In-memory event bus
│       ├── certsigner/          # SAT certificate signer (encrypted PKCS#8)
│       ├── bcrypt/              # Password hashing
│       ├── jwt/                 # JWT token issuance
│       └── i18n/                # ES/EN internationalization (handler-level strings)
├── web/                         # React SPA (Vite + TypeScript)
├── memory-bank/                 # Project documentation
├── .github/workflows/           # GitHub Actions CI/CD
├── .claude/hooks/               # Claude Code session hooks
├── Dockerfile                   # Multi-stage Go API image
├── docker-compose.yml           # Full stack orchestration
└── CLAUDE.md
```

## Service Architecture
```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│  React SPA  │────▶│   Go API     │────▶│ PostgreSQL │
│  (Vite)     │     │  (net/http)  │     │            │
│  :5173      │     │  :8080       │     │  :5432     │
└─────────────┘     └──────────────┘     └────────────┘
                    ┌──────────────┐
                    │  Event Bus   │ (in-memory, future: NATS)
                    └──────────────┘
```

## Dependency Rule
Arrows always point inward. Domain core imports nothing from adapters or ports. Only `main.go` knows all concrete types.

## Docker Strategy
- **Development**: `docker compose up` runs all three services
- **Production**: Multi-stage Dockerfile builds a minimal Go binary image (Go API + React build in single container)
- PostgreSQL uses a named volume for data persistence

## SPA Content Negotiation (Production)

In production the Go API serves both API routes and the React SPA from a single port. A `spaContentNegotiation` middleware in `cmd/api/main.go` wraps the mux to prevent API wildcard routes (e.g., `GET /contributions/{id}`) from catching SPA client-side routes (e.g., `/contributions/receipt`).

**Logic**: GET requests with `Accept: text/html` and no file extension → serve `index.html` (browser navigation). All other requests pass through to the mux (API calls, static files). This mirrors the Vite proxy `bypass` logic used in development (`web/vite.config.ts`).

The `/health` endpoint is explicitly excluded so monitoring tools always get JSON.

## Future: Agentic System
- AI agents will be driving adapters in `adapter/agent/`, calling the same `port.ExpenseService` as HTTP handlers
- Event subscribers react to domain events via the event bus
- The in-memory bus can be swapped to NATS/Kafka by adding a new adapter