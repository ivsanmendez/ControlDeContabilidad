package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/expense"
)

// ExpenseRepo implements expense.Repository.
type ExpenseRepo struct {
	db *sql.DB
}

func NewExpenseRepo(db *sql.DB) *ExpenseRepo {
	return &ExpenseRepo{db: db}
}

func (r *ExpenseRepo) Save(ctx context.Context, e *expense.Expense) error {
	const q = `
		INSERT INTO expenses (user_id, description, amount, category_id, date, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id`

	return r.db.QueryRowContext(ctx, q,
		e.UserID,
		e.Description,
		e.Amount,
		e.CategoryID,
		e.Date,
		e.CreatedAt,
		e.UpdatedAt,
	).Scan(&e.ID)
}

func (r *ExpenseRepo) Update(ctx context.Context, e *expense.Expense) error {
	const q = `
		UPDATE expenses
		SET description = $1, amount = $2, category_id = $3, date = $4, updated_at = $5
		WHERE id = $6`

	result, err := r.db.ExecContext(ctx, q,
		e.Description,
		e.Amount,
		e.CategoryID,
		e.Date,
		e.UpdatedAt,
		e.ID,
	)
	if err != nil {
		return fmt.Errorf("update expense %d: %w", e.ID, err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("update expense %d: %w", e.ID, err)
	}
	if rows == 0 {
		return expense.ErrNotFound
	}
	return nil
}

func (r *ExpenseRepo) FindByID(ctx context.Context, id int64) (*expense.Expense, error) {
	const q = `
		SELECT id, user_id, description, amount, category_id, date, created_at, updated_at
		FROM expenses
		WHERE id = $1`

	var e expense.Expense
	err := r.db.QueryRowContext(ctx, q, id).Scan(
		&e.ID,
		&e.UserID,
		&e.Description,
		&e.Amount,
		&e.CategoryID,
		&e.Date,
		&e.CreatedAt,
		&e.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, expense.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("find expense %d: %w", id, err)
	}
	return &e, nil
}

func (r *ExpenseRepo) FindAll(ctx context.Context) ([]expense.Expense, error) {
	const q = `
		SELECT id, user_id, description, amount, category_id, date, created_at, updated_at
		FROM expenses
		ORDER BY date DESC, created_at DESC`

	return r.scanExpenses(ctx, q)
}

func (r *ExpenseRepo) FindAllByUser(ctx context.Context, userID int64) ([]expense.Expense, error) {
	const q = `
		SELECT id, user_id, description, amount, category_id, date, created_at, updated_at
		FROM expenses
		WHERE user_id = $1
		ORDER BY date DESC, created_at DESC`

	return r.scanExpenses(ctx, q, userID)
}

const expenseDetailSelect = `
	SELECT e.id, e.user_id, e.description, e.amount, e.category_id, ec.name, e.date, e.created_at, e.updated_at
	FROM expenses e
	JOIN expense_categories ec ON ec.id = e.category_id`

func (r *ExpenseRepo) FindDetailedByID(ctx context.Context, id int64) (*expense.ExpenseDetail, error) {
	q := expenseDetailSelect + ` WHERE e.id = $1`
	var d expense.ExpenseDetail
	err := r.db.QueryRowContext(ctx, q, id).Scan(
		&d.ID, &d.UserID, &d.Description, &d.Amount, &d.CategoryID, &d.CategoryName, &d.Date, &d.CreatedAt, &d.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, expense.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("find expense detail %d: %w", id, err)
	}
	return &d, nil
}

func (r *ExpenseRepo) FindAllDetailed(ctx context.Context) ([]expense.ExpenseDetail, error) {
	q := expenseDetailSelect + ` ORDER BY e.date DESC, e.created_at DESC`
	return r.scanDetails(ctx, q)
}

func (r *ExpenseRepo) FindAllDetailedByUser(ctx context.Context, userID int64) ([]expense.ExpenseDetail, error) {
	q := expenseDetailSelect + ` WHERE e.user_id = $1 ORDER BY e.date DESC, e.created_at DESC`
	return r.scanDetails(ctx, q, userID)
}

func (r *ExpenseRepo) FindDetailedPaginated(ctx context.Context, userID *int64, params expense.ListParams) (*expense.PaginatedResult, error) {
	var where []string
	var args []any
	n := 1

	if userID != nil {
		where = append(where, fmt.Sprintf("e.user_id = $%d", n))
		args = append(args, *userID)
		n++
	}
	if params.DateFrom != nil {
		where = append(where, fmt.Sprintf("e.date >= $%d", n))
		args = append(args, *params.DateFrom)
		n++
	}
	if params.DateTo != nil {
		where = append(where, fmt.Sprintf("e.date <= $%d", n))
		args = append(args, *params.DateTo)
		n++
	}
	if params.CategoryID != nil {
		where = append(where, fmt.Sprintf("e.category_id = $%d", n))
		args = append(args, *params.CategoryID)
		n++
	}
	if params.Search != "" {
		where = append(where, fmt.Sprintf("e.description ILIKE $%d", n))
		args = append(args, "%"+params.Search+"%")
		n++
	}

	whereClause := ""
	if len(where) > 0 {
		whereClause = " WHERE " + strings.Join(where, " AND ")
	}

	// Count total matching rows.
	countQ := "SELECT COUNT(*) FROM expenses e" + whereClause
	var total int
	if err := r.db.QueryRowContext(ctx, countQ, args...).Scan(&total); err != nil {
		return nil, fmt.Errorf("count expenses: %w", err)
	}

	// Fetch page of detailed rows.
	offset := (params.Page - 1) * params.PageSize
	dataQ := expenseDetailSelect + whereClause +
		fmt.Sprintf(" ORDER BY e.date DESC, e.created_at DESC LIMIT $%d OFFSET $%d", n, n+1)
	dataArgs := append(args, params.PageSize, offset)

	items, err := r.scanDetails(ctx, dataQ, dataArgs...)
	if err != nil {
		return nil, err
	}
	if items == nil {
		items = []expense.ExpenseDetail{}
	}

	return &expense.PaginatedResult{
		Items:    items,
		Total:    total,
		Page:     params.Page,
		PageSize: params.PageSize,
	}, nil
}

func (r *ExpenseRepo) scanExpenses(ctx context.Context, query string, args ...any) ([]expense.Expense, error) {
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list expenses: %w", err)
	}
	defer rows.Close()

	var expenses []expense.Expense
	for rows.Next() {
		var e expense.Expense
		if err := rows.Scan(
			&e.ID,
			&e.UserID,
			&e.Description,
			&e.Amount,
			&e.CategoryID,
			&e.Date,
			&e.CreatedAt,
			&e.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan expense: %w", err)
		}
		expenses = append(expenses, e)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("list expenses: %w", err)
	}
	return expenses, nil
}

func (r *ExpenseRepo) scanDetails(ctx context.Context, query string, args ...any) ([]expense.ExpenseDetail, error) {
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list expense details: %w", err)
	}
	defer rows.Close()

	var details []expense.ExpenseDetail
	for rows.Next() {
		var d expense.ExpenseDetail
		if err := rows.Scan(
			&d.ID,
			&d.UserID,
			&d.Description,
			&d.Amount,
			&d.CategoryID,
			&d.CategoryName,
			&d.Date,
			&d.CreatedAt,
			&d.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan expense detail: %w", err)
		}
		details = append(details, d)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("list expense details: %w", err)
	}
	return details, nil
}

func (r *ExpenseRepo) Delete(ctx context.Context, id int64) error {
	const q = `DELETE FROM expenses WHERE id = $1`

	result, err := r.db.ExecContext(ctx, q, id)
	if err != nil {
		return fmt.Errorf("delete expense %d: %w", id, err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("delete expense %d: %w", id, err)
	}
	if rows == 0 {
		return expense.ErrNotFound
	}

	return nil
}
