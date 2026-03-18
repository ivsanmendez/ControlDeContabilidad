-- +goose Up

-- Classify existing receipts and support expense receipts
ALTER TABLE receipt_folios ADD COLUMN receipt_type VARCHAR(20) NOT NULL DEFAULT 'contribution';
ALTER TABLE receipt_folios ADD COLUMN expense_id BIGINT REFERENCES expenses(id);

-- contributor_id becomes nullable (expense receipts have no contributor)
ALTER TABLE receipt_folios ALTER COLUMN contributor_id DROP NOT NULL;

-- Ensure contribution receipts have contributor_id and expense receipts have expense_id
ALTER TABLE receipt_folios ADD CONSTRAINT chk_receipt_type_refs CHECK (
    (receipt_type = 'contribution' AND contributor_id IS NOT NULL AND expense_id IS NULL) OR
    (receipt_type = 'expense' AND expense_id IS NOT NULL AND contributor_id IS NULL)
);

CREATE INDEX idx_receipt_folios_expense ON receipt_folios (expense_id) WHERE expense_id IS NOT NULL;

-- +goose Down

DROP INDEX IF EXISTS idx_receipt_folios_expense;
ALTER TABLE receipt_folios DROP CONSTRAINT IF EXISTS chk_receipt_type_refs;
ALTER TABLE receipt_folios ALTER COLUMN contributor_id SET NOT NULL;
ALTER TABLE receipt_folios DROP COLUMN IF EXISTS expense_id;
ALTER TABLE receipt_folios DROP COLUMN IF EXISTS receipt_type;
