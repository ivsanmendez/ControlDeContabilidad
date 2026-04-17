package casa

import (
	"errors"
	"time"
)

var (
	ErrNotFound              = errors.New("casa not found")
	ErrDuplicate             = errors.New("casa with this name already exists")
	ErrEmptyName             = errors.New("name cannot be empty")
	ErrHasAccessControls     = errors.New("casa has access controls assigned")
	ErrContributorNotFound   = errors.New("contributor not found")
	ErrContributorHasCasa    = errors.New("contributor is already assigned to a casa")
)

type Casa struct {
	ID        int64
	Name      string
	Address   string
	Notes     string
	CreatedAt time.Time
	UpdatedAt time.Time
}

// ContributorSummary is a lightweight view of a contributor for casa detail.
type ContributorSummary struct {
	ID          int64
	Name        string
	HouseNumber string
	Phone       string
}

// CasaDetail includes the contributors assigned to this casa.
type CasaDetail struct {
	Casa
	Contributors []ContributorSummary
}

// New creates a Casa enforcing domain invariants.
func New(name, address, notes string) (*Casa, error) {
	if name == "" {
		return nil, ErrEmptyName
	}
	now := time.Now()
	return &Casa{
		Name:      name,
		Address:   address,
		Notes:     notes,
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}