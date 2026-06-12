package accesscontrol

import (
	"context"
	"time"
)

// Repository is the outbound port for access control persistence.
type Repository interface {
	Save(ctx context.Context, ac *AccessControl) error
	Update(ctx context.Context, ac *AccessControl) error
	FindByID(ctx context.Context, id int64) (*AccessControl, error)
	FindByCode(ctx context.Context, code string) (*AccessControl, error)
	FindAll(ctx context.Context) ([]AccessControlWithHouse, error)
	FindByHouseID(ctx context.Context, houseID int64) ([]AccessControl, error)
	CountByHouseID(ctx context.Context, houseID int64) (int, error)
	UpdateStatus(ctx context.Context, id int64, status Status, physicalSyncedAt *time.Time) error
	UpdateAllForHouse(ctx context.Context, houseID int64, status Status) error
	FindPendingSync(ctx context.Context) ([]AccessControl, error)
	FindDistinctHouseIDs(ctx context.Context) ([]int64, error)
	Delete(ctx context.Context, id int64) error
}

// ContributionReader provides contribution data needed for evaluation without
// importing the contribution domain package.
type ContributionReader interface {
	FindLastPaymentDateByHouseID(ctx context.Context, houseID int64) (*time.Time, error)
}

// Service orchestrates access control use cases.
type Service struct {
	repo        Repository
	contribReader ContributionReader
}

func NewService(repo Repository, contribReader ContributionReader) *Service {
	return &Service{repo: repo, contribReader: contribReader}
}

func (s *Service) CreateAccessControl(ctx context.Context, houseID int64, code, adminNumber, notes string) (*AccessControl, error) {
	count, err := s.repo.CountByHouseID(ctx, houseID)
	if err != nil {
		return nil, err
	}
	if count >= 4 {
		return nil, ErrMaxPerHouse
	}

	ac, err := New(houseID, code, adminNumber, notes)
	if err != nil {
		return nil, err
	}
	if err := s.repo.Save(ctx, ac); err != nil {
		return nil, err
	}
	return ac, nil
}

func (s *Service) GetAccessControl(ctx context.Context, id int64) (*AccessControl, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *Service) LookupByCode(ctx context.Context, code string) (*AccessControl, error) {
	return s.repo.FindByCode(ctx, code)
}

func (s *Service) ListAll(ctx context.Context) ([]AccessControlWithHouse, error) {
	return s.repo.FindAll(ctx)
}

func (s *Service) ListByHouse(ctx context.Context, houseID int64) ([]AccessControl, error) {
	return s.repo.FindByHouseID(ctx, houseID)
}

func (s *Service) UpdateAccessControl(ctx context.Context, id int64, code, adminNumber, notes string) (*AccessControl, error) {
	existing, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if code == "" {
		return nil, ErrEmptyCode
	}
	if adminNumber == "" {
		return nil, ErrEmptyAdminNumber
	}
	existing.Code = code
	existing.AdminNumber = adminNumber
	existing.Notes = notes
	existing.UpdatedAt = time.Now()
	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, err
	}
	return existing, nil
}

func (s *Service) ChangeStatus(ctx context.Context, id int64, status Status) (*AccessControl, error) {
	existing, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	var syncedAt *time.Time
	if status == StatusInactive || existing.Status == StatusInactive {
		syncedAt = nil
	} else {
		syncedAt = existing.PhysicalSyncedAt
	}
	if err := s.repo.UpdateStatus(ctx, id, status, syncedAt); err != nil {
		return nil, err
	}
	existing.Status = status
	existing.PhysicalSyncedAt = syncedAt
	return existing, nil
}

func (s *Service) MarkPhysicallySynced(ctx context.Context, id int64) (*AccessControl, error) {
	existing, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	now := time.Now()
	if err := s.repo.UpdateStatus(ctx, id, existing.Status, &now); err != nil {
		return nil, err
	}
	existing.PhysicalSyncedAt = &now
	return existing, nil
}

func (s *Service) DeleteAccessControl(ctx context.Context, id int64) error {
	if _, err := s.repo.FindByID(ctx, id); err != nil {
		return err
	}
	return s.repo.Delete(ctx, id)
}

func (s *Service) ListPendingSync(ctx context.Context) ([]AccessControl, error) {
	return s.repo.FindPendingSync(ctx)
}

func (s *Service) EvaluateHouse(ctx context.Context, houseID int64) error {
	lastPayment, err := s.contribReader.FindLastPaymentDateByHouseID(ctx, houseID)
	if err != nil {
		return err
	}

	status := evaluateStatus(lastPayment)
	return s.repo.UpdateAllForHouse(ctx, houseID, status)
}

func (s *Service) EvaluateAll(ctx context.Context) error {
	houseIDs, err := s.repo.FindDistinctHouseIDs(ctx)
	if err != nil {
		return err
	}
	for _, id := range houseIDs {
		if err := s.EvaluateHouse(ctx, id); err != nil {
			return err
		}
	}
	return nil
}

// evaluateStatus determines the access control status based on the last payment date.
// 0-1 months without payment: active
// 2 months: warning
// 3+ months: inactive
// nil (no payments ever): inactive
func evaluateStatus(lastPayment *time.Time) Status {
	if lastPayment == nil {
		return StatusInactive
	}
	now := time.Now()
	months := monthsDiff(*lastPayment, now)
	switch {
	case months <= 1:
		return StatusActive
	case months == 2:
		return StatusWarning
	default:
		return StatusInactive
	}
}

func monthsDiff(from, to time.Time) int {
	years := to.Year() - from.Year()
	months := int(to.Month()) - int(from.Month())
	total := years*12 + months
	if total < 0 {
		return 0
	}
	return total
}