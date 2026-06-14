# Kanban Board

## GitHub Project
**URL**: https://github.com/users/ivsanmendez/projects/2

## Columns
| Column | Purpose |
|--------|---------|
| Backlog | Items not yet prioritized |
| Todo | Ready to work on |
| In Progress | Currently being worked on |
| Review | Awaiting review or testing |
| Done | Completed |

## Labels
| Label | Color | Scope |
|-------|-------|-------|
| `backend` | green | Go API related |
| `frontend` | blue | React SPA related |
| `infrastructure` | yellow | Docker, CI/CD, tooling |
| `domain` | red | Business logic and domain core |
| `agentic` | purple | AI agent and event system |

## Current Board State

### Backlog
- #6 feat: Filter contributors by house on contributors page [`backend`, `frontend`] — adds a house filter dropdown to `/contributors` + `GET /contributors?house_id={id}` API query param.
- #8 feat: Dynamic nested navigation menu with admin CRUD management [`backend`, `frontend`, `domain`] — replaces the hardcoded flat nav in `header.tsx` with a DB-backed tree (`menu_items` table, self-referencing FK), adds `GET /menu-items/tree` API, and an admin CRUD page at `/admin/menu`.
- Implement AI agent driving adapter [`agentic`, `backend`]
- Replace in-memory event bus with persistent broker [`agentic`, `infrastructure`]

### Todo
_(none)_

### In Progress
_(none)_

### Review
_(none)_

### Done
- #1 Implement PostgreSQL expense repository [`backend`, `domain`]
- #2 Set up database migrations [`backend`, `infrastructure`]
- #3 Add domain unit tests with fake adapters [`backend`, `domain`]
- Design and implement authentication [`backend`] — AAA framework (all 8 phases)
- #9 Rename project from ControlDeGastos to ControlDeContabilidad [`backend`, `infrastructure`]
- SAT certificate signing + print-sign dialog [`backend`, `frontend`]
- Contribution category catalog [`backend`, `frontend`, `domain`] — migration 008, CRUD API + UI
- Security Folio for receipts [`backend`, `frontend`, `domain`] — migration 009, persistent folios, verification endpoint
- #4 (old) Build React expense management UI [`frontend`] — full CRUD (list, create, edit, delete) with i18n, edit dialog, Pencil icon per row
- #4 Feature: Control de Acceso Vehicular por Casa [`backend`, `frontend`, `domain`] — all 4 phases merged to main via PR #9 (2026-06-12). AccessControls + Vehicles CRUD, auto-evaluation service, pending-sync tracking, HouseDetailPage extensions, migrations 017–019.
- #5 feat: User Administration CRUD page [`backend`, `frontend`, `domain`] — merged via PR #11 (2026-06-13). Full admin page at `/admin/users`: list users, create, change role, change password, delete; user-to-house assignment via `user_houses` join table (migration 021); `GET /houses/{id}/users` on house detail page; all gated by `PermUser*` permissions.
- #7 feat: House report page with QR code [`backend`, `frontend`] — merged via PR #12 (2026-06-14). Report page at `/houses/:id/report` showing all house data (users, access controls, vehicles, contributors with monthly payment history, yearly income summary). Static QR code per house. Vehicle hang tag generator with position picker dialog (3×3 grid, slots 1–9) opening an A4 print page with only the selected slot filled; reference image at `docs/hangtag-slot-order-A4.jpeg`.
