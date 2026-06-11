# Feature 07: User Administration CRUD Page

**GitHub Issue**: #5
**Labels**: `backend`, `frontend`, `domain`
**Status**: Backlog

---

## Scope

### Route
- Admin-only route `/admin/users`
- Non-admin callers are redirected to `/`
- Navigation link visible only to users with `admin` role

### API Endpoints (all require `admin` role)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/users` | List all users (id, email, role, createdAt) |
| `PATCH` | `/users/{id}/role` | Change role (`user` or `admin`) |
| `PUT` | `/users/{id}/password` | Reset password (stored as bcrypt hash) |
| `DELETE` | `/users/{id}` | Delete account (cannot delete own account) |

### Domain additions (`internal/domain/user/service.go`)
- `ListUsers() ([]User, error)`
- `UpdateUserRole(id string, role Role) error`
- `UpdateUserPassword(id string, newPassword string) error`
- `DeleteUser(id string, callerID string) error`

### Postgres adapter
New methods on the user repository implementing all four domain operations above.

### Frontend components

| Component | Responsibility |
|-----------|---------------|
| `UsersPage` | Page shell, data fetching, layout |
| `UserTable` | Displays user rows with action buttons |
| `ChangeRoleDialog` | Confirmation dialog for role change |
| `ChangePasswordDialog` | Form dialog to input and submit new password |
| `DeleteUserDialog` | Confirmation dialog for account deletion |

---

## Acceptance Criteria

- All four endpoints return `403 Forbidden` for callers with `user` role
- `DELETE /users/{id}` returns `400` when the caller attempts to delete their own account
- Role change takes effect only after the affected user re-logs in (new JWT issued on next login)
- All UI strings go through the i18n layer (es / en)
- Domain unit tests cover all four new service methods using fake adapters

---

## Notes

- Currently role promotion requires a direct SQL `UPDATE` — this feature eliminates that manual step
- Password reset does not notify the user by email (out of scope for this issue); it is an admin-initiated action
