package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/lib/pq"

	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/category"
)

// CategoryRepo implements category.Repository.
type CategoryRepo struct {
	db *sql.DB
}

func NewCategoryRepo(db *sql.DB) *CategoryRepo {
	return &CategoryRepo{db: db}
}

func (r *CategoryRepo) Save(ctx context.Context, c *category.Category) error {
	const q = `
		INSERT INTO contribution_categories (name, description, is_active, user_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id`

	err := r.db.QueryRowContext(ctx, q,
		c.Name,
		c.Description,
		c.IsActive,
		c.UserID,
		c.CreatedAt,
		c.UpdatedAt,
	).Scan(&c.ID)
	if err != nil {
		var pqErr *pq.Error
		if errors.As(err, &pqErr) && pqErr.Code == "23505" {
			return category.ErrDuplicate
		}
		return fmt.Errorf("save category: %w", err)
	}
	return nil
}

func (r *CategoryRepo) FindByID(ctx context.Context, id int64) (*category.Category, error) {
	const q = `
		SELECT id, name, description, is_active, user_id, created_at, updated_at
		FROM contribution_categories
		WHERE id = $1`

	c, err := r.scanOne(ctx, q, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, category.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("find category %d: %w", id, err)
	}
	return c, nil
}

func (r *CategoryRepo) FindAll(ctx context.Context) ([]category.Category, error) {
	const q = `
		SELECT id, name, description, is_active, user_id, created_at, updated_at
		FROM contribution_categories
		ORDER BY name`

	return r.scanMany(ctx, q)
}

func (r *CategoryRepo) FindActive(ctx context.Context) ([]category.Category, error) {
	const q = `
		SELECT id, name, description, is_active, user_id, created_at, updated_at
		FROM contribution_categories
		WHERE is_active = TRUE
		ORDER BY name`

	return r.scanMany(ctx, q)
}

func (r *CategoryRepo) Update(ctx context.Context, c *category.Category) error {
	const q = `
		UPDATE contribution_categories
		SET name = $1, description = $2, is_active = $3, updated_at = $4
		WHERE id = $5`

	result, err := r.db.ExecContext(ctx, q, c.Name, c.Description, c.IsActive, c.UpdatedAt, c.ID)
	if err != nil {
		var pqErr *pq.Error
		if errors.As(err, &pqErr) && pqErr.Code == "23505" {
			return category.ErrDuplicate
		}
		return fmt.Errorf("update category %d: %w", c.ID, err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("update category %d: %w", c.ID, err)
	}
	if rows == 0 {
		return category.ErrNotFound
	}
	return nil
}

func (r *CategoryRepo) Delete(ctx context.Context, id int64) error {
	const q = `DELETE FROM contribution_categories WHERE id = $1`

	result, err := r.db.ExecContext(ctx, q, id)
	if err != nil {
		var pqErr *pq.Error
		if errors.As(err, &pqErr) && pqErr.Code == "23503" {
			return fmt.Errorf("cannot delete: category is referenced by contributions")
		}
		return fmt.Errorf("delete category %d: %w", id, err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("delete category %d: %w", id, err)
	}
	if rows == 0 {
		return category.ErrNotFound
	}
	return nil
}

// --- Scanners ---

func (r *CategoryRepo) scanOne(ctx context.Context, query string, args ...any) (*category.Category, error) {
	var c category.Category
	err := r.db.QueryRowContext(ctx, query, args...).Scan(
		&c.ID,
		&c.Name,
		&c.Description,
		&c.IsActive,
		&c.UserID,
		&c.CreatedAt,
		&c.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *CategoryRepo) scanMany(ctx context.Context, query string, args ...any) ([]category.Category, error) {
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list categories: %w", err)
	}
	defer rows.Close()

	var categories []category.Category
	for rows.Next() {
		var c category.Category
		if err := rows.Scan(
			&c.ID,
			&c.Name,
			&c.Description,
			&c.IsActive,
			&c.UserID,
			&c.CreatedAt,
			&c.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan category: %w", err)
		}
		categories = append(categories, c)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("list categories: %w", err)
	}
	return categories, nil
}
