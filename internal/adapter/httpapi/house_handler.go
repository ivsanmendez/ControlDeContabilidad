package httpapi

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/ivsanmendez/ControlDeContabilidad/internal/adapter/i18n"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/house"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/port"
)

type HouseHandler struct {
	svc port.HouseService
	tr  *i18n.Translator
}

type createHouseRequest struct {
	Name    string `json:"name"`
	Address string `json:"address"`
	Notes   string `json:"notes"`
}

type updateHouseRequest struct {
	Name    string `json:"name"`
	Address string `json:"address"`
	Notes   string `json:"notes"`
}

type assignContributorToHouseRequest struct {
	ContributorID int64 `json:"contributor_id"`
}

func (h *HouseHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req createHouseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_request_body")
		return
	}

	hs, err := h.svc.CreateHouse(r.Context(), req.Name, req.Address, req.Notes)
	if err != nil {
		if errors.Is(err, house.ErrDuplicate) {
			writeErrorT(w, r, h.tr, http.StatusConflict, "house_duplicate")
		} else {
			writeError(w, http.StatusUnprocessableEntity, err.Error())
		}
		return
	}
	writeJSON(w, http.StatusCreated, hs)
}

func (h *HouseHandler) List(w http.ResponseWriter, r *http.Request) {
	houses, err := h.svc.ListHouses(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if houses == nil {
		houses = []house.House{}
	}
	writeJSON(w, http.StatusOK, houses)
}

func (h *HouseHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}

	detail, err := h.svc.GetHouse(r.Context(), id)
	if err != nil {
		if errors.Is(err, house.ErrNotFound) {
			writeErrorT(w, r, h.tr, http.StatusNotFound, "house_not_found")
		} else {
			writeError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}
	writeJSON(w, http.StatusOK, detail)
}

func (h *HouseHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}

	var req updateHouseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_request_body")
		return
	}

	hs, err := h.svc.UpdateHouse(r.Context(), id, req.Name, req.Address, req.Notes)
	if err != nil {
		if errors.Is(err, house.ErrNotFound) {
			writeErrorT(w, r, h.tr, http.StatusNotFound, "house_not_found")
		} else if errors.Is(err, house.ErrDuplicate) {
			writeErrorT(w, r, h.tr, http.StatusConflict, "house_duplicate")
		} else {
			writeError(w, http.StatusUnprocessableEntity, err.Error())
		}
		return
	}
	writeJSON(w, http.StatusOK, hs)
}

func (h *HouseHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}

	if err := h.svc.DeleteHouse(r.Context(), id); err != nil {
		if errors.Is(err, house.ErrNotFound) {
			writeErrorT(w, r, h.tr, http.StatusNotFound, "house_not_found")
		} else if errors.Is(err, house.ErrHasAccessControls) {
			writeErrorT(w, r, h.tr, http.StatusConflict, "house_has_access_controls")
		} else {
			writeError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *HouseHandler) AssignContributor(w http.ResponseWriter, r *http.Request) {
	houseID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}

	var req assignContributorToHouseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_request_body")
		return
	}

	if err := h.svc.AssignContributor(r.Context(), houseID, req.ContributorID); err != nil {
		if errors.Is(err, house.ErrNotFound) {
			writeErrorT(w, r, h.tr, http.StatusNotFound, "house_not_found")
		} else if errors.Is(err, house.ErrContributorNotFound) {
			writeErrorT(w, r, h.tr, http.StatusNotFound, "house_contributor_not_found")
		} else {
			writeError(w, http.StatusUnprocessableEntity, err.Error())
		}
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *HouseHandler) UnassignContributor(w http.ResponseWriter, r *http.Request) {
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
		if errors.Is(err, house.ErrContributorNotFound) {
			writeErrorT(w, r, h.tr, http.StatusNotFound, "house_contributor_not_found")
		} else {
			writeError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}
	w.WriteHeader(http.StatusNoContent)
}