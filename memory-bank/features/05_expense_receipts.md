# Per-Expense Receipts with SAT Digital Signing

## Scope
Generate a digitally signed receipt for each individual expense, reusing the existing receipt infrastructure (folio counter, certsigner, receipt domain). Each expense row in the table has a receipt icon that opens a standalone receipt page with sign & print workflow.

## Architecture
Extended `receipt_folios` table (migration 013) to support both contribution and expense receipts via:
- `receipt_type` column (`'contribution'` or `'expense'`)
- `expense_id` nullable FK (set for expense receipts)
- `contributor_id` made nullable (NULL for expense receipts)
- CHECK constraint enforcing mutual exclusivity

Folio sequence is shared globally — both receipt types draw from `receipt_folio_counters`.

## API

### `POST /expenses/{id}/receipt-signature`
**Auth**: Bearer JWT + `expense:read_own` permission

**Request:**
```json
{
  "password": "sat-certificate-password",
  "signer_name": "Juan Perez"
}
```

**Response (200):**
```json
{
  "folio": "REC-2026-000001-A3F7B2C1",
  "data": {
    "folio": "REC-2026-000001-A3F7B2C1",
    "expense_id": 42,
    "description": "Office supplies",
    "category_name": "Materiales",
    "amount": 350.00,
    "date": "2026-03-15",
    "signer_name": "Juan Perez",
    "generated_at": "2026-03-17T12:00:00Z"
  },
  "signature": "<base64>",
  "certificate": "<base64>"
}
```

### `GET /expenses/{id}`
Updated to return `ExpenseDetail` (includes `CategoryName`) instead of plain `Expense`.

### `GET /receipts/verify/{folio}`
Updated response includes `receipt_type` and `expense_id` fields.

## Frontend
- **Route**: `/expenses/:id/receipt` (outside `AppLayout`, inside `ProtectedRoute`)
- **Receipt page**: expense detail card (description, category, date, amount), signature area, QR code
- **Sign dialog**: signer name + SAT certificate password, same pattern as contribution receipt
- **Expense table**: `FileText` icon per row linking to receipt page
- **Vite proxy**: `/expenses` has `bypass` for `text/html` to support browser navigation

## Files Changed
| Layer | File | Change |
|-------|------|--------|
| DB | `013_add_expense_receipts.sql` | New migration |
| Domain | `receipt/receipt.go` | `ReceiptType`, `ExpenseID`, nullable `ContributorID` |
| Adapter | `receipt_folio_repo.go` | Nullable columns handling |
| Domain | `expense/service.go` | `FindDetailedByID` repo method, `GetExpenseDetail` |
| Adapter | `expense_repo.go` | `FindDetailedByID` implementation |
| Port | `inbound.go` | `GetExpenseDetail` on `ExpenseService` |
| Adapter | `expense_handler.go` | `GetByID` → `GetExpenseDetail` |
| Adapter | `receipt_handler.go` | `ExpenseReceiptSignature`, updated existing methods |
| Adapter | `router.go` | New route, wired `expenseSvc` |
| i18n | `messages_{es,en}.go` | 2 new error keys |
| Tests | `service_test.go` | 3 new `GetExpenseDetail` tests |
| Frontend | Multiple files | Types, hooks, dialog, page, routing, table, i18n |
