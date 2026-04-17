package casa

import (
	"context"
	"time"
)

// Repository is the outbound port for casa persistence.
type Repository interface {
	Save(ctx context.Context, c *Casa) error
	Update(ctx context.Context, c *Casa) error
	FindByID(ctx context.Context, id int64) (*Casa, error)
	FindDetailedByID(ctx context.Context, id int64) (*CasaDetail, error)
	FindAll(ctx context.Context) ([]Casa, error)
	Delete(ctx context.Context, id int64) error
	AssignContributor(ctx context.Context, casaID, contributorID int64) error
	UnassignContributor(ctx context.Context, contributorID int64) error
}

// Service orchestrates casa use cases.
type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) CreateCasa(ctx context.Context, name, address, notes string) (*Casa, error) {
	c, err := New(name, address, notes)
	if err != nil {
		return nil, err
	}
	if err := s.repo.Save(ctx, c); err != nil {
		return nil, err
	}
	return c, nil
}

func (s *Service) GetCasa(ctx context.Context, id int64) (*CasaDetail, error) {
	return s.repo.FindDetailedByID(ctx, id)
}

func (s *Service) ListCasas(ctx context.Context) ([]Casa, error) {
	return s.repo.FindAll(ctx)
}

func (s *Service) UpdateCasa(ctx context.Context, id int64, name, address, notes string) (*Casa, error) {
	existing, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if name == "" {
		return nil, ErrEmptyName
	}

	existing.Name = name
	existing.Address = address
	existing.Notes = notes
	existing.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, err
	}
	return existing, nil
}

func (s *Service) DeleteCasa(ctx context.Context, id int64) error {
	if _, err := s.repo.FindByID(ctx, id); err != nil {
		return err
	}
	return s.repo.Delete(ctx, id)
}

func (s *Service) AssignContributor(ctx context.Context, casaID, contributorID int64) error {
	if _, err := s.repo.FindByID(ctx, casaID); err != nil {
		return err
	}
	return s.repo.AssignContributor(ctx, casaID, contributorID)
}

func (s *Service) UnassignContributor(ctx context.Context, contributorID int64) error {
	return s.repo.UnassignContributor(ctx, contributorID)
}