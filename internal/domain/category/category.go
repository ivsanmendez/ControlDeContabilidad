package category

import (
	"errors"
	"time"
)

var (
	ErrNotFound      = errors.New("category not found")
	ErrDuplicate     = errors.New("category name already exists")
	ErrEmptyName     = errors.New("category name must not be empty")
	ErrInvalidUserID = errors.New("user ID must be positive")
)

// Category represents a contribution category (e.g. "Cuota mensual", "Vigilancia").
type Category struct {
	ID          int64
	Name        string
	Description string
	IsActive    bool
	UserID      int64
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// New creates a Category enforcing domain invariants.
func New(userID int64, name, description string) (*Category, error) {
	if userID <= 0 {
		return nil, ErrInvalidUserID
	}
	if name == "" {
		return nil, ErrEmptyName
	}

	now := time.Now()
	return &Category{
		Name:        name,
		Description: description,
		IsActive:    true,
		UserID:      userID,
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
}
