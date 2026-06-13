package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/lib/pq"

	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/user"
)

// UserRepo implements user.Repository.
type UserRepo struct {
	db *sql.DB
}

func NewUserRepo(db *sql.DB) *UserRepo {
	return &UserRepo{db: db}
}

func (r *UserRepo) Save(ctx context.Context, u *user.User) error {
	const q = `
		INSERT INTO users (email, password_hash, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id`

	err := r.db.QueryRowContext(ctx, q,
		u.Email,
		u.PasswordHash,
		string(u.Role),
		u.CreatedAt,
		u.UpdatedAt,
	).Scan(&u.ID)

	if err != nil {
		var pqErr *pq.Error
		if errors.As(err, &pqErr) && pqErr.Code == "23505" {
			return user.ErrEmailTaken
		}
		return fmt.Errorf("save user: %w", err)
	}
	return nil
}

func (r *UserRepo) FindByID(ctx context.Context, id int64) (*user.User, error) {
	const q = `
		SELECT id, email, password_hash, role, created_at, updated_at
		FROM users WHERE id = $1`

	var u user.User
	var role string

	err := r.db.QueryRowContext(ctx, q, id).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &role, &u.CreatedAt, &u.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, user.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("find user %d: %w", id, err)
	}
	u.Role = user.Role(role)
	return &u, nil
}

func (r *UserRepo) FindByEmail(ctx context.Context, email string) (*user.User, error) {
	const q = `
		SELECT id, email, password_hash, role, created_at, updated_at
		FROM users WHERE email = $1`

	var u user.User
	var role string

	err := r.db.QueryRowContext(ctx, q, email).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &role, &u.CreatedAt, &u.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, user.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("find user by email: %w", err)
	}
	u.Role = user.Role(role)
	return &u, nil
}

func (r *UserRepo) FindAll(ctx context.Context) ([]user.User, error) {
	const q = `
		SELECT id, email, password_hash, role, created_at, updated_at
		FROM users ORDER BY created_at`

	rows, err := r.db.QueryContext(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("find all users: %w", err)
	}
	defer rows.Close()

	var users []user.User
	for rows.Next() {
		var u user.User
		var role string
		if err := rows.Scan(&u.ID, &u.Email, &u.PasswordHash, &role, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan user: %w", err)
		}
		u.Role = user.Role(role)
		users = append(users, u)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("find all users: %w", err)
	}
	return users, nil
}

func (r *UserRepo) UpdateRole(ctx context.Context, id int64, role user.Role) error {
	const q = `UPDATE users SET role=$1, updated_at=NOW() WHERE id=$2`
	result, err := r.db.ExecContext(ctx, q, string(role), id)
	if err != nil {
		return fmt.Errorf("update user role %d: %w", id, err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("update user role %d: %w", id, err)
	}
	if rows == 0 {
		return user.ErrNotFound
	}
	return nil
}

func (r *UserRepo) UpdatePasswordHash(ctx context.Context, id int64, hash string) error {
	const q = `UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2`
	result, err := r.db.ExecContext(ctx, q, hash, id)
	if err != nil {
		return fmt.Errorf("update password hash for user %d: %w", id, err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("update password hash for user %d: %w", id, err)
	}
	if rows == 0 {
		return user.ErrNotFound
	}
	if err := r.RevokeAllUserRefreshTokens(ctx, id); err != nil {
		return fmt.Errorf("revoke tokens after password change for user %d: %w", id, err)
	}
	return nil
}

func (r *UserRepo) Delete(ctx context.Context, id int64) error {
	const q = `DELETE FROM users WHERE id=$1`
	result, err := r.db.ExecContext(ctx, q, id)
	if err != nil {
		return fmt.Errorf("delete user %d: %w", id, err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("delete user %d: %w", id, err)
	}
	if rows == 0 {
		return user.ErrNotFound
	}
	return nil
}

func (r *UserRepo) FindHousesByUserID(ctx context.Context, userID int64) ([]user.HouseAssignment, error) {
	const q = `
		SELECT uh.house_id, h.name, uh.assigned_at
		FROM user_houses uh
		JOIN houses h ON h.id = uh.house_id
		WHERE uh.user_id = $1
		ORDER BY h.name`

	rows, err := r.db.QueryContext(ctx, q, userID)
	if err != nil {
		return nil, fmt.Errorf("find houses for user %d: %w", userID, err)
	}
	defer rows.Close()

	var assignments []user.HouseAssignment
	for rows.Next() {
		var a user.HouseAssignment
		if err := rows.Scan(&a.HouseID, &a.HouseName, &a.AssignedAt); err != nil {
			return nil, fmt.Errorf("scan house assignment: %w", err)
		}
		assignments = append(assignments, a)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("find houses for user %d: %w", userID, err)
	}
	return assignments, nil
}

func (r *UserRepo) FindUsersByHouseID(ctx context.Context, houseID int64) ([]user.User, error) {
	const q = `
		SELECT u.id, u.email, u.password_hash, u.role, u.created_at, u.updated_at
		FROM users u
		JOIN user_houses uh ON uh.user_id = u.id
		WHERE uh.house_id = $1
		ORDER BY u.email`

	rows, err := r.db.QueryContext(ctx, q, houseID)
	if err != nil {
		return nil, fmt.Errorf("find users for house %d: %w", houseID, err)
	}
	defer rows.Close()

	var users []user.User
	for rows.Next() {
		var u user.User
		var role string
		if err := rows.Scan(&u.ID, &u.Email, &u.PasswordHash, &role, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan user: %w", err)
		}
		u.Role = user.Role(role)
		users = append(users, u)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("find users for house %d: %w", houseID, err)
	}
	return users, nil
}

func (r *UserRepo) AssignHouse(ctx context.Context, userID, houseID int64) error {
	const q = `INSERT INTO user_houses (user_id, house_id) VALUES ($1, $2)`
	_, err := r.db.ExecContext(ctx, q, userID, houseID)
	if err != nil {
		var pqErr *pq.Error
		if errors.As(err, &pqErr) && pqErr.Code == "23505" {
			return user.ErrHouseAlreadyAssigned
		}
		return fmt.Errorf("assign house %d to user %d: %w", houseID, userID, err)
	}
	return nil
}

func (r *UserRepo) UnassignHouse(ctx context.Context, userID, houseID int64) error {
	const q = `DELETE FROM user_houses WHERE user_id = $1 AND house_id = $2`
	result, err := r.db.ExecContext(ctx, q, userID, houseID)
	if err != nil {
		return fmt.Errorf("unassign house %d from user %d: %w", houseID, userID, err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("unassign house: %w", err)
	}
	if rows == 0 {
		return user.ErrHouseNotAssigned
	}
	return nil
}

func (r *UserRepo) SaveRefreshToken(ctx context.Context, t *user.RefreshToken) error {
	const q = `
		INSERT INTO refresh_tokens (user_id, token_hash, expires_at, revoked, created_at)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id`

	return r.db.QueryRowContext(ctx, q,
		t.UserID, t.TokenHash, t.ExpiresAt, t.Revoked, t.CreatedAt,
	).Scan(&t.ID)
}

func (r *UserRepo) FindRefreshTokenByHash(ctx context.Context, hash string) (*user.RefreshToken, error) {
	const q = `
		SELECT id, user_id, token_hash, expires_at, revoked, created_at
		FROM refresh_tokens WHERE token_hash = $1`

	var t user.RefreshToken
	err := r.db.QueryRowContext(ctx, q, hash).Scan(
		&t.ID, &t.UserID, &t.TokenHash, &t.ExpiresAt, &t.Revoked, &t.CreatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, user.ErrTokenNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("find refresh token: %w", err)
	}
	return &t, nil
}

func (r *UserRepo) RevokeRefreshToken(ctx context.Context, id int64) error {
	const q = `UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1`
	result, err := r.db.ExecContext(ctx, q, id)
	if err != nil {
		return fmt.Errorf("revoke refresh token %d: %w", id, err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("revoke refresh token %d: %w", id, err)
	}
	if rows == 0 {
		return user.ErrTokenNotFound
	}
	return nil
}

func (r *UserRepo) RevokeAllUserRefreshTokens(ctx context.Context, userID int64) error {
	const q = `UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1 AND revoked = FALSE`
	_, err := r.db.ExecContext(ctx, q, userID)
	if err != nil {
		return fmt.Errorf("revoke all tokens for user %d: %w", userID, err)
	}
	return nil
}
