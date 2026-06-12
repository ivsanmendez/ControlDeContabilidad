package vehicle

import (
	"errors"
	"time"
)

var (
	ErrNotFound                    = errors.New("vehicle not found")
	ErrDuplicate                   = errors.New("vehicle with this plate already exists for this house")
	ErrEmptyPlate                  = errors.New("plate cannot be empty")
	ErrEmptyColor                  = errors.New("color cannot be empty")
	ErrAccessControlAlreadyAssigned = errors.New("access control already assigned to this vehicle")
	ErrAccessControlNotAssigned     = errors.New("access control not assigned to this vehicle")
)

type Vehicle struct {
	ID             int64
	HouseID        int64
	Plate          string
	Color          string
	Brand          string
	Model          string
	Notes          string
	CreatedAt      time.Time
	UpdatedAt      time.Time
	AccessControls []VehicleAccessControlEntry
}

type VehicleAccessControlEntry struct {
	AccessControlID int64
	Code            string
	AdminNumber     string
	AssignedAt      time.Time
}

func New(houseID int64, plate, color, brand, model, notes string) (*Vehicle, error) {
	if plate == "" {
		return nil, ErrEmptyPlate
	}
	if color == "" {
		return nil, ErrEmptyColor
	}
	now := time.Now()
	return &Vehicle{
		HouseID:   houseID,
		Plate:     plate,
		Color:     color,
		Brand:     brand,
		Model:     model,
		Notes:     notes,
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}