package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/lib/pq"

	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/vehicle"
)

// VehicleRepo implements vehicle.Repository.
type VehicleRepo struct {
	db *sql.DB
}

func NewVehicleRepo(db *sql.DB) *VehicleRepo {
	return &VehicleRepo{db: db}
}

func (r *VehicleRepo) Save(ctx context.Context, v *vehicle.Vehicle) error {
	const q = `
		INSERT INTO vehicles (house_id, plate, color, brand, model, notes, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id`

	err := r.db.QueryRowContext(ctx, q,
		v.HouseID, v.Plate, v.Color, v.Brand, v.Model, v.Notes, v.CreatedAt, v.UpdatedAt,
	).Scan(&v.ID)
	if err != nil {
		var pqErr *pq.Error
		if errors.As(err, &pqErr) && pqErr.Code == "23505" {
			return vehicle.ErrDuplicate
		}
		return fmt.Errorf("save vehicle: %w", err)
	}
	return nil
}

func (r *VehicleRepo) Update(ctx context.Context, v *vehicle.Vehicle) error {
	const q = `
		UPDATE vehicles
		SET plate = $1, color = $2, brand = $3, model = $4, notes = $5, updated_at = $6
		WHERE id = $7`

	result, err := r.db.ExecContext(ctx, q, v.Plate, v.Color, v.Brand, v.Model, v.Notes, v.UpdatedAt, v.ID)
	if err != nil {
		var pqErr *pq.Error
		if errors.As(err, &pqErr) && pqErr.Code == "23505" {
			return vehicle.ErrDuplicate
		}
		return fmt.Errorf("update vehicle %d: %w", v.ID, err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("update vehicle %d: %w", v.ID, err)
	}
	if rows == 0 {
		return vehicle.ErrNotFound
	}
	return nil
}

func (r *VehicleRepo) FindByID(ctx context.Context, id int64) (*vehicle.Vehicle, error) {
	const q = `
		SELECT id, house_id, plate, color, brand, model, notes, created_at, updated_at
		FROM vehicles WHERE id = $1`

	var v vehicle.Vehicle
	err := r.db.QueryRowContext(ctx, q, id).Scan(
		&v.ID, &v.HouseID, &v.Plate, &v.Color, &v.Brand, &v.Model, &v.Notes, &v.CreatedAt, &v.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, vehicle.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("find vehicle %d: %w", id, err)
	}

	entries, err := r.findAccessControls(ctx, id)
	if err != nil {
		return nil, err
	}
	v.AccessControls = entries
	return &v, nil
}

func (r *VehicleRepo) FindByHouseID(ctx context.Context, houseID int64) ([]vehicle.Vehicle, error) {
	const q = `
		SELECT id, house_id, plate, color, brand, model, notes, created_at, updated_at
		FROM vehicles WHERE house_id = $1
		ORDER BY plate`

	rows, err := r.db.QueryContext(ctx, q, houseID)
	if err != nil {
		return nil, fmt.Errorf("list vehicles for house %d: %w", houseID, err)
	}
	defer rows.Close()

	var vehicles []vehicle.Vehicle
	for rows.Next() {
		var v vehicle.Vehicle
		if err := rows.Scan(
			&v.ID, &v.HouseID, &v.Plate, &v.Color, &v.Brand, &v.Model, &v.Notes, &v.CreatedAt, &v.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan vehicle: %w", err)
		}
		vehicles = append(vehicles, v)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("list vehicles for house %d: %w", houseID, err)
	}

	for i := range vehicles {
		entries, err := r.findAccessControls(ctx, vehicles[i].ID)
		if err != nil {
			return nil, err
		}
		vehicles[i].AccessControls = entries
	}
	return vehicles, nil
}

func (r *VehicleRepo) Delete(ctx context.Context, id int64) error {
	const q = `DELETE FROM vehicles WHERE id = $1`

	result, err := r.db.ExecContext(ctx, q, id)
	if err != nil {
		return fmt.Errorf("delete vehicle %d: %w", id, err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("delete vehicle %d: %w", id, err)
	}
	if rows == 0 {
		return vehicle.ErrNotFound
	}
	return nil
}

func (r *VehicleRepo) AssignAccessControl(ctx context.Context, vehicleID, accessControlID int64) error {
	const q = `
		INSERT INTO vehicle_access_controls (vehicle_id, access_control_id)
		VALUES ($1, $2)`

	_, err := r.db.ExecContext(ctx, q, vehicleID, accessControlID)
	if err != nil {
		var pqErr *pq.Error
		if errors.As(err, &pqErr) && pqErr.Code == "23505" {
			return vehicle.ErrAccessControlAlreadyAssigned
		}
		return fmt.Errorf("assign access control %d to vehicle %d: %w", accessControlID, vehicleID, err)
	}
	return nil
}

func (r *VehicleRepo) UnassignAccessControl(ctx context.Context, vehicleID, accessControlID int64) error {
	const q = `
		DELETE FROM vehicle_access_controls
		WHERE vehicle_id = $1 AND access_control_id = $2`

	result, err := r.db.ExecContext(ctx, q, vehicleID, accessControlID)
	if err != nil {
		return fmt.Errorf("unassign access control %d from vehicle %d: %w", accessControlID, vehicleID, err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("unassign access control: %w", err)
	}
	if rows == 0 {
		return vehicle.ErrAccessControlNotAssigned
	}
	return nil
}

func (r *VehicleRepo) findAccessControls(ctx context.Context, vehicleID int64) ([]vehicle.VehicleAccessControlEntry, error) {
	const q = `
		SELECT vac.access_control_id, ac.code, ac.admin_number, vac.assigned_at
		FROM vehicle_access_controls vac
		JOIN access_controls ac ON ac.id = vac.access_control_id
		WHERE vac.vehicle_id = $1
		ORDER BY vac.assigned_at`

	rows, err := r.db.QueryContext(ctx, q, vehicleID)
	if err != nil {
		return nil, fmt.Errorf("list access controls for vehicle %d: %w", vehicleID, err)
	}
	defer rows.Close()

	var entries []vehicle.VehicleAccessControlEntry
	for rows.Next() {
		var e vehicle.VehicleAccessControlEntry
		if err := rows.Scan(&e.AccessControlID, &e.Code, &e.AdminNumber, &e.AssignedAt); err != nil {
			return nil, fmt.Errorf("scan vehicle access control entry: %w", err)
		}
		entries = append(entries, e)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("list access controls for vehicle %d: %w", vehicleID, err)
	}
	return entries, nil
}