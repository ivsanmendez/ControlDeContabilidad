package port

import (
	"context"
	"time"

	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/accesscontrol"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/category"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/contribution"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/contributor"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/expense"
	ec "github.com/ivsanmendez/ControlDeContabilidad/internal/domain/expense_category"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/house"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/receipt"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/report"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/user"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/vehicle"
)

// ExpenseService is the driving port — the contract that inbound adapters
// (HTTP handlers, AI agents) depend on.
type ExpenseService interface {
	CreateExpense(ctx context.Context, callerID int64, description string, amount float64, categoryID int64, date time.Time) (*expense.Expense, error)
	GetExpense(ctx context.Context, callerID int64, callerRole user.Role, id int64) (*expense.Expense, error)
	GetExpenseDetail(ctx context.Context, callerID int64, callerRole user.Role, id int64) (*expense.ExpenseDetail, error)
	ListExpenses(ctx context.Context, callerID int64, callerRole user.Role, params expense.ListParams) (*expense.PaginatedResult, error)
	UpdateExpense(ctx context.Context, callerID int64, callerRole user.Role, id int64, description string, amount float64, categoryID int64, date time.Time) (*expense.Expense, error)
	DeleteExpense(ctx context.Context, callerID int64, callerRole user.Role, id int64) error
}

// ContributorService is the driving port for contributor use cases.
type ContributorService interface {
	CreateContributor(ctx context.Context, callerID int64, houseNumber, name, phone string, houseID *int64, cameraAccess bool, cameraEmail, cameraPhone string) (*contributor.Contributor, error)
	GetContributor(ctx context.Context, id int64) (*contributor.Contributor, error)
	ListContributors(ctx context.Context, houseID *int64) ([]contributor.Contributor, error)
	UpdateContributor(ctx context.Context, id int64, houseNumber, name, phone string, houseID *int64, cameraAccess bool, cameraEmail, cameraPhone string) (*contributor.Contributor, error)
	DeleteContributor(ctx context.Context, id int64) error
}

// ContributionService is the driving port for contribution use cases.
type ContributionService interface {
	CreateContribution(ctx context.Context, callerID int64, contributorID int64, categoryID int64, amount float64, month, year int, paymentDate time.Time, paymentMethod contribution.PaymentMethod) (*contribution.Contribution, error)
	GetContribution(ctx context.Context, id int64) (*contribution.ContributionDetail, error)
	ListContributions(ctx context.Context, contributorID int64, year int, houseID *int64) ([]contribution.ContributionDetail, error)
	UpdateContribution(ctx context.Context, id int64, contributorID int64, categoryID int64, amount float64, month, year int, paymentDate time.Time, paymentMethod contribution.PaymentMethod) (*contribution.Contribution, error)
	DeleteContribution(ctx context.Context, id int64) error
}

// CategoryService is the driving port for contribution category use cases.
type CategoryService interface {
	CreateCategory(ctx context.Context, callerID int64, name, description string) (*category.Category, error)
	GetCategory(ctx context.Context, id int64) (*category.Category, error)
	ListCategories(ctx context.Context) ([]category.Category, error)
	ListActiveCategories(ctx context.Context) ([]category.Category, error)
	UpdateCategory(ctx context.Context, id int64, name, description string, isActive bool) (*category.Category, error)
	DeleteCategory(ctx context.Context, id int64) error
}

// ReceiptFolioService is the driving port for receipt folio use cases.
type ReceiptFolioService interface {
	GenerateNewFolio(ctx context.Context, year int) (folio string, seq int, suffix string, err error)
	SaveFolio(ctx context.Context, rf *receipt.ReceiptFolio) error
	VerifyFolio(ctx context.Context, folio string) (*receipt.ReceiptFolio, error)
}

// ReportService is the driving port for report use cases.
type ReportService interface {
	GetMonthlyBalance(ctx context.Context, year int) (*report.MonthlyBalanceReport, error)
	GetHouseReport(ctx context.Context, houseID int64, year int) (*report.HouseReport, error)
}

// HouseService is the driving port for house use cases.
type HouseService interface {
	CreateHouse(ctx context.Context, name, address, notes string) (*house.House, error)
	GetHouse(ctx context.Context, id int64) (*house.HouseDetail, error)
	ListHouses(ctx context.Context) ([]house.House, error)
	UpdateHouse(ctx context.Context, id int64, name, address, notes string) (*house.House, error)
	DeleteHouse(ctx context.Context, id int64) error
	AssignContributor(ctx context.Context, houseID, contributorID int64) error
	UnassignContributor(ctx context.Context, contributorID int64) error
}

// ExpenseCategoryService is the driving port for expense category use cases.
type ExpenseCategoryService interface {
	CreateCategory(ctx context.Context, callerID int64, name, description string) (*ec.ExpenseCategory, error)
	GetCategory(ctx context.Context, id int64) (*ec.ExpenseCategory, error)
	ListCategories(ctx context.Context) ([]ec.ExpenseCategory, error)
	ListActiveCategories(ctx context.Context) ([]ec.ExpenseCategory, error)
	UpdateCategory(ctx context.Context, id int64, name, description string, isActive bool) (*ec.ExpenseCategory, error)
	DeleteCategory(ctx context.Context, id int64) error
}

// AccessControlService is the driving port for access control use cases.
type AccessControlService interface {
	CreateAccessControl(ctx context.Context, houseID int64, code, adminNumber, notes string) (*accesscontrol.AccessControl, error)
	GetAccessControl(ctx context.Context, id int64) (*accesscontrol.AccessControl, error)
	LookupByCode(ctx context.Context, code string) (*accesscontrol.AccessControl, error)
	ListAll(ctx context.Context) ([]accesscontrol.AccessControlWithHouse, error)
	ListByHouse(ctx context.Context, houseID int64) ([]accesscontrol.AccessControl, error)
	UpdateAccessControl(ctx context.Context, id int64, code, adminNumber, notes string) (*accesscontrol.AccessControl, error)
	ChangeStatus(ctx context.Context, id int64, status accesscontrol.Status) (*accesscontrol.AccessControl, error)
	MarkPhysicallySynced(ctx context.Context, id int64) (*accesscontrol.AccessControl, error)
	DeleteAccessControl(ctx context.Context, id int64) error
	ListPendingSync(ctx context.Context) ([]accesscontrol.AccessControl, error)
	EvaluateHouse(ctx context.Context, houseID int64) error
	EvaluateAll(ctx context.Context) error
}

// VehicleService is the driving port for vehicle use cases.
type VehicleService interface {
	CreateVehicle(ctx context.Context, houseID int64, plate, color, brand, model, notes string) (*vehicle.Vehicle, error)
	GetVehicle(ctx context.Context, id int64) (*vehicle.Vehicle, error)
	ListByHouse(ctx context.Context, houseID int64) ([]vehicle.Vehicle, error)
	UpdateVehicle(ctx context.Context, id int64, plate, color, brand, model, notes string) (*vehicle.Vehicle, error)
	DeleteVehicle(ctx context.Context, id int64) error
	AssignAccessControl(ctx context.Context, vehicleID, accessControlID int64) error
	UnassignAccessControl(ctx context.Context, vehicleID, accessControlID int64) error
}
