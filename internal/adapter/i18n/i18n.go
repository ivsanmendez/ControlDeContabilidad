package i18n

import (
	"net/http"
	"strings"
)

// Translator holds message maps for supported languages and translates keys.
type Translator struct {
	messages map[string]map[string]string // lang → key → message
}

// New creates a Translator with Spanish and English message maps.
func New() *Translator {
	return &Translator{
		messages: map[string]map[string]string{
			"es": MessagesES,
			"en": MessagesEN,
		},
	}
}

// T returns the translated message for the given language and key.
// Falls back to English, then returns the key itself.
func (t *Translator) T(lang, key string) string {
	if msgs, ok := t.messages[lang]; ok {
		if msg, ok := msgs[key]; ok {
			return msg
		}
	}
	// Fallback to English
	if msgs, ok := t.messages["en"]; ok {
		if msg, ok := msgs[key]; ok {
			return msg
		}
	}
	return key
}

// LangFromRequest parses the Accept-Language header and returns "es" or "en".
// Defaults to "es" (Spanish).
func LangFromRequest(r *http.Request) string {
	accept := r.Header.Get("Accept-Language")
	if accept == "" {
		return "es"
	}

	// Simple parsing: check if "en" appears before "es" or is the only language
	lower := strings.ToLower(accept)
	if strings.HasPrefix(lower, "en") {
		return "en"
	}
	if strings.Contains(lower, "en") && !strings.Contains(lower, "es") {
		return "en"
	}

	return "es"
}
