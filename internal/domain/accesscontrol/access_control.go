package accesscontrol

import (
	"errors"
	"time"
)

var (
	ErrNotFound        = errors.New("access control not found")
	ErrDuplicate       = errors.New("access control with this admin number already exists")
	ErrMaxPerHouse     = errors.New("house already has the maximum number of access controls (4)")
	ErrEmptyCode       = errors.New("code cannot be empty")
	ErrEmptyAdminNumber = errors.New("admin number cannot be empty")
)

type Status string

const (
	StatusActive   Status = "active"
	StatusWarning  Status = "warning"
	StatusInactive Status = "inactive"
)

type AccessControl struct {
	ID               int64
	HouseID          int64
	Code             string
	AdminNumber      string
	Status           Status
	PhysicalSyncedAt *time.Time
	Notes            string
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

// AccessControlWithHouse bundles an access control with its house name for list views.
type AccessControlWithHouse struct {
	AccessControl
	HouseName string
}

func New(houseID int64, code, adminNumber, notes string) (*AccessControl, error) {
	if code == "" {
		return nil, ErrEmptyCode
	}
	if adminNumber == "" {
		return nil, ErrEmptyAdminNumber
	}
	now := time.Now()
	return &AccessControl{
		HouseID:     houseID,
		Code:        code,
		AdminNumber: adminNumber,
		Status:      StatusActive,
		Notes:       notes,
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
}