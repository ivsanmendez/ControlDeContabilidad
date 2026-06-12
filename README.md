# Control De Contabilidad

Financial and accounting management system for a residential development (*fraccionamiento*). Tracks expenses, contributions, contributors, houses, and vehicle access controls.

**Stack:** Go REST API + React SPA + PostgreSQL 16, orchestrated with Docker Compose.

**Production:** [https://cdc.meyis.work](https://cdc.meyis.work)

---

## Features

- Expense management with categories, receipt generation, and SAT digital signing
- Contribution tracking per contributor with monthly balance reports
- Contributor and house management with contributor assignment
- Vehicle access control registry — remote controls linked to houses, automatic disabling on payment arrears
- JWT authentication with role-based access control (`user` / `admin`)
- Full ES/EN internationalization
- Printable receipts with QR folio verification

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [mise](https://mise.jdx.dev/) — manages Go 1.24 and Node 22 for local development

---

## Quickstart (Docker)

The easiest way to run the full stack:

```bash
docker compose up
```

| Service  | URL                    |
|----------|------------------------|
| API      | http://localhost:8080  |
| Frontend | http://localhost:5173  |
| DB       | localhost:5432         |

Migrations run automatically on API startup. To reset the database:

```bash
docker compose down -v   # removes the pgdata volume
docker compose up
```

---

## Local Development (without Docker)

Requires PostgreSQL running locally. The dev profile sets `DATABASE_URL` to `localhost:5432`.

### 1. Activate the dev environment

```bash
export MISE_ENV=development
```

mise will merge `.mise.development.toml` on top of `.mise.toml`, providing `DATABASE_URL`, `JWT_SECRET`, and other env vars automatically.

### 2. Create the database

```bash
createdb controldecontabilidad
```

### 3. Start the API

```bash
mise run dev:api       # Go API on :8080 (migrations run on startup)
```

### 4. Start the frontend

```bash
mise run dev:web       # Vite dev server on :5173
```

---

## Environment Profiles

| File | Purpose |
|------|---------|
| `.mise.toml` | Base config — tool versions, shared env vars, tasks |
| `.mise.development.toml` | Dev profile — local DB, `LOG_LEVEL=debug` |
| `.mise.test.toml` | Test profile — separate test DB, `LOG_LEVEL=warn` |
| `.mise.local.toml` | Local secrets (gitignored) |

Activate a profile: `export MISE_ENV=development` (or `test`).

---

## Available Tasks

```bash
mise run build          # Build Go API binary to bin/api
mise run dev:api        # Run Go API locally (:8080)
mise run dev:web        # Run Vite dev server (:5173)
mise run test           # Run all Go tests
mise run test:web       # Run frontend tests
mise run lint           # go vet ./...
mise run lint:web       # ESLint frontend
mise run migrate        # Run goose migrations manually
```

Run a single Go test:

```bash
mise exec -- go test -run TestName ./internal/domain/expense/...
```

Run a frontend command directly:

```bash
mise exec -- npm --prefix web run build
```

---

## Architecture

Hexagonal architecture (ports & adapters):

```
cmd/api/main.go              ← composition root
internal/
  domain/                    ← core business logic (zero external deps)
    expense/
    contribution/
    contributor/
    house/
    accesscontrol/
    vehicle/
    user/
    ...
  port/
    inbound.go               ← driving port interfaces (services)
    outbound.go              ← driven port interfaces
  adapter/
    httpapi/                 ← HTTP driving adapter (handlers + router)
    postgres/                ← PostgreSQL driven adapter (repositories)
    i18n/                    ← translation adapter
    jwt/                     ← JWT issuer adapter
    certsigner/              ← SAT certificate signing adapter
web/                         ← React SPA (Vite + TypeScript + shadcn/ui)
db/migrations/               ← goose SQL migrations
```

**API** serves JSON on `:8080`. **React** dev server on `:5173` (proxies API calls). In production, the Go server also serves the compiled React build from `web/dist`.

---

## Database

PostgreSQL 16. Migrations are managed with [goose](https://github.com/pressly/goose) and run automatically at startup via the embedded `db/migrations` directory.

Connection string (dev): `postgres://postgres:postgres@localhost:5432/controldecontabilidad?sslmode=disable`

---

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on every push and PR to `main`:

- **api** — `go vet`, `go test -race`, `go build` (with a PostgreSQL service container)
- **web** — `npm ci`, `npm run lint`, `npm run build`
- **docker** — verifies `docker build` succeeds