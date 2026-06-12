package vehicle

import (
	"context"
	"time"
)

// Repository is the outbound port for vehicle persistence.
type Repository interface {
	Save(ctx context.Context, v *Vehicle) error
	Update(ctx context.Context, v *Vehicle) error
	FindByID(ctx context.Context, id int64) (*Vehicle, error)
	FindByHouseID(ctx context.Context, houseID int64) ([]Vehicle, error)
	Delete(ctx context.Context, id int64) error
	AssignAccessControl(ctx context.Context, vehicleID, accessControlID int64) error
	UnassignAccessControl(ctx context.Context, vehicleID, accessControlID int64) error
}

// Service orchestrates vehicle use cases.
type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) CreateVehicle(ctx context.Context, houseID int64, plate, color, brand, model, notes string) (*Vehicle, error) {
	v, err := New(houseID, plate, color, brand, model, notes)
	if err != nil {
		return nil, err
	}
	if err := s.repo.Save(ctx, v); err != nil {
		return nil, err
	}
	return v, nil
}

func (s *Service) GetVehicle(ctx context.Context, id int64) (*Vehicle, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *Service) ListByHouse(ctx context.Context, houseID int64) ([]Vehicle, error) {
	return s.repo.FindByHouseID(ctx, houseID)
}

func (s *Service) UpdateVehicle(ctx context.Context, id int64, plate, color, brand, model, notes string) (*Vehicle, error) {
	existing, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if plate == "" {
		return nil, ErrEmptyPlate
	}
	if color == "" {
		return nil, ErrEmptyColor
	}
	existing.Plate = plate
	existing.Color = color
	existing.Brand = brand
	existing.Model = model
	existing.Notes = notes
	existing.UpdatedAt = time.Now()
	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, err
	}
	return existing, nil
}

func (s *Service) DeleteVehicle(ctx context.Context, id int64) error {
	if _, err := s.repo.FindByID(ctx, id); err != nil {
		return err
	}
	return s.repo.Delete(ctx, id)
}

func (s *Service) AssignAccessControl(ctx context.Context, vehicleID, accessControlID int64) error {
	if _, err := s.repo.FindByID(ctx, vehicleID); err != nil {
		return err
	}
	return s.repo.AssignAccessControl(ctx, vehicleID, accessControlID)
}

func (s *Service) UnassignAccessControl(ctx context.Context, vehicleID, accessControlID int64) error {
	if _, err := s.repo.FindByID(ctx, vehicleID); err != nil {
		return err
	}
	return s.repo.UnassignAccessControl(ctx, vehicleID, accessControlID)
}