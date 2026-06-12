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
- #5 feat: User Administration CRUD page [`backend`, `frontend`, `domain`] — admin-only page at `/admin/users` to list users, change roles, reset passwords, and delete accounts. Currently role promotion requires direct SQL.
- #6 feat: Filter contributors by house on contributors page [`backend`, `frontend`] — adds a house filter dropdown to `/contributors` + `GET /contributors?house_id={id}` API query param.
- #7 feat: House report page with shareable QR access link [`backend`, `frontend`, `domain`] — depends on #6. Generates a detailed report page per house (contributors, contributions, balance) with a printable QR code that links to the protected URL `/houses/{id}/report`.
- #8 feat: Dynamic nested navigation menu with admin CRUD management [`backend`, `frontend`, `domain`] — replaces the hardcoded flat nav in `header.tsx` with a DB-backed tree (`menu_items` table, self-referencing FK), adds `GET /menu-items/tree` API, and an admin CRUD page at `/admin/menu`.
- Implement AI agent driving adapter [`agentic`, `backend`]
- Replace in-memory event bus with persistent broker [`agentic`, `infrastructure`]

### Todo
_(none)_

### In Progress
_(none)_

### Review
- #4 Feature: Control de Acceso Vehicular por Casa [`backend`, `frontend`, `domain`] — all 4 phases implemented (AccessControls entity + CRUD, Vehicles entity + CRUD, AutoEvaluation service, pending-sync tracking, HouseDetailPage extensions, migrations 017–019). Awaiting PR and testing pass.

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
