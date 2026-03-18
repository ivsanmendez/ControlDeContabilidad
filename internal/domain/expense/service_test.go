package expense_test

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/expense"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/user"
)

// fakeRepo is an in-memory implementation of expense.Repository.
type fakeRepo struct {
	data    map[int64]*expense.Expense
	nextID  int64
	saveErr error
}

func newFakeRepo() *fakeRepo {
	return &fakeRepo{data: make(map[int64]*expense.Expense), nextID: 1}
}

func (r *fakeRepo) Save(_ context.Context, e *expense.Expense) error {
	if r.saveErr != nil {
		return r.saveErr
	}
	e.ID = r.nextID
	r.nextID++
	cp := *e
	r.data[e.ID] = &cp
	return nil
}

func (r *fakeRepo) Update(_ context.Context, e *expense.Expense) error {
	if _, ok := r.data[e.ID]; !ok {
		return expense.ErrNotFound
	}
	cp := *e
	r.data[e.ID] = &cp
	return nil
}

func (r *fakeRepo) FindByID(_ context.Context, id int64) (*expense.Expense, error) {
	e, ok := r.data[id]
	if !ok {
		return nil, expense.ErrNotFound
	}
	cp := *e
	return &cp, nil
}

func (r *fakeRepo) FindDetailedByID(_ context.Context, id int64) (*expense.ExpenseDetail, error) {
	e, ok := r.data[id]
	if !ok {
		return nil, expense.ErrNotFound
	}
	return &expense.ExpenseDetail{
		ID: e.ID, UserID: e.UserID, Description: e.Description,
		Amount: e.Amount, CategoryID: e.CategoryID, CategoryName: "Test",
		Date: e.Date, CreatedAt: e.CreatedAt, UpdatedAt: e.UpdatedAt,
	}, nil
}

func (r *fakeRepo) FindAll(_ context.Context) ([]expense.Expense, error) {
	result := make([]expense.Expense, 0, len(r.data))
	for _, e := range r.data {
		result = append(result, *e)
	}
	return result, nil
}

func (r *fakeRepo) FindAllByUser(_ context.Context, userID int64) ([]expense.Expense, error) {
	var result []expense.Expense
	for _, e := range r.data {
		if e.UserID == userID {
			result = append(result, *e)
		}
	}
	return result, nil
}

func (r *fakeRepo) FindAllDetailed(_ context.Context) ([]expense.ExpenseDetail, error) {
	result := make([]expense.ExpenseDetail, 0, len(r.data))
	for _, e := range r.data {
		result = append(result, expense.ExpenseDetail{
			ID: e.ID, UserID: e.UserID, Description: e.Description,
			Amount: e.Amount, CategoryID: e.CategoryID, CategoryName: "Test",
			Date: e.Date, CreatedAt: e.CreatedAt, UpdatedAt: e.UpdatedAt,
		})
	}
	return result, nil
}

func (r *fakeRepo) FindAllDetailedByUser(_ context.Context, userID int64) ([]expense.ExpenseDetail, error) {
	var result []expense.ExpenseDetail
	for _, e := range r.data {
		if e.UserID == userID {
			result = append(result, expense.ExpenseDetail{
				ID: e.ID, UserID: e.UserID, Description: e.Description,
				Amount: e.Amount, CategoryID: e.CategoryID, CategoryName: "Test",
				Date: e.Date, CreatedAt: e.CreatedAt, UpdatedAt: e.UpdatedAt,
			})
		}
	}
	return result, nil
}

func (r *fakeRepo) FindDetailedPaginated(_ context.Context, userID *int64, params expense.ListParams) (*expense.PaginatedResult, error) {
	var all []expense.ExpenseDetail
	for _, e := range r.data {
		if userID != nil && e.UserID != *userID {
			continue
		}
		if params.DateFrom != nil && e.Date.Before(*params.DateFrom) {
			continue
		}
		if params.DateTo != nil && e.Date.After(*params.DateTo) {
			continue
		}
		if params.CategoryID != nil && e.CategoryID != *params.CategoryID {
			continue
		}
		if params.Search != "" && !strings.Contains(strings.ToLower(e.Description), strings.ToLower(params.Search)) {
			continue
		}
		all = append(all, expense.ExpenseDetail{
			ID: e.ID, UserID: e.UserID, Description: e.Description,
			Amount: e.Amount, CategoryID: e.CategoryID, CategoryName: "Test",
			Date: e.Date, CreatedAt: e.CreatedAt, UpdatedAt: e.UpdatedAt,
		})
	}
	total := len(all)
	offset := (params.Page - 1) * params.PageSize
	if offset > total {
		offset = total
	}
	end := offset + params.PageSize
	if end > total {
		end = total
	}
	return &expense.PaginatedResult{
		Items:    all[offset:end],
		Total:    total,
		Page:     params.Page,
		PageSize: params.PageSize,
	}, nil
}

func (r *fakeRepo) Delete(_ context.Context, id int64) error {
	if _, ok := r.data[id]; !ok {
		return expense.ErrNotFound
	}
	delete(r.data, id)
	return nil
}

// fakePublisher records published events.
type fakePublisher struct {
	events []expense.Event
}

func (p *fakePublisher) Publish(_ context.Context, e expense.Event) error {
	p.events = append(p.events, e)
	return nil
}

func newService() (*expense.Service, *fakeRepo, *fakePublisher) {
	repo := newFakeRepo()
	pub := &fakePublisher{}
	svc := expense.NewService(repo, pub)
	return svc, repo, pub
}

var (
	ctx      = context.Background()
	testDate = time.Date(2026, 2, 17, 0, 0, 0, 0, time.UTC)
)

const (
	userID1    int64 = 1
	userID2    int64 = 2
	categoryID int64 = 1
)

func TestCreateExpense_HappyPath(t *testing.T) {
	svc, repo, pub := newService()

	e, err := svc.CreateExpense(ctx, userID1, "Lunch", 12.50, categoryID, testDate)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if e.ID == 0 {
		t.Error("expected ID to be set after save")
	}
	if e.UserID != userID1 {
		t.Errorf("userID = %d, want %d", e.UserID, userID1)
	}
	if _, ok := repo.data[e.ID]; !ok {
		t.Error("expense not found in repo after create")
	}
	if len(pub.events) != 1 || pub.events[0].Type != expense.EventCreated {
		t.Errorf("expected one EventCreated, got %v", pub.events)
	}
}

func TestCreateExpense_InvalidInput(t *testing.T) {
	svc, _, pub := newService()

	_, err := svc.CreateExpense(ctx, userID1, "", 12.50, categoryID, testDate)
	if !errors.Is(err, expense.ErrEmptyDescription) {
		t.Errorf("expected ErrEmptyDescription, got %v", err)
	}
	if len(pub.events) != 0 {
		t.Error("no event should be published on invalid input")
	}
}

func TestCreateExpense_InvalidCategoryID(t *testing.T) {
	svc, _, pub := newService()

	_, err := svc.CreateExpense(ctx, userID1, "Lunch", 12.50, 0, testDate)
	if !errors.Is(err, expense.ErrInvalidCategoryID) {
		t.Errorf("expected ErrInvalidCategoryID, got %v", err)
	}
	if len(pub.events) != 0 {
		t.Error("no event should be published on invalid input")
	}
}

func TestCreateExpense_RepoError(t *testing.T) {
	svc, repo, _ := newService()
	repo.saveErr = errors.New("db unavailable")

	_, err := svc.CreateExpense(ctx, userID1, "Taxi", 8.00, categoryID, testDate)
	if err == nil {
		t.Fatal("expected error from repo, got nil")
	}
}

func TestGetExpense_OwnerCanAccess(t *testing.T) {
	svc, _, _ := newService()
	created, _ := svc.CreateExpense(ctx, userID1, "Bus", 2.50, categoryID, testDate)

	got, err := svc.GetExpense(ctx, userID1, user.RoleUser, created.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.ID != created.ID {
		t.Errorf("id = %d, want %d", got.ID, created.ID)
	}
}

func TestGetExpense_AdminCanAccessAny(t *testing.T) {
	svc, _, _ := newService()
	created, _ := svc.CreateExpense(ctx, userID1, "Bus", 2.50, categoryID, testDate)

	got, err := svc.GetExpense(ctx, userID2, user.RoleAdmin, created.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.ID != created.ID {
		t.Errorf("id = %d, want %d", got.ID, created.ID)
	}
}

func TestGetExpense_NonOwnerForbidden(t *testing.T) {
	svc, _, _ := newService()
	created, _ := svc.CreateExpense(ctx, userID1, "Bus", 2.50, categoryID, testDate)

	_, err := svc.GetExpense(ctx, userID2, user.RoleUser, created.ID)
	if !errors.Is(err, expense.ErrForbidden) {
		t.Errorf("expected ErrForbidden, got %v", err)
	}
}

func TestGetExpense_NotFound(t *testing.T) {
	svc, _, _ := newService()

	_, err := svc.GetExpense(ctx, userID1, user.RoleUser, 999)
	if !errors.Is(err, expense.ErrNotFound) {
		t.Errorf("expected ErrNotFound, got %v", err)
	}
}

func TestListExpenses_UserSeesOnlyOwn(t *testing.T) {
	svc, _, _ := newService()
	svc.CreateExpense(ctx, userID1, "Coffee", 3.00, categoryID, testDate)
	svc.CreateExpense(ctx, userID2, "Metro", 1.50, categoryID, testDate)

	result, err := svc.ListExpenses(ctx, userID1, user.RoleUser, expense.ListParams{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result.Items) != 1 {
		t.Errorf("expected 1 expense, got %d", len(result.Items))
	}
	if result.Total != 1 {
		t.Errorf("expected total=1, got %d", result.Total)
	}
}

func TestListExpenses_AdminSeesAll(t *testing.T) {
	svc, _, _ := newService()
	svc.CreateExpense(ctx, userID1, "Coffee", 3.00, categoryID, testDate)
	svc.CreateExpense(ctx, userID2, "Metro", 1.50, categoryID, testDate)

	result, err := svc.ListExpenses(ctx, userID1, user.RoleAdmin, expense.ListParams{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result.Items) != 2 {
		t.Errorf("expected 2 expenses, got %d", len(result.Items))
	}
	if result.Total != 2 {
		t.Errorf("expected total=2, got %d", result.Total)
	}
}

func TestListExpenses_Paginated(t *testing.T) {
	svc, _, _ := newService()
	for i := 0; i < 5; i++ {
		svc.CreateExpense(ctx, userID1, "Item", 1.00, categoryID, testDate)
	}

	result, err := svc.ListExpenses(ctx, userID1, user.RoleUser, expense.ListParams{Page: 1, PageSize: 2})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result.Items) != 2 {
		t.Errorf("expected 2 items on page, got %d", len(result.Items))
	}
	if result.Total != 5 {
		t.Errorf("expected total=5, got %d", result.Total)
	}
	if result.Page != 1 {
		t.Errorf("expected page=1, got %d", result.Page)
	}
}

func TestListExpenses_FilterBySearch(t *testing.T) {
	svc, _, _ := newService()
	svc.CreateExpense(ctx, userID1, "Coffee at Starbucks", 5.00, categoryID, testDate)
	svc.CreateExpense(ctx, userID1, "Metro ticket", 1.50, categoryID, testDate)

	result, err := svc.ListExpenses(ctx, userID1, user.RoleUser, expense.ListParams{Search: "coffee"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result.Items) != 1 {
		t.Errorf("expected 1 matching expense, got %d", len(result.Items))
	}
	if result.Total != 1 {
		t.Errorf("expected total=1, got %d", result.Total)
	}
}

func TestDeleteExpense_OwnerCanDelete(t *testing.T) {
	svc, repo, pub := newService()
	created, _ := svc.CreateExpense(ctx, userID1, "Dinner", 30.00, categoryID, testDate)
	pub.events = nil

	err := svc.DeleteExpense(ctx, userID1, user.RoleUser, created.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := repo.data[created.ID]; ok {
		t.Error("expense should be removed from repo after delete")
	}
	if len(pub.events) != 1 || pub.events[0].Type != expense.EventDeleted {
		t.Errorf("expected one EventDeleted, got %v", pub.events)
	}
}

func TestDeleteExpense_NonOwnerForbidden(t *testing.T) {
	svc, _, _ := newService()
	created, _ := svc.CreateExpense(ctx, userID1, "Dinner", 30.00, categoryID, testDate)

	err := svc.DeleteExpense(ctx, userID2, user.RoleUser, created.ID)
	if !errors.Is(err, expense.ErrForbidden) {
		t.Errorf("expected ErrForbidden, got %v", err)
	}
}

func TestDeleteExpense_AdminCanDeleteAny(t *testing.T) {
	svc, repo, _ := newService()
	created, _ := svc.CreateExpense(ctx, userID1, "Dinner", 30.00, categoryID, testDate)

	err := svc.DeleteExpense(ctx, userID2, user.RoleAdmin, created.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := repo.data[created.ID]; ok {
		t.Error("expense should be removed")
	}
}

func TestDeleteExpense_NotFound(t *testing.T) {
	svc, _, _ := newService()

	err := svc.DeleteExpense(ctx, userID1, user.RoleUser, 999)
	if !errors.Is(err, expense.ErrNotFound) {
		t.Errorf("expected ErrNotFound, got %v", err)
	}
}

func TestGetExpenseDetail_HappyPath(t *testing.T) {
	svc, _, _ := newService()
	created, _ := svc.CreateExpense(ctx, userID1, "Lunch", 12.50, categoryID, testDate)

	detail, err := svc.GetExpenseDetail(ctx, userID1, user.RoleUser, created.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if detail.ID != created.ID {
		t.Errorf("id = %d, want %d", detail.ID, created.ID)
	}
	if detail.CategoryName != "Test" {
		t.Errorf("category_name = %q, want %q", detail.CategoryName, "Test")
	}
}

func TestGetExpenseDetail_NonOwnerForbidden(t *testing.T) {
	svc, _, _ := newService()
	created, _ := svc.CreateExpense(ctx, userID1, "Lunch", 12.50, categoryID, testDate)

	_, err := svc.GetExpenseDetail(ctx, userID2, user.RoleUser, created.ID)
	if !errors.Is(err, expense.ErrForbidden) {
		t.Errorf("expected ErrForbidden, got %v", err)
	}
}

func TestGetExpenseDetail_NotFound(t *testing.T) {
	svc, _, _ := newService()

	_, err := svc.GetExpenseDetail(ctx, userID1, user.RoleUser, 999)
	if !errors.Is(err, expense.ErrNotFound) {
		t.Errorf("expected ErrNotFound, got %v", err)
	}
}
