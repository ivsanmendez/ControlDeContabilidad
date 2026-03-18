package receipt

import (
	"crypto/rand"
	"errors"
	"fmt"
	"time"
)

var ErrNotFound = errors.New("receipt folio not found")

// Receipt type constants.
const (
	TypeContribution = "contribution"
	TypeExpense      = "expense"
)

// ReceiptFolio represents a persisted signed receipt with its security folio.
type ReceiptFolio struct {
	ID            int64
	Folio         string
	YearIssued    int
	SeqNumber     int
	UUIDSuffix    string
	ReceiptType   string
	ContributorID *int64
	ExpenseID     *int64
	ReceiptYear   int
	SignerName    string
	UserID        int64
	CanonicalJSON []byte
	Signature     []byte
	Certificate   []byte
	SignedAt      time.Time
}

// GenerateFolio formats a folio string: REC-YYYY-NNNNNN-XXXXXXXX
func GenerateFolio(year, seq int, suffix string) string {
	return fmt.Sprintf("REC-%04d-%06d-%s", year, seq, suffix)
}

// GenerateUUIDSuffix produces 8 uppercase hex chars from 4 random bytes.
func GenerateUUIDSuffix() (string, error) {
	b := make([]byte, 4)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("generate uuid suffix: %w", err)
	}
	return fmt.Sprintf("%X", b), nil
}
