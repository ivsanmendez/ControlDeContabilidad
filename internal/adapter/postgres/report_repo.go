package postgres

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/lib/pq"

	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/report"
)

// ReportRepo implements report.Repository.
type ReportRepo struct {
	db *sql.DB
}

func NewReportRepo(db *sql.DB) *ReportRepo {
	return &ReportRepo{db: db}
}

func (r *ReportRepo) AggregateIncomeByMonth(ctx context.Context, year int) ([]report.MonthAggregate, error) {
	const q = `
		SELECT EXTRACT(MONTH FROM payment_date)::int, COALESCE(SUM(amount), 0)
		FROM contributions
		WHERE EXTRACT(YEAR FROM payment_date)::int = $1
		GROUP BY EXTRACT(MONTH FROM payment_date)
		ORDER BY EXTRACT(MONTH FROM payment_date)`

	return r.scanAggregates(ctx, q, year)
}

func (r *ReportRepo) AggregateExpensesByMonth(ctx context.Context, year int) ([]report.MonthAggregate, error) {
	const q = `
		SELECT EXTRACT(MONTH FROM date)::int, COALESCE(SUM(amount), 0)
		FROM expenses
		WHERE EXTRACT(YEAR FROM date)::int = $1
		GROUP BY EXTRACT(MONTH FROM date)
		ORDER BY EXTRACT(MONTH FROM date)`

	return r.scanAggregates(ctx, q, year)
}

func (r *ReportRepo) GetHouseReport(ctx context.Context, houseID int64, year int) (*report.HouseReport, error) {
	// Fetch house info
	var rpt report.HouseReport
	rpt.HouseID = houseID
	rpt.Year = year

	const houseQ = `SELECT name, COALESCE(address, '') FROM houses WHERE id = $1`
	if err := r.db.QueryRowContext(ctx, houseQ, houseID).Scan(&rpt.HouseName, &rpt.HouseAddress); err != nil {
		return nil, fmt.Errorf("get house for report: %w", err)
	}

	// Fetch contributors for the house
	const ctQ = `
		SELECT id, name, house_number, COALESCE(phone,''), camera_access
		FROM contributors WHERE house_id = $1 ORDER BY house_number`
	ctRows, err := r.db.QueryContext(ctx, ctQ, houseID)
	if err != nil {
		return nil, fmt.Errorf("get contributors for house report: %w", err)
	}
	defer ctRows.Close()

	contributorIndex := map[int64]int{}
	for ctRows.Next() {
		var cr report.ContributorReport
		if err := ctRows.Scan(&cr.ContributorID, &cr.Name, &cr.HouseNumber, &cr.Phone, &cr.CameraAccess); err != nil {
			return nil, fmt.Errorf("scan contributor: %w", err)
		}
		contributorIndex[cr.ContributorID] = len(rpt.Contributors)
		rpt.Contributors = append(rpt.Contributors, cr)
	}
	if err := ctRows.Err(); err != nil {
		return nil, fmt.Errorf("get contributors for house report: %w", err)
	}

	// Fetch monthly payments per contributor for the given year
	const payQ = `
		SELECT c.contributor_id, EXTRACT(MONTH FROM c.payment_date)::int, SUM(c.amount)
		FROM contributions c
		JOIN contributors ct ON ct.id = c.contributor_id
		WHERE ct.house_id = $1 AND EXTRACT(YEAR FROM c.payment_date)::int = $2
		GROUP BY c.contributor_id, EXTRACT(MONTH FROM c.payment_date)
		ORDER BY c.contributor_id, EXTRACT(MONTH FROM c.payment_date)`
	payRows, err := r.db.QueryContext(ctx, payQ, houseID, year)
	if err != nil {
		return nil, fmt.Errorf("get payments for house report: %w", err)
	}
	defer payRows.Close()

	monthTotals := make(map[int]float64)
	for payRows.Next() {
		var contributorID int64
		var month int
		var amount float64
		if err := payRows.Scan(&contributorID, &month, &amount); err != nil {
			return nil, fmt.Errorf("scan payment: %w", err)
		}
		if idx, ok := contributorIndex[contributorID]; ok {
			rpt.Contributors[idx].Payments = append(rpt.Contributors[idx].Payments, report.ContributorMonthlyPayment{
				Month:  month,
				Amount: amount,
			})
			rpt.Contributors[idx].TotalPaid += amount
		}
		monthTotals[month] += amount
		rpt.TotalIncome += amount
	}
	if err := payRows.Err(); err != nil {
		return nil, fmt.Errorf("get payments for house report: %w", err)
	}

	// Build 12-month summary
	rpt.Months = make([]report.HouseMonthSummary, 12)
	for m := 1; m <= 12; m++ {
		rpt.Months[m-1] = report.HouseMonthSummary{Month: m, Income: monthTotals[m]}
	}

	// Fetch users assigned to this house
	const usersQ = `
		SELECT u.email, u.role
		FROM users u
		JOIN user_houses uh ON uh.user_id = u.id
		WHERE uh.house_id = $1
		ORDER BY u.email`
	uRows, err := r.db.QueryContext(ctx, usersQ, houseID)
	if err != nil {
		return nil, fmt.Errorf("get users for house report: %w", err)
	}
	defer uRows.Close()
	for uRows.Next() {
		var e report.UserReportEntry
		if err := uRows.Scan(&e.Email, &e.Role); err != nil {
			return nil, fmt.Errorf("scan user entry: %w", err)
		}
		rpt.Users = append(rpt.Users, e)
	}
	if err := uRows.Err(); err != nil {
		return nil, fmt.Errorf("get users for house report: %w", err)
	}

	// Fetch access controls for this house
	const acQ = `
		SELECT code, admin_number, status,
		       to_char(physical_synced_at, 'YYYY-MM-DD HH24:MI'),
		       COALESCE(notes, '')
		FROM access_controls
		WHERE house_id = $1
		ORDER BY id`
	acRows, err := r.db.QueryContext(ctx, acQ, houseID)
	if err != nil {
		return nil, fmt.Errorf("get access controls for house report: %w", err)
	}
	defer acRows.Close()
	for acRows.Next() {
		var e report.AccessControlReportEntry
		if err := acRows.Scan(&e.Code, &e.AdminNumber, &e.Status, &e.PhysicalSyncedAt, &e.Notes); err != nil {
			return nil, fmt.Errorf("scan access control entry: %w", err)
		}
		rpt.AccessControls = append(rpt.AccessControls, e)
	}
	if err := acRows.Err(); err != nil {
		return nil, fmt.Errorf("get access controls for house report: %w", err)
	}

	// Fetch vehicles with their assigned control codes
	const vQ = `
		SELECT v.id, v.plate, v.color, COALESCE(v.brand,''), COALESCE(v.model,'')
		FROM vehicles v
		WHERE v.house_id = $1
		ORDER BY v.plate`
	vRows, err := r.db.QueryContext(ctx, vQ, houseID)
	if err != nil {
		return nil, fmt.Errorf("get vehicles for house report: %w", err)
	}
	defer vRows.Close()
	type vehicleWithID struct {
		id    int64
		entry report.VehicleReportEntry
	}
	var vehicleList []vehicleWithID
	for vRows.Next() {
		var vid int64
		var e report.VehicleReportEntry
		if err := vRows.Scan(&vid, &e.Plate, &e.Color, &e.Brand, &e.Model); err != nil {
			return nil, fmt.Errorf("scan vehicle entry: %w", err)
		}
		vehicleList = append(vehicleList, vehicleWithID{id: vid, entry: e})
	}
	if err := vRows.Err(); err != nil {
		return nil, fmt.Errorf("get vehicles for house report: %w", err)
	}

	// Fetch assigned control codes per vehicle
	if len(vehicleList) > 0 {
		const vcQ = `
			SELECT vac.vehicle_id, ac.code
			FROM vehicle_access_controls vac
			JOIN access_controls ac ON ac.id = vac.access_control_id
			WHERE vac.vehicle_id = ANY($1)
			ORDER BY vac.vehicle_id, ac.code`
		ids := make([]int64, len(vehicleList))
		for i, v := range vehicleList {
			ids[i] = v.id
		}
		vcRows, err := r.db.QueryContext(ctx, vcQ, pq.Array(ids))
		if err != nil {
			return nil, fmt.Errorf("get vehicle controls for house report: %w", err)
		}
		defer vcRows.Close()
		controlsByVehicle := make(map[int64][]string)
		for vcRows.Next() {
			var vid int64
			var code string
			if err := vcRows.Scan(&vid, &code); err != nil {
				return nil, fmt.Errorf("scan vehicle control: %w", err)
			}
			controlsByVehicle[vid] = append(controlsByVehicle[vid], code)
		}
		if err := vcRows.Err(); err != nil {
			return nil, fmt.Errorf("get vehicle controls for house report: %w", err)
		}
		for _, v := range vehicleList {
			e := v.entry
			e.AssignedControls = controlsByVehicle[v.id]
			rpt.Vehicles = append(rpt.Vehicles, e)
		}
	}

	return &rpt, nil
}

func (r *ReportRepo) scanAggregates(ctx context.Context, query string, args ...any) ([]report.MonthAggregate, error) {
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("report aggregate: %w", err)
	}
	defer rows.Close()

	var result []report.MonthAggregate
	for rows.Next() {
		var a report.MonthAggregate
		if err := rows.Scan(&a.Month, &a.Amount); err != nil {
			return nil, fmt.Errorf("scan aggregate: %w", err)
		}
		result = append(result, a)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("report aggregate: %w", err)
	}
	return result, nil
}
