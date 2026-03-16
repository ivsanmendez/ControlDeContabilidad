# Feature: Contribution Category Catalog

## Scope
Add a contribution category catalog (e.g., "Cuota mensual", "Vigilancia", "Mantenimiento") so the same contributor can have multiple contributions per month — one per category concept.

## Acceptance Criteria
- CRUD API for contribution categories (`POST/GET/PUT/DELETE /contribution-categories`)
- Category fields: id, name (unique), description, is_active, user_id, created_at, updated_at
- `category_id` FK added to `contributions` table
- Unique constraint changed from `(contributor_id, month, year)` to `(contributor_id, category_id, month, year)`
- Existing contributions backfilled to a "General" default category via migration 008
- Dedicated frontend page at `/contribution-categories` with full CRUD
- Contribution form includes category selector (active categories only)
- Contribution table shows category column
- Receipt page shows multiple entries per month cell (one per category)
- Receipt signature includes `category_name` per payment
- Deleting a category referenced by contributions returns a friendly FK error
- Permissions: `category:create/read/update/delete` for both user and admin roles

## Database Changes
```sql
-- New table
contribution_categories (id, name UNIQUE, description, is_active, user_id FK, created_at, updated_at)

-- Modified table: contributions
-- Added: category_id BIGINT NOT NULL FK → contribution_categories(id)
-- Dropped: UNIQUE (contributor_id, month, year)
-- Added: UNIQUE (contributor_id, category_id, month, year)
-- Added: idx_contributions_category
```

## Architecture
Follows the same hexagonal pattern as contributors:
- `internal/domain/category/` — entity, factory, repository interface, service
- `internal/adapter/postgres/category_repo.go` — SQL CRUD
- `internal/adapter/httpapi/category_handler.go` — HTTP handlers
- `internal/port/inbound.go` — `CategoryService` driving port
- `internal/port/outbound.go` — `CategoryRepository` type alias

## API Endpoints
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/contribution-categories` | `category:create` | Create a category |
| GET | `/contribution-categories` | `category:read` | List all categories |
| GET | `/contribution-categories/{id}` | `category:read` | Get one category |
| PUT | `/contribution-categories/{id}` | `category:update` | Update a category |
| DELETE | `/contribution-categories/{id}` | `category:delete` | Delete a category |

## Frontend
- Types: `web/src/types/category.ts`
- Hooks: `web/src/hooks/use-categories.ts`
- Page: `web/src/pages/contribution-categories-page.tsx`
- Components: `web/src/components/categories/` (form, table, empty)
- i18n: `web/src/locales/{es,en}/categories.json`
- Updated: contribution form (category selector), contribution table (category column), receipt page (multi-category months)