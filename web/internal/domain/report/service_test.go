package report_test

import (
	"context"
	"errors"
	"testing"

	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/report"
)

type fakeRepo struct {
	income   []report.MonthAggregate
	expenses []report.MonthAggregate
	err      error
}

func (r *fakeRepo) AggregateIncomeByMonth(_ context.Context, _ int) ([]report.MonthAggregate, error) {
	if r.err != nil {
		return nil, r.err
	}
	return r.income, nil
}

func (r *fakeRepo) AggregateExpensesByMonth(_ context.Context, _ int) ([]report.MonthAggregate, error) {
	if r.err != nil {
		return nil, r.err
	}
	return r.expenses, nil
}

func TestGetMonthlyBalance_InvalidYear(t *testing.T) {
	svc := report.NewService(&fakeRepo{})
	_, err := svc.GetMonthlyBalance(context.Background(), 1999)
	if !errors.Is(err, report.ErrInvalidYear) {
		t.Fatalf("expected ErrInvalidYear, got %v", err)
	}
}

func TestGetMonthlyBalance_EmptyYear(t *testing.T) {
	svc := report.NewService(&fakeRepo{})
	rpt, err := svc.GetMonthlyBalance(context.Background(), 2026)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(rpt.Months) != 12 {
		t.Fatalf("expected 12 months, got %d", len(rpt.Months))
	}
	if rpt.TotalIncome != 0 || rpt.TotalExpenses != 0 || rpt.TotalBalance != 0 {
		t.Fatalf("expected zero totals for empty year")
	}
}

func TestGetMonthlyBalance_Computation(t *testing.T) {
	repo := &fakeRepo{
		income: []report.MonthAggregate{
			{Month: 1, Amount: 1000},
			{Month: 3, Amount: 2000},
		},
		expenses: []report.MonthAggregate{
			{Month: 1, Amount: 300},
			{Month: 2, Amount: 500},
		},
	}
	svc := report.NewService(repo)
	rpt, err := svc.GetMonthlyBalance(context.Background(), 2026)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Month 1: income=1000, expenses=300, balance=700, cumulative=700
	m1 := rpt.Months[0]
	if m1.Income != 1000 || m1.Expenses != 300 || m1.Balance != 700 || m1.CumulativeBalance != 700 {
		t.Fatalf("month 1 mismatch: %+v", m1)
	}

	// Month 2: income=0, expenses=500, balance=-500, cumulative=200
	m2 := rpt.Months[1]
	if m2.Income != 0 || m2.Expenses != 500 || m2.Balance != -500 || m2.CumulativeBalance != 200 {
		t.Fatalf("month 2 mismatch: %+v", m2)
	}

	// Month 3: income=2000, expenses=0, balance=2000, cumulative=2200
	m3 := rpt.Months[2]
	if m3.Income != 2000 || m3.Expenses != 0 || m3.Balance != 2000 || m3.CumulativeBalance != 2200 {
		t.Fatalf("month 3 mismatch: %+v", m3)
	}

	// Totals
	if rpt.TotalIncome != 3000 {
		t.Fatalf("expected total income 3000, got %f", rpt.TotalIncome)
	}
	if rpt.TotalExpenses != 800 {
		t.Fatalf("expected total expenses 800, got %f", rpt.TotalExpenses)
	}
	if rpt.TotalBalance != 2200 {
		t.Fatalf("expected total balance 2200, got %f", rpt.TotalBalance)
	}
}

func TestGetMonthlyBalance_RepoError(t *testing.T) {
	repo := &fakeRepo{err: errors.New("db down")}
	svc := report.NewService(repo)
	_, err := svc.GetMonthlyBalance(context.Background(), 2026)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
}
