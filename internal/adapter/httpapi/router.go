package httpapi

import (
	"net/http"

	"github.com/ivsanmendez/ControlDeContabilidad/internal/adapter/i18n"
	jwtadapter "github.com/ivsanmendez/ControlDeContabilidad/internal/adapter/jwt"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/user"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/port"
)

// RegisterRoutes wires all HTTP routes onto the given mux.
func RegisterRoutes(mux *http.ServeMux, expenseSvc port.ExpenseService, authSvc port.AuthService, contribSvc port.ContributionService, contributorSvc port.ContributorService, categorySvc port.CategoryService, expCatSvc port.ExpenseCategoryService, receiptSvc port.ReceiptFolioService, reportSvc port.ReportService, houseSvc port.HouseService, accessControlSvc port.AccessControlService, vehicleSvc port.VehicleService, userAdminSvc port.UserAdminService, jwtIssuer *jwtadapter.Issuer, signer port.ReceiptSigner, tr *i18n.Translator) {
	auth := RequireAuth(jwtIssuer, tr)
	expH := &ExpenseHandler{svc: expenseSvc, tr: tr}
	authH := &AuthHandler{svc: authSvc, tr: tr}
	contribH := &ContributionHandler{svc: contribSvc, tr: tr}
	contributorH := &ContributorHandler{svc: contributorSvc, tr: tr}
	categoryH := &CategoryHandler{svc: categorySvc, tr: tr}
	expCatH := &ExpenseCategoryHandler{svc: expCatSvc, tr: tr}
	receiptH := &ReceiptHandler{contribSvc: contribSvc, contributorSvc: contributorSvc, expenseSvc: expenseSvc, receiptSvc: receiptSvc, signer: signer, tr: tr}
	reportH := &ReportHandler{svc: reportSvc, tr: tr}
	houseH := &HouseHandler{svc: houseSvc, tr: tr}
	acH := &AccessControlHandler{svc: accessControlSvc, tr: tr}
	vehicleH := &VehicleHandler{svc: vehicleSvc, tr: tr}
	userAdminH := &UserAdminHandler{svc: userAdminSvc, tr: tr}

	// Public routes
	mux.HandleFunc("GET /health", Health)
	mux.HandleFunc("POST /auth/register", authH.Register)
	mux.HandleFunc("POST /auth/login", authH.Login)
	mux.HandleFunc("POST /auth/refresh", authH.Refresh)

	// Protected auth routes
	mux.Handle("POST /auth/logout", Chain(http.HandlerFunc(authH.Logout), auth))
	mux.Handle("GET /auth/me", Chain(http.HandlerFunc(authH.Me), auth))

	// Protected expense routes
	mux.Handle("POST /expenses", Chain(
		http.HandlerFunc(expH.Create),
		auth, RequirePermission(user.PermExpenseCreate, tr),
	))
	mux.Handle("GET /expenses", Chain(
		http.HandlerFunc(expH.List),
		auth, RequirePermission(user.PermExpenseReadOwn, tr),
	))
	mux.Handle("GET /expenses/{id}", Chain(
		http.HandlerFunc(expH.GetByID),
		auth, RequirePermission(user.PermExpenseReadOwn, tr),
	))
	mux.Handle("PUT /expenses/{id}", Chain(
		http.HandlerFunc(expH.Update),
		auth, RequirePermission(user.PermExpenseUpdateOwn, tr),
	))
	mux.Handle("DELETE /expenses/{id}", Chain(
		http.HandlerFunc(expH.Delete),
		auth, RequirePermission(user.PermExpenseDeleteOwn, tr),
	))

	// Protected contributor routes
	mux.Handle("POST /contributors", Chain(
		http.HandlerFunc(contributorH.Create),
		auth, RequirePermission(user.PermContributorCreate, tr),
	))
	mux.Handle("GET /contributors", Chain(
		http.HandlerFunc(contributorH.List),
		auth, RequirePermission(user.PermContributorRead, tr),
	))
	mux.Handle("GET /contributors/{id}", Chain(
		http.HandlerFunc(contributorH.GetByID),
		auth, RequirePermission(user.PermContributorRead, tr),
	))
	mux.Handle("PUT /contributors/{id}", Chain(
		http.HandlerFunc(contributorH.Update),
		auth, RequirePermission(user.PermContributorUpdate, tr),
	))
	mux.Handle("DELETE /contributors/{id}", Chain(
		http.HandlerFunc(contributorH.Delete),
		auth, RequirePermission(user.PermContributorDelete, tr),
	))

	// Protected contribution category routes
	mux.Handle("POST /contribution-categories", Chain(
		http.HandlerFunc(categoryH.Create),
		auth, RequirePermission(user.PermCategoryCreate, tr),
	))
	mux.Handle("GET /contribution-categories", Chain(
		http.HandlerFunc(categoryH.List),
		auth, RequirePermission(user.PermCategoryRead, tr),
	))
	mux.Handle("GET /contribution-categories/{id}", Chain(
		http.HandlerFunc(categoryH.GetByID),
		auth, RequirePermission(user.PermCategoryRead, tr),
	))
	mux.Handle("PUT /contribution-categories/{id}", Chain(
		http.HandlerFunc(categoryH.Update),
		auth, RequirePermission(user.PermCategoryUpdate, tr),
	))
	mux.Handle("DELETE /contribution-categories/{id}", Chain(
		http.HandlerFunc(categoryH.Delete),
		auth, RequirePermission(user.PermCategoryDelete, tr),
	))

	// Protected expense category routes
	mux.Handle("POST /expense-categories", Chain(
		http.HandlerFunc(expCatH.Create),
		auth, RequirePermission(user.PermExpenseCategoryCreate, tr),
	))
	mux.Handle("GET /expense-categories", Chain(
		http.HandlerFunc(expCatH.List),
		auth, RequirePermission(user.PermExpenseCategoryRead, tr),
	))
	mux.Handle("GET /expense-categories/{id}", Chain(
		http.HandlerFunc(expCatH.GetByID),
		auth, RequirePermission(user.PermExpenseCategoryRead, tr),
	))
	mux.Handle("PUT /expense-categories/{id}", Chain(
		http.HandlerFunc(expCatH.Update),
		auth, RequirePermission(user.PermExpenseCategoryUpdate, tr),
	))
	mux.Handle("DELETE /expense-categories/{id}", Chain(
		http.HandlerFunc(expCatH.Delete),
		auth, RequirePermission(user.PermExpenseCategoryDelete, tr),
	))

	// Protected contribution routes
	mux.Handle("POST /contributions", Chain(
		http.HandlerFunc(contribH.Create),
		auth, RequirePermission(user.PermContributionCreate, tr),
	))
	mux.Handle("GET /contributions", Chain(
		http.HandlerFunc(contribH.List),
		auth, RequirePermission(user.PermContributionRead, tr),
	))
	mux.Handle("GET /contributions/{id}", Chain(
		http.HandlerFunc(contribH.GetByID),
		auth, RequirePermission(user.PermContributionRead, tr),
	))
	mux.Handle("PUT /contributions/{id}", Chain(
		http.HandlerFunc(contribH.Update),
		auth, RequirePermission(user.PermContributionUpdate, tr),
	))
	mux.Handle("DELETE /contributions/{id}", Chain(
		http.HandlerFunc(contribH.Delete),
		auth, RequirePermission(user.PermContributionDelete, tr),
	))

	// Receipt digital signature (POST: requires password for key decryption)
	mux.Handle("POST /contributions/receipt-signature", Chain(
		http.HandlerFunc(receiptH.ReceiptSignature),
		auth, RequirePermission(user.PermContributionRead, tr),
	))
	mux.Handle("POST /expenses/{id}/receipt-signature", Chain(
		http.HandlerFunc(receiptH.ExpenseReceiptSignature),
		auth, RequirePermission(user.PermExpenseReadOwn, tr),
	))

	// Receipt folio verification
	mux.Handle("GET /receipts/verify/{folio}", Chain(
		http.HandlerFunc(receiptH.VerifyReceipt),
		auth, RequirePermission(user.PermReceiptVerify, tr),
	))

	// Reports
	mux.Handle("GET /reports/monthly-balance", Chain(
		http.HandlerFunc(reportH.MonthlyBalance),
		auth, RequirePermission(user.PermReportRead, tr),
	))
	mux.Handle("GET /houses/{id}/report", Chain(
		http.HandlerFunc(reportH.HouseReport),
		auth, RequirePermission(user.PermHouseRead, tr),
	))

	// House routes
	mux.Handle("POST /houses", Chain(
		http.HandlerFunc(houseH.Create),
		auth, RequirePermission(user.PermHouseCreate, tr),
	))
	mux.Handle("GET /houses", Chain(
		http.HandlerFunc(houseH.List),
		auth, RequirePermission(user.PermHouseRead, tr),
	))
	mux.Handle("GET /houses/{id}", Chain(
		http.HandlerFunc(houseH.GetByID),
		auth, RequirePermission(user.PermHouseRead, tr),
	))
	mux.Handle("PUT /houses/{id}", Chain(
		http.HandlerFunc(houseH.Update),
		auth, RequirePermission(user.PermHouseUpdate, tr),
	))
	mux.Handle("DELETE /houses/{id}", Chain(
		http.HandlerFunc(houseH.Delete),
		auth, RequirePermission(user.PermHouseDelete, tr),
	))
	mux.Handle("POST /houses/{id}/contributors", Chain(
		http.HandlerFunc(houseH.AssignContributor),
		auth, RequirePermission(user.PermHouseAssignContributor, tr),
	))
	mux.Handle("DELETE /houses/{id}/contributors/{contributor_id}", Chain(
		http.HandlerFunc(houseH.UnassignContributor),
		auth, RequirePermission(user.PermHouseAssignContributor, tr),
	))

	// Access control routes
	mux.Handle("GET /access-controls", Chain(
		http.HandlerFunc(acH.ListAll),
		auth, RequirePermission(user.PermAccessControlRead, tr),
	))
	mux.Handle("GET /houses/{id}/access-controls", Chain(
		http.HandlerFunc(acH.ListByHouse),
		auth, RequirePermission(user.PermAccessControlRead, tr),
	))
	mux.Handle("POST /houses/{id}/access-controls", Chain(
		http.HandlerFunc(acH.Create),
		auth, RequirePermission(user.PermAccessControlCreate, tr),
	))
	mux.Handle("PUT /access-controls/{id}", Chain(
		http.HandlerFunc(acH.Update),
		auth, RequirePermission(user.PermAccessControlUpdate, tr),
	))
	mux.Handle("PUT /access-controls/{id}/status", Chain(
		http.HandlerFunc(acH.ChangeStatus),
		auth, RequirePermission(user.PermAccessControlStatus, tr),
	))
	mux.Handle("PUT /access-controls/{id}/sync", Chain(
		http.HandlerFunc(acH.MarkSynced),
		auth, RequirePermission(user.PermAccessControlSync, tr),
	))
	mux.Handle("DELETE /access-controls/{id}", Chain(
		http.HandlerFunc(acH.Delete),
		auth, RequirePermission(user.PermAccessControlDelete, tr),
	))
	mux.Handle("GET /access-controls/lookup", Chain(
		http.HandlerFunc(acH.LookupByCode),
		auth, RequirePermission(user.PermAccessControlRead, tr),
	))
	mux.Handle("GET /access-controls/pending-sync", Chain(
		http.HandlerFunc(acH.PendingSync),
		auth, RequirePermission(user.PermAccessControlRead, tr),
	))
	mux.Handle("POST /access-controls/evaluate", Chain(
		http.HandlerFunc(acH.Evaluate),
		auth, RequirePermission(user.PermAccessControlEvaluate, tr),
	))

	// Vehicle routes
	mux.Handle("GET /houses/{id}/vehicles", Chain(
		http.HandlerFunc(vehicleH.ListByHouse),
		auth, RequirePermission(user.PermVehicleRead, tr),
	))
	mux.Handle("POST /houses/{id}/vehicles", Chain(
		http.HandlerFunc(vehicleH.Create),
		auth, RequirePermission(user.PermVehicleCreate, tr),
	))
	mux.Handle("PUT /vehicles/{id}", Chain(
		http.HandlerFunc(vehicleH.Update),
		auth, RequirePermission(user.PermVehicleUpdate, tr),
	))
	mux.Handle("DELETE /vehicles/{id}", Chain(
		http.HandlerFunc(vehicleH.Delete),
		auth, RequirePermission(user.PermVehicleDelete, tr),
	))
	mux.Handle("POST /vehicles/{id}/access-controls/{control_id}", Chain(
		http.HandlerFunc(vehicleH.AssignAccessControl),
		auth, RequirePermission(user.PermVehicleUpdate, tr),
	))
	mux.Handle("DELETE /vehicles/{id}/access-controls/{control_id}", Chain(
		http.HandlerFunc(vehicleH.UnassignAccessControl),
		auth, RequirePermission(user.PermVehicleUpdate, tr),
	))

	// User admin routes
	mux.Handle("POST /users", Chain(
		http.HandlerFunc(userAdminH.Create),
		auth, RequirePermission(user.PermUserCreate, tr),
	))
	mux.Handle("GET /users", Chain(
		http.HandlerFunc(userAdminH.List),
		auth, RequirePermission(user.PermUserList, tr),
	))
	mux.Handle("PATCH /users/{id}/role", Chain(
		http.HandlerFunc(userAdminH.UpdateRole),
		auth, RequirePermission(user.PermUserUpdateRole, tr),
	))
	mux.Handle("PUT /users/{id}/password", Chain(
		http.HandlerFunc(userAdminH.UpdatePassword),
		auth, RequirePermission(user.PermUserUpdatePassword, tr),
	))
	mux.Handle("DELETE /users/{id}", Chain(
		http.HandlerFunc(userAdminH.Delete),
		auth, RequirePermission(user.PermUserDelete, tr),
	))
	mux.Handle("GET /houses/{id}/users", Chain(
		http.HandlerFunc(userAdminH.ListUsersForHouse),
		auth, RequirePermission(user.PermUserList, tr),
	))
	mux.Handle("GET /users/{id}/houses", Chain(
		http.HandlerFunc(userAdminH.ListHouses),
		auth, RequirePermission(user.PermUserManageHouses, tr),
	))
	mux.Handle("POST /users/{id}/houses", Chain(
		http.HandlerFunc(userAdminH.AssignHouse),
		auth, RequirePermission(user.PermUserManageHouses, tr),
	))
	mux.Handle("DELETE /users/{id}/houses/{house_id}", Chain(
		http.HandlerFunc(userAdminH.UnassignHouse),
		auth, RequirePermission(user.PermUserManageHouses, tr),
	))
}
