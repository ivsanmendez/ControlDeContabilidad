package port

import (
	"context"

	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/user"
)

// AuthService is the driving port for authentication use cases.
type AuthService interface {
	Register(ctx context.Context, email, password string, audit user.AuditInfo) (*user.User, error)
	Login(ctx context.Context, email, password string, audit user.AuditInfo) (*user.User, user.TokenPair, error)
	RefreshToken(ctx context.Context, rawRefresh string, audit user.AuditInfo) (user.TokenPair, error)
	Logout(ctx context.Context, rawRefresh string, audit user.AuditInfo) error
	GetUser(ctx context.Context, id int64) (*user.User, error)
}

// UserAdminService is the driving port for user administration use cases.
type UserAdminService interface {
	CreateUser(ctx context.Context, email, password string, role user.Role) (*user.User, error)
	ListUsers(ctx context.Context) ([]user.User, error)
	UpdateUserRole(ctx context.Context, id int64, role user.Role) (*user.User, error)
	UpdateUserPassword(ctx context.Context, callerID, id int64, newPassword string) error
	DeleteUser(ctx context.Context, callerID, id int64) error
}
