package report

import "errors"

// ErrInvalidYear is returned when the requested year is out of range.
var ErrInvalidYear = errors.New("invalid year")

// MonthAggregate is a raw aggregation row from the database.
type MonthAggregate struct {
	Month  int
	Amount float64
}

// MonthSummary is a computed row for one month.
type MonthSummary struct {
	Month             int     `json:"month"`
	Income            float64 `json:"income"`
	Expenses          float64 `json:"expenses"`
	Balance           float64 `json:"balance"`
	CumulativeBalance float64 `json:"cumulative_balance"`
}

// MonthlyBalanceReport is the full yearly report.
type MonthlyBalanceReport struct {
	Year          int            `json:"year"`
	Months        []MonthSummary `json:"months"`
	TotalIncome   float64        `json:"total_income"`
	TotalExpenses float64        `json:"total_expenses"`
	TotalBalance  float64        `json:"total_balance"`
}
