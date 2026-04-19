package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/lib/pq"

	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/house"
)

// HouseRepo implements house.Repository.
type HouseRepo struct {
	db *sql.DB
}

func NewHouseRepo(db *sql.DB) *HouseRepo {
	return &HouseRepo{db: db}
}

func (r *HouseRepo) Save(ctx context.Context, h *house.House) error {
	const q = `
		INSERT INTO houses (name, address, notes, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id`

	err := r.db.QueryRowContext(ctx, q,
		h.Name, h.Address, h.Notes, h.CreatedAt, h.UpdatedAt,
	).Scan(&h.ID)
	if err != nil {
		var pqErr *pq.Error
		if errors.As(err, &pqErr) && pqErr.Code == "23505" {
			return house.ErrDuplicate
		}
		return fmt.Errorf("save house: %w", err)
	}
	return nil
}

func (r *HouseRepo) Update(ctx context.Context, h *house.House) error {
	const q = `
		UPDATE houses
		SET name = $1, address = $2, notes = $3, updated_at = $4
		WHERE id = $5`

	result, err := r.db.ExecContext(ctx, q, h.Name, h.Address, h.Notes, h.UpdatedAt, h.ID)
	if err != nil {
		var pqErr *pq.Error
		if errors.As(err, &pqErr) && pqErr.Code == "23505" {
			return house.ErrDuplicate
		}
		return fmt.Errorf("update house %d: %w", h.ID, err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("update house %d: %w", h.ID, err)
	}
	if rows == 0 {
		return house.ErrNotFound
	}
	return nil
}

func (r *HouseRepo) FindByID(ctx context.Context, id int64) (*house.House, error) {
	const q = `
		SELECT id, name, address, notes, created_at, updated_at
		FROM houses WHERE id = $1`

	var h house.House
	err := r.db.QueryRowContext(ctx, q, id).Scan(
		&h.ID, &h.Name, &h.Address, &h.Notes, &h.CreatedAt, &h.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, house.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("find house %d: %w", id, err)
	}
	return &h, nil
}

func (r *HouseRepo) FindDetailedByID(ctx context.Context, id int64) (*house.HouseDetail, error) {
	h, err := r.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	const q = `
		SELECT id, name, house_number, phone
		FROM contributors
		WHERE house_id = $1
		ORDER BY house_number`

	rows, err := r.db.QueryContext(ctx, q, id)
	if err != nil {
		return nil, fmt.Errorf("list contributors for house %d: %w", id, err)
	}
	defer rows.Close()

	var contributors []house.ContributorSummary
	for rows.Next() {
		var cs house.ContributorSummary
		if err := rows.Scan(&cs.ID, &cs.Name, &cs.HouseNumber, &cs.Phone); err != nil {
			return nil, fmt.Errorf("scan contributor summary: %w", err)
		}
		contributors = append(contributors, cs)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("list contributors for house %d: %w", id, err)
	}

	return &house.HouseDetail{
		House:        *h,
		Contributors: contributors,
	}, nil
}

func (r *HouseRepo) FindAll(ctx context.Context) ([]house.House, error) {
	const q = `
		SELECT id, name, address, notes, created_at, updated_at
		FROM houses
		ORDER BY name`

	rows, err := r.db.QueryContext(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("list houses: %w", err)
	}
	defer rows.Close()

	var houses []house.House
	for rows.Next() {
		var h house.House
		if err := rows.Scan(
			&h.ID, &h.Name, &h.Address, &h.Notes, &h.CreatedAt, &h.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan house: %w", err)
		}
		houses = append(houses, h)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("list houses: %w", err)
	}
	return houses, nil
}

func (r *HouseRepo) Delete(ctx context.Context, id int64) error {
	const q = `DELETE FROM houses WHERE id = $1`

	result, err := r.db.ExecContext(ctx, q, id)
	if err != nil {
		return fmt.Errorf("delete house %d: %w", id, err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("delete house %d: %w", id, err)
	}
	if rows == 0 {
		return house.ErrNotFound
	}
	return nil
}

func (r *HouseRepo) AssignContributor(ctx context.Context, houseID, contributorID int64) error {
	const q = `UPDATE contributors SET house_id = $1, updated_at = NOW() WHERE id = $2`

	result, err := r.db.ExecContext(ctx, q, houseID, contributorID)
	if err != nil {
		return fmt.Errorf("assign contributor %d to house %d: %w", contributorID, houseID, err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("assign contributor: %w", err)
	}
	if rows == 0 {
		return house.ErrContributorNotFound
	}
	return nil
}

func (r *HouseRepo) UnassignContributor(ctx context.Context, contributorID int64) error {
	const q = `UPDATE contributors SET house_id = NULL, updated_at = NOW() WHERE id = $1`

	result, err := r.db.ExecContext(ctx, q, contributorID)
	if err != nil {
		return fmt.Errorf("unassign contributor %d: %w", contributorID, err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("unassign contributor: %w", err)
	}
	if rows == 0 {
		return house.ErrContributorNotFound
	}
	return nil
}