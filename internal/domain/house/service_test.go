package house_test

import (
	"context"
	"testing"
	"time"

	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/house"
)

// fakeRepo is an in-memory fake for house.Repository.
type fakeRepo struct {
	houses       map[int64]*house.House
	contributors map[int64]int64 // contributorID → houseID
	nextID       int64
}

func newFakeRepo() *fakeRepo {
	return &fakeRepo{
		houses:       make(map[int64]*house.House),
		contributors: make(map[int64]int64),
		nextID:       1,
	}
}

func (r *fakeRepo) Save(ctx context.Context, h *house.House) error {
	for _, existing := range r.houses {
		if existing.Name == h.Name {
			return house.ErrDuplicate
		}
	}
	h.ID = r.nextID
	r.nextID++
	cp := *h
	r.houses[h.ID] = &cp
	return nil
}

func (r *fakeRepo) Update(ctx context.Context, h *house.House) error {
	if _, ok := r.houses[h.ID]; !ok {
		return house.ErrNotFound
	}
	for id, existing := range r.houses {
		if existing.Name == h.Name && id != h.ID {
			return house.ErrDuplicate
		}
	}
	cp := *h
	r.houses[h.ID] = &cp
	return nil
}

func (r *fakeRepo) FindByID(ctx context.Context, id int64) (*house.House, error) {
	h, ok := r.houses[id]
	if !ok {
		return nil, house.ErrNotFound
	}
	cp := *h
	return &cp, nil
}

func (r *fakeRepo) FindDetailedByID(ctx context.Context, id int64) (*house.HouseDetail, error) {
	h, ok := r.houses[id]
	if !ok {
		return nil, house.ErrNotFound
	}
	return &house.HouseDetail{House: *h, Contributors: nil}, nil
}

func (r *fakeRepo) FindAll(ctx context.Context) ([]house.House, error) {
	out := make([]house.House, 0, len(r.houses))
	for _, h := range r.houses {
		out = append(out, *h)
	}
	return out, nil
}

func (r *fakeRepo) Delete(ctx context.Context, id int64) error {
	if _, ok := r.houses[id]; !ok {
		return house.ErrNotFound
	}
	delete(r.houses, id)
	return nil
}

func (r *fakeRepo) AssignContributor(ctx context.Context, houseID, contributorID int64) error {
	r.contributors[contributorID] = houseID
	return nil
}

func (r *fakeRepo) UnassignContributor(ctx context.Context, contributorID int64) error {
	delete(r.contributors, contributorID)
	return nil
}

// Compile-time check.
var _ house.Repository = (*fakeRepo)(nil)

// --- Tests ---

func TestCreateHouse_HappyPath(t *testing.T) {
	svc := house.NewService(newFakeRepo())
	h, err := svc.CreateHouse(context.Background(), "House 1", "Oak St 12", "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if h.ID == 0 {
		t.Error("expected ID to be set after save")
	}
	if h.Name != "House 1" {
		t.Errorf("expected name 'House 1', got %q", h.Name)
	}
}

func TestCreateHouse_EmptyName(t *testing.T) {
	svc := house.NewService(newFakeRepo())
	_, err := svc.CreateHouse(context.Background(), "", "", "")
	if err != house.ErrEmptyName {
		t.Fatalf("expected ErrEmptyName, got %v", err)
	}
}

func TestCreateHouse_Duplicate(t *testing.T) {
	svc := house.NewService(newFakeRepo())
	_, _ = svc.CreateHouse(context.Background(), "House 1", "", "")
	_, err := svc.CreateHouse(context.Background(), "House 1", "", "")
	if err != house.ErrDuplicate {
		t.Fatalf("expected ErrDuplicate, got %v", err)
	}
}

func TestUpdateHouse_HappyPath(t *testing.T) {
	svc := house.NewService(newFakeRepo())
	h, _ := svc.CreateHouse(context.Background(), "House 1", "", "")
	updated, err := svc.UpdateHouse(context.Background(), h.ID, "House 1 Updated", "Central Ave 5", "Notes")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if updated.Name != "House 1 Updated" {
		t.Errorf("expected updated name, got %q", updated.Name)
	}
	if updated.UpdatedAt.Before(h.CreatedAt) {
		t.Error("UpdatedAt should be >= CreatedAt")
	}
}

func TestUpdateHouse_NotFound(t *testing.T) {
	svc := house.NewService(newFakeRepo())
	_, err := svc.UpdateHouse(context.Background(), 999, "X", "", "")
	if err != house.ErrNotFound {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
}

func TestUpdateHouse_EmptyName(t *testing.T) {
	svc := house.NewService(newFakeRepo())
	h, _ := svc.CreateHouse(context.Background(), "House 1", "", "")
	_, err := svc.UpdateHouse(context.Background(), h.ID, "", "", "")
	if err != house.ErrEmptyName {
		t.Fatalf("expected ErrEmptyName, got %v", err)
	}
}

func TestDeleteHouse_HappyPath(t *testing.T) {
	svc := house.NewService(newFakeRepo())
	h, _ := svc.CreateHouse(context.Background(), "House 1", "", "")
	if err := svc.DeleteHouse(context.Background(), h.ID); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestDeleteHouse_NotFound(t *testing.T) {
	svc := house.NewService(newFakeRepo())
	err := svc.DeleteHouse(context.Background(), 999)
	if err != house.ErrNotFound {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
}

func TestAssignContributor(t *testing.T) {
	repo := newFakeRepo()
	svc := house.NewService(repo)
	h, _ := svc.CreateHouse(context.Background(), "House 1", "", "")
	if err := svc.AssignContributor(context.Background(), h.ID, 42); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if repo.contributors[42] != h.ID {
		t.Errorf("expected contributor 42 assigned to house %d", h.ID)
	}
}

func TestAssignContributor_HouseNotFound(t *testing.T) {
	svc := house.NewService(newFakeRepo())
	err := svc.AssignContributor(context.Background(), 999, 42)
	if err != house.ErrNotFound {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
}

func TestUnassignContributor(t *testing.T) {
	repo := newFakeRepo()
	svc := house.NewService(repo)
	h, _ := svc.CreateHouse(context.Background(), "House 1", "", "")
	_ = svc.AssignContributor(context.Background(), h.ID, 42)
	if err := svc.UnassignContributor(context.Background(), 42); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := repo.contributors[42]; ok {
		t.Error("expected contributor 42 to be unassigned")
	}
}

func TestNew_SetsTimestamps(t *testing.T) {
	before := time.Now()
	h, err := house.New("House X", "", "")
	after := time.Now()
	if err != nil {
		t.Fatal(err)
	}
	if h.CreatedAt.Before(before) || h.CreatedAt.After(after) {
		t.Error("CreatedAt out of range")
	}
}