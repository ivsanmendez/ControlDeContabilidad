package httpapi

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/ivsanmendez/ControlDeContabilidad/internal/adapter/i18n"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/vehicle"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/port"
)

type VehicleHandler struct {
	svc port.VehicleService
	tr  *i18n.Translator
}

type createVehicleRequest struct {
	Plate string `json:"plate"`
	Color string `json:"color"`
	Brand string `json:"brand"`
	Model string `json:"model"`
	Notes string `json:"notes"`
}

type updateVehicleRequest struct {
	Plate string `json:"plate"`
	Color string `json:"color"`
	Brand string `json:"brand"`
	Model string `json:"model"`
	Notes string `json:"notes"`
}

func (h *VehicleHandler) ListByHouse(w http.ResponseWriter, r *http.Request) {
	houseID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}

	vehicles, err := h.svc.ListByHouse(r.Context(), houseID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if vehicles == nil {
		vehicles = []vehicle.Vehicle{}
	}
	writeJSON(w, http.StatusOK, vehicles)
}

func (h *VehicleHandler) Create(w http.ResponseWriter, r *http.Request) {
	houseID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}

	var req createVehicleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_request_body")
		return
	}

	v, err := h.svc.CreateVehicle(r.Context(), houseID, req.Plate, req.Color, req.Brand, req.Model, req.Notes)
	if err != nil {
		if errors.Is(err, vehicle.ErrDuplicate) {
			writeErrorT(w, r, h.tr, http.StatusConflict, "vehicle_duplicate")
		} else {
			writeError(w, http.StatusUnprocessableEntity, err.Error())
		}
		return
	}
	writeJSON(w, http.StatusCreated, v)
}

func (h *VehicleHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}

	var req updateVehicleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_request_body")
		return
	}

	v, err := h.svc.UpdateVehicle(r.Context(), id, req.Plate, req.Color, req.Brand, req.Model, req.Notes)
	if err != nil {
		switch {
		case errors.Is(err, vehicle.ErrNotFound):
			writeErrorT(w, r, h.tr, http.StatusNotFound, "vehicle_not_found")
		case errors.Is(err, vehicle.ErrDuplicate):
			writeErrorT(w, r, h.tr, http.StatusConflict, "vehicle_duplicate")
		default:
			writeError(w, http.StatusUnprocessableEntity, err.Error())
		}
		return
	}
	writeJSON(w, http.StatusOK, v)
}

func (h *VehicleHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}

	if err := h.svc.DeleteVehicle(r.Context(), id); err != nil {
		if errors.Is(err, vehicle.ErrNotFound) {
			writeErrorT(w, r, h.tr, http.StatusNotFound, "vehicle_not_found")
		} else {
			writeError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *VehicleHandler) AssignAccessControl(w http.ResponseWriter, r *http.Request) {
	vehicleID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}
	controlID, err := strconv.ParseInt(r.PathValue("control_id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}

	if err := h.svc.AssignAccessControl(r.Context(), vehicleID, controlID); err != nil {
		switch {
		case errors.Is(err, vehicle.ErrNotFound):
			writeErrorT(w, r, h.tr, http.StatusNotFound, "vehicle_not_found")
		case errors.Is(err, vehicle.ErrAccessControlAlreadyAssigned):
			writeErrorT(w, r, h.tr, http.StatusConflict, "vehicle_access_control_already_assigned")
		default:
			writeError(w, http.StatusUnprocessableEntity, err.Error())
		}
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *VehicleHandler) UnassignAccessControl(w http.ResponseWriter, r *http.Request) {
	vehicleID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}
	controlID, err := strconv.ParseInt(r.PathValue("control_id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}

	if err := h.svc.UnassignAccessControl(r.Context(), vehicleID, controlID); err != nil {
		switch {
		case errors.Is(err, vehicle.ErrNotFound):
			writeErrorT(w, r, h.tr, http.StatusNotFound, "vehicle_not_found")
		case errors.Is(err, vehicle.ErrAccessControlNotAssigned):
			writeErrorT(w, r, h.tr, http.StatusNotFound, "vehicle_access_control_not_assigned")
		default:
			writeError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}
	w.WriteHeader(http.StatusNoContent)
}