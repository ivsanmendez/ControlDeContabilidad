package httpapi

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/ivsanmendez/ControlDeContabilidad/internal/adapter/i18n"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/accesscontrol"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/port"
)

type AccessControlHandler struct {
	svc port.AccessControlService
	tr  *i18n.Translator
}

type createAccessControlRequest struct {
	Code        string `json:"code"`
	AdminNumber string `json:"admin_number"`
	Notes       string `json:"notes"`
}

type updateAccessControlRequest struct {
	Code        string `json:"code"`
	AdminNumber string `json:"admin_number"`
	Notes       string `json:"notes"`
}

type changeAccessControlStatusRequest struct {
	Status string `json:"status"`
}

type evaluateRequest struct {
	HouseID *int64 `json:"house_id"`
}

func (h *AccessControlHandler) ListAll(w http.ResponseWriter, r *http.Request) {
	acs, err := h.svc.ListAll(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if acs == nil {
		acs = []accesscontrol.AccessControlWithHouse{}
	}
	writeJSON(w, http.StatusOK, acs)
}

func (h *AccessControlHandler) ListByHouse(w http.ResponseWriter, r *http.Request) {
	houseID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}

	acs, err := h.svc.ListByHouse(r.Context(), houseID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if acs == nil {
		acs = []accesscontrol.AccessControl{}
	}
	writeJSON(w, http.StatusOK, acs)
}

func (h *AccessControlHandler) Create(w http.ResponseWriter, r *http.Request) {
	houseID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}

	var req createAccessControlRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_request_body")
		return
	}

	ac, err := h.svc.CreateAccessControl(r.Context(), houseID, req.Code, req.AdminNumber, req.Notes)
	if err != nil {
		switch {
		case errors.Is(err, accesscontrol.ErrDuplicate):
			writeErrorT(w, r, h.tr, http.StatusConflict, "access_control_duplicate")
		case errors.Is(err, accesscontrol.ErrMaxPerHouse):
			writeErrorT(w, r, h.tr, http.StatusConflict, "access_control_max_per_house")
		default:
			writeError(w, http.StatusUnprocessableEntity, err.Error())
		}
		return
	}
	writeJSON(w, http.StatusCreated, ac)
}

func (h *AccessControlHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}

	var req updateAccessControlRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_request_body")
		return
	}

	ac, err := h.svc.UpdateAccessControl(r.Context(), id, req.Code, req.AdminNumber, req.Notes)
	if err != nil {
		switch {
		case errors.Is(err, accesscontrol.ErrNotFound):
			writeErrorT(w, r, h.tr, http.StatusNotFound, "access_control_not_found")
		case errors.Is(err, accesscontrol.ErrDuplicate):
			writeErrorT(w, r, h.tr, http.StatusConflict, "access_control_duplicate")
		default:
			writeError(w, http.StatusUnprocessableEntity, err.Error())
		}
		return
	}
	writeJSON(w, http.StatusOK, ac)
}

func (h *AccessControlHandler) ChangeStatus(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}

	var req changeAccessControlStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_request_body")
		return
	}

	status := accesscontrol.Status(req.Status)
	ac, err := h.svc.ChangeStatus(r.Context(), id, status)
	if err != nil {
		if errors.Is(err, accesscontrol.ErrNotFound) {
			writeErrorT(w, r, h.tr, http.StatusNotFound, "access_control_not_found")
		} else {
			writeError(w, http.StatusUnprocessableEntity, err.Error())
		}
		return
	}
	writeJSON(w, http.StatusOK, ac)
}

func (h *AccessControlHandler) MarkSynced(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}

	ac, err := h.svc.MarkPhysicallySynced(r.Context(), id)
	if err != nil {
		if errors.Is(err, accesscontrol.ErrNotFound) {
			writeErrorT(w, r, h.tr, http.StatusNotFound, "access_control_not_found")
		} else {
			writeError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}
	writeJSON(w, http.StatusOK, ac)
}

func (h *AccessControlHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}

	if err := h.svc.DeleteAccessControl(r.Context(), id); err != nil {
		if errors.Is(err, accesscontrol.ErrNotFound) {
			writeErrorT(w, r, h.tr, http.StatusNotFound, "access_control_not_found")
		} else {
			writeError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *AccessControlHandler) LookupByCode(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "access_control_code_required")
		return
	}

	ac, err := h.svc.LookupByCode(r.Context(), code)
	if err != nil {
		if errors.Is(err, accesscontrol.ErrNotFound) {
			writeErrorT(w, r, h.tr, http.StatusNotFound, "access_control_not_found")
		} else {
			writeError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}
	writeJSON(w, http.StatusOK, ac)
}

func (h *AccessControlHandler) PendingSync(w http.ResponseWriter, r *http.Request) {
	acs, err := h.svc.ListPendingSync(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if acs == nil {
		acs = []accesscontrol.AccessControl{}
	}
	writeJSON(w, http.StatusOK, acs)
}

func (h *AccessControlHandler) Evaluate(w http.ResponseWriter, r *http.Request) {
	var req evaluateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_request_body")
		return
	}

	var err error
	if req.HouseID != nil {
		err = h.svc.EvaluateHouse(r.Context(), *req.HouseID)
	} else {
		err = h.svc.EvaluateAll(r.Context())
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}