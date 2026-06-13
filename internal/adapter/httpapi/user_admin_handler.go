package httpapi

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/ivsanmendez/ControlDeContabilidad/internal/adapter/i18n"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/user"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/port"
)

type UserAdminHandler struct {
	svc port.UserAdminService
	tr  *i18n.Translator
}

type userAdminResponse struct {
	ID        int64     `json:"id"`
	Email     string    `json:"email"`
	Role      user.Role `json:"role"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type assignHouseRequest struct {
	HouseID int64 `json:"house_id"`
}

type createUserRequest struct {
	Email    string    `json:"email"`
	Password string    `json:"password"`
	Role     user.Role `json:"role"`
}

type updateRoleRequest struct {
	Role user.Role `json:"role"`
}

type updatePasswordRequest struct {
	Password string `json:"password"`
}

func toUserAdminResponse(u user.User) userAdminResponse {
	return userAdminResponse{
		ID:        u.ID,
		Email:     u.Email,
		Role:      u.Role,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}

func (h *UserAdminHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req createUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_request_body")
		return
	}

	if req.Role == "" {
		req.Role = user.RoleUser
	}

	u, err := h.svc.CreateUser(r.Context(), req.Email, req.Password, req.Role)
	if err != nil {
		switch {
		case errors.Is(err, user.ErrWeakPassword):
			writeError(w, http.StatusUnprocessableEntity, err.Error())
		case errors.Is(err, user.ErrEmailTaken):
			writeErrorT(w, r, h.tr, http.StatusConflict, "email_taken")
		default:
			writeError(w, http.StatusUnprocessableEntity, err.Error())
		}
		return
	}
	writeJSON(w, http.StatusCreated, toUserAdminResponse(*u))
}

func (h *UserAdminHandler) List(w http.ResponseWriter, r *http.Request) {
	users, err := h.svc.ListUsers(r.Context())
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusInternalServerError, "user_list_failed")
		return
	}

	resp := make([]userAdminResponse, len(users))
	for i, u := range users {
		resp[i] = toUserAdminResponse(u)
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h *UserAdminHandler) UpdateRole(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}

	var req updateRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_request_body")
		return
	}

	updated, err := h.svc.UpdateUserRole(r.Context(), id, req.Role)
	if err != nil {
		if errors.Is(err, user.ErrNotFound) {
			writeErrorT(w, r, h.tr, http.StatusNotFound, "user_not_found")
		} else {
			writeErrorT(w, r, h.tr, http.StatusInternalServerError, "user_update_role_failed")
		}
		return
	}

	writeJSON(w, http.StatusOK, toUserAdminResponse(*updated))
}

func (h *UserAdminHandler) UpdatePassword(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}

	claims, ok := ClaimsFromContext(r.Context())
	if !ok {
		writeErrorT(w, r, h.tr, http.StatusUnauthorized, "no_claims_in_context")
		return
	}

	var req updatePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_request_body")
		return
	}

	if err := h.svc.UpdateUserPassword(r.Context(), claims.UserID, id, req.Password); err != nil {
		switch {
		case errors.Is(err, user.ErrWeakPassword):
			writeError(w, http.StatusUnprocessableEntity, err.Error())
		case errors.Is(err, user.ErrNotFound):
			writeErrorT(w, r, h.tr, http.StatusNotFound, "user_not_found")
		default:
			writeErrorT(w, r, h.tr, http.StatusInternalServerError, "user_update_password_failed")
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *UserAdminHandler) ListHouses(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}
	assignments, err := h.svc.ListUserHouses(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if assignments == nil {
		assignments = []user.HouseAssignment{}
	}
	writeJSON(w, http.StatusOK, assignments)
}

func (h *UserAdminHandler) AssignHouse(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}
	var req assignHouseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_request_body")
		return
	}
	if err := h.svc.AssignHouseToUser(r.Context(), id, req.HouseID); err != nil {
		if errors.Is(err, user.ErrHouseAlreadyAssigned) {
			writeError(w, http.StatusConflict, err.Error())
		} else {
			writeError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *UserAdminHandler) UnassignHouse(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}
	houseID, err := strconv.ParseInt(r.PathValue("house_id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}
	if err := h.svc.UnassignHouseFromUser(r.Context(), id, houseID); err != nil {
		if errors.Is(err, user.ErrHouseNotAssigned) {
			writeError(w, http.StatusNotFound, err.Error())
		} else {
			writeError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *UserAdminHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}

	claims, ok := ClaimsFromContext(r.Context())
	if !ok {
		writeErrorT(w, r, h.tr, http.StatusUnauthorized, "no_claims_in_context")
		return
	}

	if err := h.svc.DeleteUser(r.Context(), claims.UserID, id); err != nil {
		switch {
		case errors.Is(err, user.ErrCannotDeleteSelf):
			writeError(w, http.StatusForbidden, err.Error())
		case errors.Is(err, user.ErrNotFound):
			writeErrorT(w, r, h.tr, http.StatusNotFound, "user_not_found")
		default:
			writeErrorT(w, r, h.tr, http.StatusInternalServerError, "user_delete_failed")
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}