package house

import (
	"context"
	"time"
)

// Repository is the outbound port for house persistence.
type Repository interface {
	Save(ctx context.Context, h *House) error
	Update(ctx context.Context, h *House) error
	FindByID(ctx context.Context, id int64) (*House, error)
	FindDetailedByID(ctx context.Context, id int64) (*HouseDetail, error)
	FindAll(ctx context.Context) ([]House, error)
	Delete(ctx context.Context, id int64) error
	AssignContributor(ctx context.Context, houseID, contributorID int64) error
	UnassignContributor(ctx context.Context, contributorID int64) error
}

// Service orchestrates house use cases.
type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) CreateHouse(ctx context.Context, name, address, notes string) (*House, error) {
	h, err := New(name, address, notes)
	if err != nil {
		return nil, err
	}
	if err := s.repo.Save(ctx, h); err != nil {
		return nil, err
	}
	return h, nil
}

func (s *Service) GetHouse(ctx context.Context, id int64) (*HouseDetail, error) {
	return s.repo.FindDetailedByID(ctx, id)
}

func (s *Service) ListHouses(ctx context.Context) ([]House, error) {
	return s.repo.FindAll(ctx)
}

func (s *Service) UpdateHouse(ctx context.Context, id int64, name, address, notes string) (*House, error) {
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

func (s *Service) DeleteHouse(ctx context.Context, id int64) error {
	if _, err := s.repo.FindByID(ctx, id); err != nil {
		return err
	}
	return s.repo.Delete(ctx, id)
}

func (s *Service) AssignContributor(ctx context.Context, houseID, contributorID int64) error {
	if _, err := s.repo.FindByID(ctx, houseID); err != nil {
		return err
	}
	return s.repo.AssignContributor(ctx, houseID, contributorID)
}

func (s *Service) UnassignContributor(ctx context.Context, contributorID int64) error {
	return s.repo.UnassignContributor(ctx, contributorID)
}