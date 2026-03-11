package httpapi

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/ivsanmendez/ControlDeContabilidad/internal/adapter/i18n"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/receipt"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/port"
)

// ReceiptHandler serves digitally signed receipt payloads.
type ReceiptHandler struct {
	contribSvc     port.ContributionService
	contributorSvc port.ContributorService
	receiptSvc     port.ReceiptFolioService
	signer         port.ReceiptSigner
	tr             *i18n.Translator
}

type receiptSignRequest struct {
	ContributorID int64  `json:"contributor_id"`
	Year          int    `json:"year"`
	Password      string `json:"password"`
	SignerName    string `json:"signer_name"`
}

type receiptPayment struct {
	Month        int     `json:"month"`
	Amount       float64 `json:"amount"`
	CategoryName string  `json:"category_name"`
}

type receiptData struct {
	Folio           string           `json:"folio"`
	ContributorID   int64            `json:"contributor_id"`
	HouseNumber     string           `json:"house_number"`
	ContributorName string           `json:"contributor_name"`
	Year            int              `json:"year"`
	Payments        []receiptPayment `json:"payments"`
	Total           float64          `json:"total"`
	SignerName      string           `json:"signer_name"`
	GeneratedAt     time.Time        `json:"generated_at"`
}

type receiptSignatureResponse struct {
	Folio       string      `json:"folio"`
	Data        receiptData `json:"data"`
	Signature   string      `json:"signature"`
	Certificate string      `json:"certificate"`
}

// ReceiptSignature handles POST /contributions/receipt-signature.
func (h *ReceiptHandler) ReceiptSignature(w http.ResponseWriter, r *http.Request) {
	if !h.signer.Available() {
		writeErrorT(w, r, h.tr, http.StatusServiceUnavailable, "receipt_signing_not_configured")
		return
	}

	var req receiptSignRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "invalid_request_body")
		return
	}

	if req.ContributorID == 0 || req.Year == 0 {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "contributor_id_and_year_required")
		return
	}
	if req.Password == "" {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "password_required")
		return
	}
	if req.SignerName == "" {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "signer_name_required")
		return
	}

	claims, ok := ClaimsFromContext(r.Context())
	if !ok {
		writeErrorT(w, r, h.tr, http.StatusUnauthorized, "no_claims_in_context")
		return
	}

	// Fetch contributor info
	contrib, err := h.contributorSvc.GetContributor(r.Context(), req.ContributorID)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusNotFound, "contributor_not_found")
		return
	}

	// Fetch contributions for that year
	contributions, err := h.contribSvc.ListContributions(r.Context(), req.ContributorID, req.Year)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusInternalServerError, "failed_to_load_contributions")
		return
	}

	// Generate security folio
	now := time.Now().UTC()
	folio, seq, suffix, err := h.receiptSvc.GenerateNewFolio(r.Context(), now.Year())
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusInternalServerError, "failed_to_generate_folio")
		return
	}

	// Build receipt data (folio included in canonical JSON)
	var payments []receiptPayment
	var total float64
	for _, c := range contributions {
		payments = append(payments, receiptPayment{Month: c.Month, Amount: c.Amount, CategoryName: c.CategoryName})
		total += c.Amount
	}

	data := receiptData{
		Folio:           folio,
		ContributorID:   req.ContributorID,
		HouseNumber:     contrib.HouseNumber,
		ContributorName: contrib.Name,
		Year:            req.Year,
		Payments:        payments,
		Total:           total,
		SignerName:      req.SignerName,
		GeneratedAt:     now,
	}

	// Build canonical JSON for signing
	canonical, err := json.Marshal(data)
	if err != nil {
		writeErrorT(w, r, h.tr, http.StatusInternalServerError, "failed_to_serialize_receipt_data")
		return
	}

	sig, err := h.signer.Sign(canonical, req.Password)
	if err != nil {
		if strings.Contains(err.Error(), "decrypt") {
			writeErrorT(w, r, h.tr, http.StatusUnauthorized, "invalid_certificate_password")
			return
		}
		writeErrorT(w, r, h.tr, http.StatusInternalServerError, "failed_to_sign_receipt")
		return
	}

	// Persist the signed receipt folio
	rf := receipt.ReceiptFolio{
		Folio:         folio,
		YearIssued:    now.Year(),
		SeqNumber:     seq,
		UUIDSuffix:    suffix,
		ContributorID: req.ContributorID,
		ReceiptYear:   req.Year,
		SignerName:    req.SignerName,
		UserID:        claims.UserID,
		CanonicalJSON: canonical,
		Signature:     sig,
		Certificate:   h.signer.Certificate(),
		SignedAt:      now,
	}
	if err := h.receiptSvc.SaveFolio(r.Context(), &rf); err != nil {
		log.Printf("WARNING: receipt signed but failed to persist folio %s: %v", folio, err)
		writeErrorT(w, r, h.tr, http.StatusInternalServerError, "failed_to_save_receipt")
		return
	}

	resp := receiptSignatureResponse{
		Folio:       folio,
		Data:        data,
		Signature:   base64.StdEncoding.EncodeToString(sig),
		Certificate: base64.StdEncoding.EncodeToString(h.signer.Certificate()),
	}

	writeJSON(w, http.StatusOK, resp)
}

// VerifyReceipt handles GET /receipts/verify/{folio}.
func (h *ReceiptHandler) VerifyReceipt(w http.ResponseWriter, r *http.Request) {
	folio := r.PathValue("folio")
	if folio == "" {
		writeErrorT(w, r, h.tr, http.StatusBadRequest, "folio_required")
		return
	}

	rf, err := h.receiptSvc.VerifyFolio(r.Context(), folio)
	if err != nil {
		if errors.Is(err, receipt.ErrNotFound) {
			writeErrorT(w, r, h.tr, http.StatusNotFound, "receipt_folio_not_found")
			return
		}
		writeErrorT(w, r, h.tr, http.StatusInternalServerError, "receipt_folio_not_found")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"folio":          rf.Folio,
		"contributor_id": rf.ContributorID,
		"receipt_year":   rf.ReceiptYear,
		"signer_name":   rf.SignerName,
		"signed_at":     rf.SignedAt,
		"canonical_json": base64.StdEncoding.EncodeToString(rf.CanonicalJSON),
		"signature":      base64.StdEncoding.EncodeToString(rf.Signature),
		"certificate":    base64.StdEncoding.EncodeToString(rf.Certificate),
	})
}
