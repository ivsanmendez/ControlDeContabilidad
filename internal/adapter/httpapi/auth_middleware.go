package httpapi

import (
	"context"
	"net/http"
	"strings"

	"github.com/ivsanmendez/ControlDeContabilidad/internal/adapter/i18n"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/adapter/jwt"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/user"
)

type contextKey string

const claimsKey contextKey = "claims"

// ClaimsFromContext extracts JWT claims from the request context.
func ClaimsFromContext(ctx context.Context) (*jwt.Claims, bool) {
	c, ok := ctx.Value(claimsKey).(*jwt.Claims)
	return c, ok
}

// RequireAuth returns middleware that validates the Bearer token and injects claims.
func RequireAuth(issuer *jwt.Issuer, tr *i18n.Translator) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			auth := r.Header.Get("Authorization")
			if !strings.HasPrefix(auth, "Bearer ") {
				writeErrorT(w, r, tr, http.StatusUnauthorized, "missing_or_invalid_auth_header")
				return
			}

			tokenStr := strings.TrimPrefix(auth, "Bearer ")
			claims, err := issuer.Parse(tokenStr)
			if err != nil {
				writeErrorT(w, r, tr, http.StatusUnauthorized, "invalid_or_expired_token")
				return
			}

			ctx := context.WithValue(r.Context(), claimsKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequirePermission returns middleware that checks role-based permissions.
func RequirePermission(perm user.Permission, tr *i18n.Translator) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := ClaimsFromContext(r.Context())
			if !ok {
				writeErrorT(w, r, tr, http.StatusUnauthorized, "no_claims_in_context")
				return
			}
			if !user.RoleHasPermission(claims.Role, perm) {
				writeErrorT(w, r, tr, http.StatusForbidden, "insufficient_permissions")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// Chain composes middleware around a handler. Middleware is applied in order
// (first middleware listed is outermost).
func Chain(handler http.Handler, middlewares ...func(http.Handler) http.Handler) http.Handler {
	for i := len(middlewares) - 1; i >= 0; i-- {
		handler = middlewares[i](handler)
	}
	return handler
}
