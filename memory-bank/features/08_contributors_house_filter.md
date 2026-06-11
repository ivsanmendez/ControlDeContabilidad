# Feature 08: Filter Contributors by House

**GitHub Issue**: #6
**Labels**: `backend`, `frontend`
**Status**: Backlog

---

## Scope

### API change
- Extend `GET /contributors` with an optional `?house_id={id}` query parameter
- When `house_id` is provided: return only contributors whose `contributors.house_id` matches
- When omitted: return all contributors (existing behaviour, no regression)

### Postgres adapter
- Update `FindAll` (or add `FindByHouseID`) to accept an optional house ID filter
- Implementation must avoid a second round-trip — a single parameterised query with a conditional `WHERE` clause is preferred

### Frontend (`/contributors`)
- Add a house filter dropdown to `ContributorsPage`
  - Options: "All houses" entry at the top, then one entry per house fetched from `GET /houses`
  - Selected house is reflected in the URL query string (`?house_id=3`) for shareable links
  - A clear/reset button returns the page to the unfiltered state
  - Layout must be usable on mobile (responsive)
- Filter state is managed in the URL, not local component state, so browser back/forward works as expected

---

## Acceptance Criteria

- `GET /contributors?house_id={id}` returns only contributors belonging to that house
- `GET /contributors` (no param) returns all contributors unchanged
- The selected filter is reflected in the URL query string
- The clear button removes `house_id` from the URL
- The page is functional and readable on mobile viewports

---

## Notes

- House list for the dropdown is fetched from the existing `GET /houses` endpoint — no new endpoint needed
- If `house_id` does not match any known house, the endpoint returns an empty list (not a 404)