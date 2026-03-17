package expense

import (
	"errors"
	"time"
)

var (
	ErrNotFound          = errors.New("expense not found")
	ErrInvalidAmount     = errors.New("amount must be positive")
	ErrEmptyDescription  = errors.New("description cannot be empty")
	ErrInvalidUserID     = errors.New("user ID must be positive")
	ErrInvalidCategoryID = errors.New("category ID must be positive")
	ErrForbidden         = errors.New("access denied")
)

type Expense struct {
	ID          int64
	UserID      int64
	Description string
	Amount      float64
	CategoryID  int64
	Date        time.Time
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// ExpenseDetail includes denormalized category name for list views.
type ExpenseDetail struct {
	ID           int64
	UserID       int64
	Description  string
	Amount       float64
	CategoryID   int64
	CategoryName string
	Date         time.Time
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

const (
	DefaultPageSize = 20
	MaxPageSize     = 100
)

// ListParams holds pagination and filtering options for listing expenses.
type ListParams struct {
	DateFrom   *time.Time
	DateTo     *time.Time
	CategoryID *int64
	Search     string
	Page       int
	PageSize   int
}

// Normalize sets defaults and clamps values.
func (p *ListParams) Normalize() {
	if p.Page < 1 {
		p.Page = 1
	}
	if p.PageSize < 1 {
		p.PageSize = DefaultPageSize
	}
	if p.PageSize > MaxPageSize {
		p.PageSize = MaxPageSize
	}
}

// PaginatedResult wraps a page of expense details with total count.
type PaginatedResult struct {
	Items    []ExpenseDetail `json:"items"`
	Total    int             `json:"total"`
	Page     int             `json:"page"`
	PageSize int             `json:"page_size"`
}

// New creates an Expense enforcing domain invariants.
func New(userID int64, description string, amount float64, categoryID int64, date time.Time) (*Expense, error) {
	if userID <= 0 {
		return nil, ErrInvalidUserID
	}
	if description == "" {
		return nil, ErrEmptyDescription
	}
	if amount <= 0 {
		return nil, ErrInvalidAmount
	}
	if categoryID <= 0 {
		return nil, ErrInvalidCategoryID
	}
	now := time.Now()
	return &Expense{
		UserID:      userID,
		Description: description,
		Amount:      amount,
		CategoryID:  categoryID,
		Date:        date,
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
}