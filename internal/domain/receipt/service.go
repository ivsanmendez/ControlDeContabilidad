package receipt

import "context"

// Repository is the outbound port for receipt folio persistence.
type Repository interface {
	NextSequence(ctx context.Context, year int) (int, error)
	Save(ctx context.Context, rf *ReceiptFolio) error
	FindByFolio(ctx context.Context, folio string) (*ReceiptFolio, error)
}

// Service implements receipt folio use cases.
type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

// GenerateNewFolio atomically obtains the next sequence for the given year,
// generates a random suffix, and returns the formatted folio string.
func (s *Service) GenerateNewFolio(ctx context.Context, year int) (folio string, seq int, suffix string, err error) {
	seq, err = s.repo.NextSequence(ctx, year)
	if err != nil {
		return "", 0, "", err
	}

	suffix, err = GenerateUUIDSuffix()
	if err != nil {
		return "", 0, "", err
	}

	folio = GenerateFolio(year, seq, suffix)
	return folio, seq, suffix, nil
}

// SaveFolio persists a fully populated ReceiptFolio after signing.
func (s *Service) SaveFolio(ctx context.Context, rf *ReceiptFolio) error {
	return s.repo.Save(ctx, rf)
}

// VerifyFolio looks up a receipt folio by its folio string.
func (s *Service) VerifyFolio(ctx context.Context, folio string) (*ReceiptFolio, error) {
	return s.repo.FindByFolio(ctx, folio)
}
