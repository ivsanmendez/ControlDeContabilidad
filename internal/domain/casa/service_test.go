package casa_test

import (
	"context"
	"testing"
	"time"

	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/casa"
)

// fakeRepo is an in-memory fake for casa.Repository.
type fakeRepo struct {
	casas        map[int64]*casa.Casa
	contributors map[int64]int64 // contributorID → casaID
	nextID       int64
}

func newFakeRepo() *fakeRepo {
	return &fakeRepo{
		casas:        make(map[int64]*casa.Casa),
		contributors: make(map[int64]int64),
		nextID:       1,
	}
}

func (r *fakeRepo) Save(ctx context.Context, c *casa.Casa) error {
	for _, existing := range r.casas {
		if existing.Name == c.Name {
			return casa.ErrDuplicate
		}
	}
	c.ID = r.nextID
	r.nextID++
	cp := *c
	r.casas[c.ID] = &cp
	return nil
}

func (r *fakeRepo) Update(ctx context.Context, c *casa.Casa) error {
	if _, ok := r.casas[c.ID]; !ok {
		return casa.ErrNotFound
	}
	for id, existing := range r.casas {
		if existing.Name == c.Name && id != c.ID {
			return casa.ErrDuplicate
		}
	}
	cp := *c
	r.casas[c.ID] = &cp
	return nil
}

func (r *fakeRepo) FindByID(ctx context.Context, id int64) (*casa.Casa, error) {
	c, ok := r.casas[id]
	if !ok {
		return nil, casa.ErrNotFound
	}
	cp := *c
	return &cp, nil
}

func (r *fakeRepo) FindDetailedByID(ctx context.Context, id int64) (*casa.CasaDetail, error) {
	c, ok := r.casas[id]
	if !ok {
		return nil, casa.ErrNotFound
	}
	return &casa.CasaDetail{Casa: *c, Contributors: nil}, nil
}

func (r *fakeRepo) FindAll(ctx context.Context) ([]casa.Casa, error) {
	out := make([]casa.Casa, 0, len(r.casas))
	for _, c := range r.casas {
		out = append(out, *c)
	}
	return out, nil
}

func (r *fakeRepo) Delete(ctx context.Context, id int64) error {
	if _, ok := r.casas[id]; !ok {
		return casa.ErrNotFound
	}
	delete(r.casas, id)
	return nil
}

func (r *fakeRepo) AssignContributor(ctx context.Context, casaID, contributorID int64) error {
	r.contributors[contributorID] = casaID
	return nil
}

func (r *fakeRepo) UnassignContributor(ctx context.Context, contributorID int64) error {
	delete(r.contributors, contributorID)
	return nil
}

// --- Tests ---

func TestCreateCasa_HappyPath(t *testing.T) {
	svc := casa.NewService(newFakeRepo())
	c, err := svc.CreateCasa(context.Background(), "Casa 1", "Calle Roble 12", "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if c.ID == 0 {
		t.Error("expected ID to be set after save")
	}
	if c.Name != "Casa 1" {
		t.Errorf("expected name 'Casa 1', got %q", c.Name)
	}
}

func TestCreateCasa_EmptyName(t *testing.T) {
	svc := casa.NewService(newFakeRepo())
	_, err := svc.CreateCasa(context.Background(), "", "", "")
	if err != casa.ErrEmptyName {
		t.Fatalf("expected ErrEmptyName, got %v", err)
	}
}

func TestCreateCasa_Duplicate(t *testing.T) {
	svc := casa.NewService(newFakeRepo())
	_, err := svc.CreateCasa(context.Background(), "Casa 1", "", "")
	if err != nil {
		t.Fatalf("first create: %v", err)
	}
	_, err = svc.CreateCasa(context.Background(), "Casa 1", "", "")
	if err != casa.ErrDuplicate {
		t.Fatalf("expected ErrDuplicate, got %v", err)
	}
}

func TestUpdateCasa_HappyPath(t *testing.T) {
	svc := casa.NewService(newFakeRepo())
	c, _ := svc.CreateCasa(context.Background(), "Casa 1", "", "")

	updated, err := svc.UpdateCasa(context.Background(), c.ID, "Casa 1 Actualizada", "Av. Central 5", "Notas")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if updated.Name != "Casa 1 Actualizada" {
		t.Errorf("expected updated name, got %q", updated.Name)
	}
	if updated.UpdatedAt.Before(c.CreatedAt) {
		t.Error("UpdatedAt should be >= CreatedAt")
	}
}

func TestUpdateCasa_NotFound(t *testing.T) {
	svc := casa.NewService(newFakeRepo())
	_, err := svc.UpdateCasa(context.Background(), 999, "X", "", "")
	if err != casa.ErrNotFound {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
}

func TestUpdateCasa_EmptyName(t *testing.T) {
	svc := casa.NewService(newFakeRepo())
	c, _ := svc.CreateCasa(context.Background(), "Casa 1", "", "")
	_, err := svc.UpdateCasa(context.Background(), c.ID, "", "", "")
	if err != casa.ErrEmptyName {
		t.Fatalf("expected ErrEmptyName, got %v", err)
	}
}

func TestDeleteCasa_HappyPath(t *testing.T) {
	svc := casa.NewService(newFakeRepo())
	c, _ := svc.CreateCasa(context.Background(), "Casa 1", "", "")
	if err := svc.DeleteCasa(context.Background(), c.ID); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestDeleteCasa_NotFound(t *testing.T) {
	svc := casa.NewService(newFakeRepo())
	err := svc.DeleteCasa(context.Background(), 999)
	if err != casa.ErrNotFound {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
}

func TestAssignContributor(t *testing.T) {
	repo := newFakeRepo()
	svc := casa.NewService(repo)
	c, _ := svc.CreateCasa(context.Background(), "Casa 1", "", "")

	if err := svc.AssignContributor(context.Background(), c.ID, 42); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if repo.contributors[42] != c.ID {
		t.Errorf("expected contributor 42 assigned to casa %d", c.ID)
	}
}

func TestAssignContributor_CasaNotFound(t *testing.T) {
	svc := casa.NewService(newFakeRepo())
	err := svc.AssignContributor(context.Background(), 999, 42)
	if err != casa.ErrNotFound {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
}

func TestUnassignContributor(t *testing.T) {
	repo := newFakeRepo()
	svc := casa.NewService(repo)
	c, _ := svc.CreateCasa(context.Background(), "Casa 1", "", "")
	_ = svc.AssignContributor(context.Background(), c.ID, 42)

	if err := svc.UnassignContributor(context.Background(), 42); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, ok := repo.contributors[42]; ok {
		t.Error("expected contributor 42 to be unassigned")
	}
}

// Ensure fakeRepo compiles as casa.Repository at test time.
var _ casa.Repository = (*fakeRepo)(nil)

// Ensure timestamps are set on New.
func TestNew_SetsTimestamps(t *testing.T) {
	before := time.Now()
	c, err := casa.New("Casa X", "", "")
	after := time.Now()
	if err != nil {
		t.Fatal(err)
	}
	if c.CreatedAt.Before(before) || c.CreatedAt.After(after) {
		t.Error("CreatedAt out of range")
	}
}