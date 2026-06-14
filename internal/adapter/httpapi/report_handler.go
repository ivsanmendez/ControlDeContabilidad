package httpapi

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/ivsanmendez/ControlDeContabilidad/internal/adapter/i18n"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/report"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/port"
)

type ReportHandler struct {
	svc port.ReportService
	tr  *i18n.Translator
}

func (h *ReportHandler) HouseReport(w http.ResponseWriter, r *http.Request) {
	houseID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_id")
		return
	}

	year := 0
	if y := r.URL.Query().Get("year"); y != "" {
		year, err = strconv.Atoi(y)
		if err != nil {
			writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_year")
			return
		}
	}
	if year < 2000 {
		year = time.Now().Year()
	}

	rpt, err := h.svc.GetHouseReport(r.Context(), houseID, year)
	if err != nil {
		if errors.Is(err, report.ErrInvalidYear) {
			writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_year")
			return
		}
		writeErrorT(w, r, h.tr, http.StatusInternalServerError, "report_query_failed")
		return
	}

	writeJSON(w, http.StatusOK, rpt)
}

func (h *ReportHandler) MonthlyBalance(w http.ResponseWriter, r *http.Request) {
	yearStr := r.URL.Query().Get("year")
	if yearStr == "" {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_year")
		return
	}

	year, err := strconv.Atoi(yearStr)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_year")
		return
	}

	rpt, err := h.svc.GetMonthlyBalance(r.Context(), year)
	if err != nil {
		if errors.Is(err, report.ErrInvalidYear) {
			writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_year")
			return
		}
		writeErrorT(w, r, h.tr, http.StatusInternalServerError, "report_query_failed")
		return
	}

	writeJSON(w, http.StatusOK, rpt)
}
