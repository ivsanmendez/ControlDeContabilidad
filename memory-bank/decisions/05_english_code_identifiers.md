# ADR-05: English-Only Code Identifiers

**Date**: 2026-04-19
**Status**: Accepted

## Context

The project domain is Mexican real-estate / accounting management. Domain concepts naturally have Spanish names (e.g. "casa", "contribuyente"). Early implementation of the House feature used `casa` as the Go package name and `casas` as the PostgreSQL table name, mixing Spanish identifiers into English-language code.

This caused friction: routes (`/casas`), DB columns (`casa_id`), Go types (`Casa`, `CasaDetail`), TypeScript types, and i18n keys were all in Spanish while the rest of the codebase was in English.

## Decision

**All code identifiers must be in English.** This is a hard rule with no exceptions.

| Layer | Scope |
|-------|-------|
| Go | Package names, struct/type names, function/method names, variable names, error variables, constants |
| TypeScript / React | Interface/type names, component names, hook names, variable names, prop names |
| SQL | Table names, column names, index names, constraint names |
| HTTP | API route paths (`/houses` not `/casas`) |
| i18n | Namespace names and translation **keys** (`house_not_found`, not `casa_no_encontrada`) |

**Exception**: i18n translation *values* (the text shown to users in the UI or API error responses) follow the locale — Spanish values stay in Spanish, English values in English.

## Consequences

- If a real-world concept has a Spanish name, use the English equivalent in all code identifiers.
- Document significant Spanish→English mappings here if non-obvious:
  - `casa` → `house` (the physical property/house entity)
  - `contribuyente` → `contributor` (already correct)
  - `gasto` → `expense` (already correct)
  - `aportación` → `contribution` (already correct)
- The `casa` → `house` rename was applied across the entire `feature/access-control` branch (commit `6cccf8f`), touching 33 files: domain, adapter, handler, port, migrations, and the full React SPA.