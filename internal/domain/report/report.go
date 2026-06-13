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

// ContributorMonthlyPayment is the amount a contributor paid in a given month.
type ContributorMonthlyPayment struct {
	Month  int     `json:"month"`
	Amount float64 `json:"amount"`
}

// ContributorReport contains a contributor's data and their yearly payment history.
type ContributorReport struct {
	ContributorID int64                       `json:"contributor_id"`
	Name          string                      `json:"name"`
	HouseNumber   string                      `json:"house_number"`
	Phone         string                      `json:"phone"`
	CameraAccess  bool                        `json:"camera_access"`
	TotalPaid     float64                     `json:"total_paid"`
	Payments      []ContributorMonthlyPayment `json:"payments"`
}

// HouseMonthSummary is the income total for a house in a given month.
type HouseMonthSummary struct {
	Month  int     `json:"month"`
	Income float64 `json:"income"`
}

// HouseReport is the per-house yearly report.
type HouseReport struct {
	HouseID      int64               `json:"house_id"`
	HouseName    string              `json:"house_name"`
	HouseAddress string              `json:"house_address"`
	Year         int                 `json:"year"`
	Contributors []ContributorReport `json:"contributors"`
	Months       []HouseMonthSummary `json:"months"`
	TotalIncome  float64             `json:"total_income"`
}
