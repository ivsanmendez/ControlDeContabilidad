package report

import "context"

// Repository is the outbound port for report aggregation queries.
type Repository interface {
	AggregateIncomeByMonth(ctx context.Context, year int) ([]MonthAggregate, error)
	AggregateExpensesByMonth(ctx context.Context, year int) ([]MonthAggregate, error)
}

// Service orchestrates report use cases.
type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetMonthlyBalance(ctx context.Context, year int) (*MonthlyBalanceReport, error) {
	if year < 2000 {
		return nil, ErrInvalidYear
	}

	income, err := s.repo.AggregateIncomeByMonth(ctx, year)
	if err != nil {
		return nil, err
	}

	expenses, err := s.repo.AggregateExpensesByMonth(ctx, year)
	if err != nil {
		return nil, err
	}

	incomeMap := make(map[int]float64, len(income))
	for _, a := range income {
		incomeMap[a.Month] = a.Amount
	}

	expenseMap := make(map[int]float64, len(expenses))
	for _, a := range expenses {
		expenseMap[a.Month] = a.Amount
	}

	rpt := &MonthlyBalanceReport{
		Year:   year,
		Months: make([]MonthSummary, 0, 12),
	}

	var cumulative float64
	for m := 1; m <= 12; m++ {
		inc := incomeMap[m]
		exp := expenseMap[m]
		bal := inc - exp
		cumulative += bal

		rpt.Months = append(rpt.Months, MonthSummary{
			Month:             m,
			Income:            inc,
			Expenses:          exp,
			Balance:           bal,
			CumulativeBalance: cumulative,
		})

		rpt.TotalIncome += inc
		rpt.TotalExpenses += exp
	}
	rpt.TotalBalance = rpt.TotalIncome - rpt.TotalExpenses

	return rpt, nil
}
