package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/lib/pq"

	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/accesscontrol"
)

// AccessControlRepo implements accesscontrol.Repository.
type AccessControlRepo struct {
	db *sql.DB
}

func NewAccessControlRepo(db *sql.DB) *AccessControlRepo {
	return &AccessControlRepo{db: db}
}

func (r *AccessControlRepo) Save(ctx context.Context, ac *accesscontrol.AccessControl) error {
	const q = `
		INSERT INTO access_controls (house_id, code, admin_number, status, physical_synced_at, notes, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id`

	err := r.db.QueryRowContext(ctx, q,
		ac.HouseID, ac.Code, ac.AdminNumber, string(ac.Status),
		ac.PhysicalSyncedAt, ac.Notes, ac.CreatedAt, ac.UpdatedAt,
	).Scan(&ac.ID)
	if err != nil {
		var pqErr *pq.Error
		if errors.As(err, &pqErr) && pqErr.Code == "23505" {
			return accesscontrol.ErrDuplicate
		}
		return fmt.Errorf("save access control: %w", err)
	}
	return nil
}

func (r *AccessControlRepo) Update(ctx context.Context, ac *accesscontrol.AccessControl) error {
	const q = `
		UPDATE access_controls
		SET code = $1, admin_number = $2, notes = $3, updated_at = $4
		WHERE id = $5`

	result, err := r.db.ExecContext(ctx, q, ac.Code, ac.AdminNumber, ac.Notes, ac.UpdatedAt, ac.ID)
	if err != nil {
		var pqErr *pq.Error
		if errors.As(err, &pqErr) && pqErr.Code == "23505" {
			return accesscontrol.ErrDuplicate
		}
		return fmt.Errorf("update access control %d: %w", ac.ID, err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("update access control %d: %w", ac.ID, err)
	}
	if rows == 0 {
		return accesscontrol.ErrNotFound
	}
	return nil
}

func (r *AccessControlRepo) FindByID(ctx context.Context, id int64) (*accesscontrol.AccessControl, error) {
	const q = `
		SELECT id, house_id, code, admin_number, status, physical_synced_at, notes, created_at, updated_at
		FROM access_controls WHERE id = $1`

	var ac accesscontrol.AccessControl
	var status string
	err := r.db.QueryRowContext(ctx, q, id).Scan(
		&ac.ID, &ac.HouseID, &ac.Code, &ac.AdminNumber, &status,
		&ac.PhysicalSyncedAt, &ac.Notes, &ac.CreatedAt, &ac.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, accesscontrol.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("find access control %d: %w", id, err)
	}
	ac.Status = accesscontrol.Status(status)
	return &ac, nil
}

func (r *AccessControlRepo) FindByCode(ctx context.Context, code string) (*accesscontrol.AccessControl, error) {
	const q = `
		SELECT id, house_id, code, admin_number, status, physical_synced_at, notes, created_at, updated_at
		FROM access_controls WHERE code = $1`

	var ac accesscontrol.AccessControl
	var status string
	err := r.db.QueryRowContext(ctx, q, code).Scan(
		&ac.ID, &ac.HouseID, &ac.Code, &ac.AdminNumber, &status,
		&ac.PhysicalSyncedAt, &ac.Notes, &ac.CreatedAt, &ac.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, accesscontrol.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("find access control by code: %w", err)
	}
	ac.Status = accesscontrol.Status(status)
	return &ac, nil
}

func (r *AccessControlRepo) FindAll(ctx context.Context) ([]accesscontrol.AccessControlWithHouse, error) {
	const q = `
		SELECT ac.id, ac.house_id, ac.code, ac.admin_number, ac.status, ac.physical_synced_at,
		       ac.notes, ac.created_at, ac.updated_at, h.name
		FROM access_controls ac
		JOIN houses h ON h.id = ac.house_id
		ORDER BY h.name, ac.id`

	rows, err := r.db.QueryContext(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("list all access controls: %w", err)
	}
	defer rows.Close()

	var acs []accesscontrol.AccessControlWithHouse
	for rows.Next() {
		var ac accesscontrol.AccessControlWithHouse
		var status string
		if err := rows.Scan(
			&ac.ID, &ac.HouseID, &ac.Code, &ac.AdminNumber, &status,
			&ac.PhysicalSyncedAt, &ac.Notes, &ac.CreatedAt, &ac.UpdatedAt, &ac.HouseName,
		); err != nil {
			return nil, fmt.Errorf("scan access control with house: %w", err)
		}
		ac.Status = accesscontrol.Status(status)
		acs = append(acs, ac)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("list all access controls: %w", err)
	}
	return acs, nil
}

func (r *AccessControlRepo) FindByHouseID(ctx context.Context, houseID int64) ([]accesscontrol.AccessControl, error) {
	const q = `
		SELECT id, house_id, code, admin_number, status, physical_synced_at, notes, created_at, updated_at
		FROM access_controls WHERE house_id = $1
		ORDER BY id`

	return r.scanMany(ctx, q, houseID)
}

func (r *AccessControlRepo) CountByHouseID(ctx context.Context, houseID int64) (int, error) {
	const q = `SELECT COUNT(*) FROM access_controls WHERE house_id = $1`
	var count int
	if err := r.db.QueryRowContext(ctx, q, houseID).Scan(&count); err != nil {
		return 0, fmt.Errorf("count access controls for house %d: %w", houseID, err)
	}
	return count, nil
}

func (r *AccessControlRepo) UpdateStatus(ctx context.Context, id int64, status accesscontrol.Status, physicalSyncedAt *time.Time) error {
	const q = `
		UPDATE access_controls
		SET status = $1, physical_synced_at = $2, updated_at = NOW()
		WHERE id = $3`

	result, err := r.db.ExecContext(ctx, q, string(status), physicalSyncedAt, id)
	if err != nil {
		return fmt.Errorf("update status for access control %d: %w", id, err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("update status for access control %d: %w", id, err)
	}
	if rows == 0 {
		return accesscontrol.ErrNotFound
	}
	return nil
}

func (r *AccessControlRepo) UpdateAllForHouse(ctx context.Context, houseID int64, status accesscontrol.Status) error {
	const q = `
		UPDATE access_controls
		SET status = $1, physical_synced_at = NULL, updated_at = NOW()
		WHERE house_id = $2`

	_, err := r.db.ExecContext(ctx, q, string(status), houseID)
	if err != nil {
		return fmt.Errorf("update all access controls for house %d: %w", houseID, err)
	}
	return nil
}

func (r *AccessControlRepo) FindPendingSync(ctx context.Context) ([]accesscontrol.AccessControl, error) {
	const q = `
		SELECT id, house_id, code, admin_number, status, physical_synced_at, notes, created_at, updated_at
		FROM access_controls WHERE physical_synced_at IS NULL
		ORDER BY house_id, id`

	return r.scanMany(ctx, q)
}

func (r *AccessControlRepo) FindDistinctHouseIDs(ctx context.Context) ([]int64, error) {
	const q = `SELECT DISTINCT house_id FROM access_controls ORDER BY house_id`

	rows, err := r.db.QueryContext(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("find distinct house IDs: %w", err)
	}
	defer rows.Close()

	var ids []int64
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			return nil, fmt.Errorf("scan house id: %w", err)
		}
		ids = append(ids, id)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("find distinct house IDs: %w", err)
	}
	return ids, nil
}

func (r *AccessControlRepo) Delete(ctx context.Context, id int64) error {
	const q = `DELETE FROM access_controls WHERE id = $1`

	result, err := r.db.ExecContext(ctx, q, id)
	if err != nil {
		return fmt.Errorf("delete access control %d: %w", id, err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("delete access control %d: %w", id, err)
	}
	if rows == 0 {
		return accesscontrol.ErrNotFound
	}
	return nil
}

func (r *AccessControlRepo) scanMany(ctx context.Context, query string, args ...any) ([]accesscontrol.AccessControl, error) {
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list access controls: %w", err)
	}
	defer rows.Close()

	var acs []accesscontrol.AccessControl
	for rows.Next() {
		var ac accesscontrol.AccessControl
		var status string
		if err := rows.Scan(
			&ac.ID, &ac.HouseID, &ac.Code, &ac.AdminNumber, &status,
			&ac.PhysicalSyncedAt, &ac.Notes, &ac.CreatedAt, &ac.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan access control: %w", err)
		}
		ac.Status = accesscontrol.Status(status)
		acs = append(acs, ac)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("list access controls: %w", err)
	}
	return acs, nil
}