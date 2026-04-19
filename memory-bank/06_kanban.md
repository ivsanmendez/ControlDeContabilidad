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
- GitHub #4 Feature: Control de Acceso Vehicular por Casa [`backend`, `frontend`, `domain`] — 4 phases: Casa+Contributors, AccessControls, Vehicles, AutoEvaluation
- #6 Implement AI agent driving adapter [`agentic`, `backend`]
- #7 Replace in-memory event bus with persistent broker [`agentic`, `infrastructure`]

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
- #5 Design and implement authentication [`backend`] — AAA framework (all 8 phases)
- #9 Rename project from ControlDeGastos to ControlDeContabilidad [`backend`, `infrastructure`]
- SAT certificate signing + print-sign dialog [`backend`, `frontend`]
- Contribution category catalog [`backend`, `frontend`, `domain`] — migration 008, CRUD API + UI
- Security Folio for receipts [`backend`, `frontend`, `domain`] — migration 009, persistent folios, verification endpoint
- #4 (old) Build React expense management UI [`frontend`] — full CRUD (list, create, edit, delete) with i18n, edit dialog, Pencil icon per row
