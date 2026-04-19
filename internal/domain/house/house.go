package house

import (
	"errors"
	"time"
)

var (
	ErrNotFound            = errors.New("house not found")
	ErrDuplicate           = errors.New("house with this name already exists")
	ErrEmptyName           = errors.New("name cannot be empty")
	ErrHasAccessControls   = errors.New("house has access controls assigned")
	ErrContributorNotFound = errors.New("contributor not found")
)

type House struct {
	ID        int64
	Name      string
	Address   string
	Notes     string
	CreatedAt time.Time
	UpdatedAt time.Time
}

// ContributorSummary is a lightweight view of a contributor for house detail.
type ContributorSummary struct {
	ID          int64
	Name        string
	HouseNumber string
	Phone       string
}

// HouseDetail includes the contributors assigned to this house.
type HouseDetail struct {
	House
	Contributors []ContributorSummary
}

// New creates a House enforcing domain invariants.
func New(name, address, notes string) (*House, error) {
	if name == "" {
		return nil, ErrEmptyName
	}
	now := time.Now()
	return &House{
		Name:      name,
		Address:   address,
		Notes:     notes,
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}