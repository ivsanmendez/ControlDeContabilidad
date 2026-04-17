package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/lib/pq"

	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/casa"
)

// CasaRepo implements casa.Repository.
type CasaRepo struct {
	db *sql.DB
}

func NewCasaRepo(db *sql.DB) *CasaRepo {
	return &CasaRepo{db: db}
}

func (r *CasaRepo) Save(ctx context.Context, c *casa.Casa) error {
	const q = `
		INSERT INTO casas (name, address, notes, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id`

	err := r.db.QueryRowContext(ctx, q,
		c.Name, c.Address, c.Notes, c.CreatedAt, c.UpdatedAt,
	).Scan(&c.ID)
	if err != nil {
		var pqErr *pq.Error
		if errors.As(err, &pqErr) && pqErr.Code == "23505" {
			return casa.ErrDuplicate
		}
		return fmt.Errorf("save casa: %w", err)
	}
	return nil
}

func (r *CasaRepo) Update(ctx context.Context, c *casa.Casa) error {
	const q = `
		UPDATE casas
		SET name = $1, address = $2, notes = $3, updated_at = $4
		WHERE id = $5`

	result, err := r.db.ExecContext(ctx, q, c.Name, c.Address, c.Notes, c.UpdatedAt, c.ID)
	if err != nil {
		var pqErr *pq.Error
		if errors.As(err, &pqErr) && pqErr.Code == "23505" {
			return casa.ErrDuplicate
		}
		return fmt.Errorf("update casa %d: %w", c.ID, err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("update casa %d: %w", c.ID, err)
	}
	if rows == 0 {
		return casa.ErrNotFound
	}
	return nil
}

func (r *CasaRepo) FindByID(ctx context.Context, id int64) (*casa.Casa, error) {
	const q = `
		SELECT id, name, address, notes, created_at, updated_at
		FROM casas WHERE id = $1`

	var c casa.Casa
	err := r.db.QueryRowContext(ctx, q, id).Scan(
		&c.ID, &c.Name, &c.Address, &c.Notes, &c.CreatedAt, &c.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, casa.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("find casa %d: %w", id, err)
	}
	return &c, nil
}

func (r *CasaRepo) FindDetailedByID(ctx context.Context, id int64) (*casa.CasaDetail, error) {
	c, err := r.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	const q = `
		SELECT id, name, house_number, phone
		FROM contributors
		WHERE casa_id = $1
		ORDER BY house_number`

	rows, err := r.db.QueryContext(ctx, q, id)
	if err != nil {
		return nil, fmt.Errorf("list contributors for casa %d: %w", id, err)
	}
	defer rows.Close()

	var contributors []casa.ContributorSummary
	for rows.Next() {
		var cs casa.ContributorSummary
		if err := rows.Scan(&cs.ID, &cs.Name, &cs.HouseNumber, &cs.Phone); err != nil {
			return nil, fmt.Errorf("scan contributor summary: %w", err)
		}
		contributors = append(contributors, cs)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("list contributors for casa %d: %w", id, err)
	}

	return &casa.CasaDetail{
		Casa:         *c,
		Contributors: contributors,
	}, nil
}

func (r *CasaRepo) FindAll(ctx context.Context) ([]casa.Casa, error) {
	const q = `
		SELECT id, name, address, notes, created_at, updated_at
		FROM casas
		ORDER BY name`

	rows, err := r.db.QueryContext(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("list casas: %w", err)
	}
	defer rows.Close()

	var casas []casa.Casa
	for rows.Next() {
		var c casa.Casa
		if err := rows.Scan(
			&c.ID, &c.Name, &c.Address, &c.Notes, &c.CreatedAt, &c.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan casa: %w", err)
		}
		casas = append(casas, c)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("list casas: %w", err)
	}
	return casas, nil
}

func (r *CasaRepo) Delete(ctx context.Context, id int64) error {
	const q = `DELETE FROM casas WHERE id = $1`

	result, err := r.db.ExecContext(ctx, q, id)
	if err != nil {
		return fmt.Errorf("delete casa %d: %w", id, err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("delete casa %d: %w", id, err)
	}
	if rows == 0 {
		return casa.ErrNotFound
	}
	return nil
}

func (r *CasaRepo) AssignContributor(ctx context.Context, casaID, contributorID int64) error {
	const q = `UPDATE contributors SET casa_id = $1, updated_at = NOW() WHERE id = $2`

	result, err := r.db.ExecContext(ctx, q, casaID, contributorID)
	if err != nil {
		return fmt.Errorf("assign contributor %d to casa %d: %w", contributorID, casaID, err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("assign contributor: %w", err)
	}
	if rows == 0 {
		return casa.ErrContributorNotFound
	}
	return nil
}

func (r *CasaRepo) UnassignContributor(ctx context.Context, contributorID int64) error {
	const q = `UPDATE contributors SET casa_id = NULL, updated_at = NOW() WHERE id = $1`

	result, err := r.db.ExecContext(ctx, q, contributorID)
	if err != nil {
		return fmt.Errorf("unassign contributor %d: %w", contributorID, err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("unassign contributor: %w", err)
	}
	if rows == 0 {
		return casa.ErrContributorNotFound
	}
	return nil
}