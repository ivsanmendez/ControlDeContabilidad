package httpapi

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/ivsanmendez/ControlDeContabilidad/internal/adapter/i18n"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/casa"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/port"
)

type CasaHandler struct {
	svc port.CasaService
	tr  *i18n.Translator
}

type createCasaRequest struct {
	Name    string `json:"name"`
	Address string `json:"address"`
	Notes   string `json:"notes"`
}

type updateCasaRequest struct {
	Name    string `json:"name"`
	Address string `json:"address"`
	Notes   string `json:"notes"`
}

type assignContributorRequest struct {
	ContributorID int64 `json:"contributor_id"`
}

func (h *CasaHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req createCasaRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_request_body")
		return
	}

	c, err := h.svc.CreateCasa(r.Context(), req.Name, req.Address, req.Notes)
	if err != nil {
		if errors.Is(err, casa.ErrDuplicate) {
			writeErrorT(w, r, h.tr, http.StatusConflict, "casa_duplicate")
		} else {
			writeError(w, http.StatusUnprocessableEntity, err.Error())
		}
		return
	}
	writeJSON(w, http.StatusCreated, c)
}

func (h *CasaHandler) List(w http.ResponseWriter, r *http.Request) {
	casas, err := h.svc.ListCasas(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if casas == nil {
		casas = []casa.Casa{}
	}
	writeJSON(w, http.StatusOK, casas)
}

func (h *CasaHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}

	detail, err := h.svc.GetCasa(r.Context(), id)
	if err != nil {
		if errors.Is(err, casa.ErrNotFound) {
			writeErrorT(w, r, h.tr, http.StatusNotFound, "casa_not_found")
		} else {
			writeError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}
	writeJSON(w, http.StatusOK, detail)
}

func (h *CasaHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}

	var req updateCasaRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_request_body")
		return
	}

	c, err := h.svc.UpdateCasa(r.Context(), id, req.Name, req.Address, req.Notes)
	if err != nil {
		if errors.Is(err, casa.ErrNotFound) {
			writeErrorT(w, r, h.tr, http.StatusNotFound, "casa_not_found")
		} else if errors.Is(err, casa.ErrDuplicate) {
			writeErrorT(w, r, h.tr, http.StatusConflict, "casa_duplicate")
		} else {
			writeError(w, http.StatusUnprocessableEntity, err.Error())
		}
		return
	}
	writeJSON(w, http.StatusOK, c)
}

func (h *CasaHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}

	if err := h.svc.DeleteCasa(r.Context(), id); err != nil {
		if errors.Is(err, casa.ErrNotFound) {
			writeErrorT(w, r, h.tr, http.StatusNotFound, "casa_not_found")
		} else if errors.Is(err, casa.ErrHasAccessControls) {
			writeErrorT(w, r, h.tr, http.StatusConflict, "casa_has_access_controls")
		} else {
			writeError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *CasaHandler) AssignContributor(w http.ResponseWriter, r *http.Request) {
	casaID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}

	var req assignContributorRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_request_body")
		return
	}

	if err := h.svc.AssignContributor(r.Context(), casaID, req.ContributorID); err != nil {
		if errors.Is(err, casa.ErrNotFound) {
			writeErrorT(w, r, h.tr, http.StatusNotFound, "casa_not_found")
		} else if errors.Is(err, casa.ErrContributorNotFound) {
			writeErrorT(w, r, h.tr, http.StatusNotFound, "casa_contributor_not_found")
		} else {
			writeError(w, http.StatusUnprocessableEntity, err.Error())
		}
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *CasaHandler) UnassignContributor(w http.ResponseWriter, r *http.Request) {
	_, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}
	contributorID, err := strconv.ParseInt(r.PathValue("contributor_id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}

	if err := h.svc.UnassignContributor(r.Context(), contributorID); err != nil {
		if errors.Is(err, casa.ErrContributorNotFound) {
			writeErrorT(w, r, h.tr, http.StatusNotFound, "casa_contributor_not_found")
		} else {
			writeError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}
	w.WriteHeader(http.StatusNoContent)
}