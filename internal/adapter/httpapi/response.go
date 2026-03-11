package httpapi

import (
	"encoding/json"
	"net/http"

	"github.com/ivsanmendez/ControlDeContabilidad/internal/adapter/i18n"
)

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func writeErrorT(w http.ResponseWriter, r *http.Request, tr *i18n.Translator, status int, key string) {
	lang := i18n.LangFromRequest(r)
	writeJSON(w, status, map[string]string{"error": tr.T(lang, key)})
}
