package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/receipt"
)

// ReceiptFolioRepo implements receipt.Repository.
type ReceiptFolioRepo struct {
	db *sql.DB
}

func NewReceiptFolioRepo(db *sql.DB) *ReceiptFolioRepo {
	return &ReceiptFolioRepo{db: db}
}

// NextSequence atomically increments and returns the next folio sequence for the given year.
func (r *ReceiptFolioRepo) NextSequence(ctx context.Context, year int) (int, error) {
	const q = `
		INSERT INTO receipt_folio_counters (year, last_seq)
		VALUES ($1, 1)
		ON CONFLICT (year) DO UPDATE SET last_seq = receipt_folio_counters.last_seq + 1
		RETURNING last_seq`

	var seq int
	if err := r.db.QueryRowContext(ctx, q, year).Scan(&seq); err != nil {
		return 0, fmt.Errorf("next folio sequence for year %d: %w", year, err)
	}
	return seq, nil
}

// Save inserts a new receipt folio record.
func (r *ReceiptFolioRepo) Save(ctx context.Context, rf *receipt.ReceiptFolio) error {
	const q = `
		INSERT INTO receipt_folios (folio, year_issued, seq_number, uuid_suffix, contributor_id, receipt_year, signer_name, user_id, canonical_json, signature, certificate, signed_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id`

	err := r.db.QueryRowContext(ctx, q,
		rf.Folio,
		rf.YearIssued,
		rf.SeqNumber,
		rf.UUIDSuffix,
		rf.ContributorID,
		rf.ReceiptYear,
		rf.SignerName,
		rf.UserID,
		rf.CanonicalJSON,
		rf.Signature,
		rf.Certificate,
		rf.SignedAt,
	).Scan(&rf.ID)
	if err != nil {
		return fmt.Errorf("save receipt folio: %w", err)
	}
	return nil
}

// FindByFolio looks up a receipt folio by its unique folio string.
func (r *ReceiptFolioRepo) FindByFolio(ctx context.Context, folio string) (*receipt.ReceiptFolio, error) {
	const q = `
		SELECT id, folio, year_issued, seq_number, uuid_suffix, contributor_id, receipt_year, signer_name, user_id, canonical_json, signature, certificate, signed_at
		FROM receipt_folios
		WHERE folio = $1`

	rf, err := r.scanOne(ctx, q, folio)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, receipt.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("find receipt folio %s: %w", folio, err)
	}
	return rf, nil
}

func (r *ReceiptFolioRepo) scanOne(ctx context.Context, query string, args ...any) (*receipt.ReceiptFolio, error) {
	var rf receipt.ReceiptFolio
	err := r.db.QueryRowContext(ctx, query, args...).Scan(
		&rf.ID,
		&rf.Folio,
		&rf.YearIssued,
		&rf.SeqNumber,
		&rf.UUIDSuffix,
		&rf.ContributorID,
		&rf.ReceiptYear,
		&rf.SignerName,
		&rf.UserID,
		&rf.CanonicalJSON,
		&rf.Signature,
		&rf.Certificate,
		&rf.SignedAt,
	)
	if err != nil {
		return nil, err
	}
	return &rf, nil
}
