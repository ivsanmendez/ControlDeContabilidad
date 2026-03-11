package httpapi

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/ivsanmendez/ControlDeContabilidad/internal/adapter/i18n"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/contributor"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/port"
)

type ContributorHandler struct {
	svc port.ContributorService
	tr  *i18n.Translator
}

type createContributorRequest struct {
	HouseNumber string `json:"house_number"`
	Name        string `json:"name"`
	Phone       string `json:"phone"`
}

type updateContributorRequest struct {
	Name  string `json:"name"`
	Phone string `json:"phone"`
}

func (h *ContributorHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims, ok := ClaimsFromContext(r.Context())
	if !ok {
		writeErrorT(w, r, h.tr, http.StatusUnauthorized, "no_claims_in_context")
		return
	}

	var req createContributorRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_request_body")
		return
	}

	c, err := h.svc.CreateContributor(r.Context(), claims.UserID, req.HouseNumber, req.Name, req.Phone)
	if err != nil {
		if errors.Is(err, contributor.ErrDuplicate) {
			writeError(w, http.StatusConflict, err.Error())
		} else {
			writeError(w, http.StatusUnprocessableEntity, err.Error())
		}
		return
	}
	writeJSON(w, http.StatusCreated, c)
}

func (h *ContributorHandler) List(w http.ResponseWriter, r *http.Request) {
	contributors, err := h.svc.ListContributors(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, contributors)
}

func (h *ContributorHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}

	c, err := h.svc.GetContributor(r.Context(), id)
	if err != nil {
		if errors.Is(err, contributor.ErrNotFound) {
			writeErrorT(w, r, h.tr, http.StatusNotFound, "contributor_not_found")
		} else {
			writeError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}
	writeJSON(w, http.StatusOK, c)
}

func (h *ContributorHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}

	var req updateContributorRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_request_body")
		return
	}

	c, err := h.svc.UpdateContributor(r.Context(), id, req.Name, req.Phone)
	if err != nil {
		if errors.Is(err, contributor.ErrNotFound) {
			writeErrorT(w, r, h.tr, http.StatusNotFound, "contributor_not_found")
		} else {
			writeError(w, http.StatusUnprocessableEntity, err.Error())
		}
		return
	}
	writeJSON(w, http.StatusOK, c)
}

func (h *ContributorHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}

	if err := h.svc.DeleteContributor(r.Context(), id); err != nil {
		if errors.Is(err, contributor.ErrNotFound) {
			writeErrorT(w, r, h.tr, http.StatusNotFound, "contributor_not_found")
		} else {
			writeError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
