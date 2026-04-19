package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/ivsanmendez/ControlDeContabilidad/db/migrations"
	bcryptadapter "github.com/ivsanmendez/ControlDeContabilidad/internal/adapter/bcrypt"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/adapter/certsigner"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/adapter/eventbus"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/adapter/httpapi"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/adapter/i18n"
	jwtadapter "github.com/ivsanmendez/ControlDeContabilidad/internal/adapter/jwt"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/adapter/postgres"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/house"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/category"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/contribution"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/contributor"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/expense"
	ec "github.com/ivsanmendez/ControlDeContabilidad/internal/domain/expense_category"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/receipt"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/report"
	"github.com/ivsanmendez/ControlDeContabilidad/internal/domain/user"
)

func main() {
	// Outbound adapters
	dbURL := os.Getenv("DATABASE_URL")
	log.Printf("DATABASE_URL: %s", dbURL)
	db, err := postgres.Connect(dbURL)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer db.Close()

	if err := migrations.Run(db); err != nil {
		log.Fatalf("migrations: %v", err)
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET environment variable is required")
	}

	expenseRepo := postgres.NewExpenseRepo(db)
	userRepo := postgres.NewUserRepo(db)
	auditRepo := postgres.NewAuditRepo(db)
	contributorRepo := postgres.NewContributorRepo(db)
	contribRepo := postgres.NewContributionRepo(db)
	categoryRepo := postgres.NewCategoryRepo(db)
	expCatRepo := postgres.NewExpenseCategoryRepo(db)
	receiptFolioRepo := postgres.NewReceiptFolioRepo(db)
	houseRepo := postgres.NewHouseRepo(db)
	bus := eventbus.New()
	hasher := bcryptadapter.New()
	jwtIssuer := jwtadapter.NewIssuer(jwtSecret)
	signer, err := certsigner.New(os.Getenv("SIGN_CERT_PATH"), os.Getenv("SIGN_KEY_PATH"))
	if err != nil {
		log.Fatalf("certsigner: %v", err)
	}
	if signer.Available() {
		log.Println("Receipt signing enabled")
	} else {
		log.Println("Receipt signing disabled (SIGN_CERT_PATH / SIGN_KEY_PATH not set)")
	}

	// Domain services
	expenseSvc := expense.NewService(expenseRepo, bus)
	authSvc := user.NewService(userRepo, hasher, jwtIssuer, auditRepo)
	contributorSvc := contributor.NewService(contributorRepo)
	contribSvc := contribution.NewService(contribRepo)
	categorySvc := category.NewService(categoryRepo)
	expCatSvc := ec.NewService(expCatRepo)
	receiptSvc := receipt.NewService(receiptFolioRepo)
	reportRepo := postgres.NewReportRepo(db)
	reportSvc := report.NewService(reportRepo)
	houseSvc := house.NewService(houseRepo)

	// i18n translator
	tr := i18n.New()

	// Inbound adapters
	mux := http.NewServeMux()
	httpapi.RegisterRoutes(mux, expenseSvc, authSvc, contribSvc, contributorSvc, categorySvc, expCatSvc, receiptSvc, reportSvc, houseSvc, jwtIssuer, signer, tr)

	// Serve static files (production React build)
	staticDir := os.Getenv("STATIC_DIR")
	if staticDir == "" {
		staticDir = "./web/dist"
	}
	serveSPA(mux, staticDir)

	// Start server
	listenPort := os.Getenv("PORT")
	if listenPort == "" {
		listenPort = "8080"
	}
	log.Printf("API listening on :%s", listenPort)
	log.Printf("Serving static files from: %s", staticDir)
	handler := spaContentNegotiation(mux, staticDir)
	if err := http.ListenAndServe(":"+listenPort, handler); err != nil {
		log.Fatal(err)
	}
}

// spaContentNegotiation wraps the mux to serve index.html for browser
// navigation requests (GET + Accept: text/html + no file extension). This
// prevents API wildcard routes like GET /contributions/{id} from catching
// SPA client-side routes like /contributions/receipt when opened in a new tab.
// Mirrors the Vite proxy bypass logic used in development.
func spaContentNegotiation(next http.Handler, staticDir string) http.Handler {
	indexPath := filepath.Join(staticDir, "index.html")
	if _, err := os.Stat(indexPath); os.IsNotExist(err) {
		return next
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet &&
			r.URL.Path != "/health" &&
			strings.Contains(r.Header.Get("Accept"), "text/html") &&
			filepath.Ext(r.URL.Path) == "" {
			http.ServeFile(w, r, indexPath)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// serveSPA serves the React SPA and handles client-side routing
func serveSPA(mux *http.ServeMux, staticDir string) {
	// Check if static directory exists
	if _, err := os.Stat(staticDir); os.IsNotExist(err) {
		log.Printf("Warning: static directory not found: %s (SPA serving disabled)", staticDir)
		return
	}

	indexPath := filepath.Join(staticDir, "index.html")
	fs := http.FileServer(http.Dir(staticDir))

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Try to open the file in the static directory
		path := staticDir + r.URL.Path
		f, err := os.Open(path)

		if err == nil {
			defer f.Close()
			// Check if it's a directory
			stat, statErr := f.Stat()
			if statErr == nil && !stat.IsDir() {
				// It's a file and exists - let the file server handle it
				fs.ServeHTTP(w, r)
				return
			}
		}

		// File doesn't exist or is a directory - serve index.html
		http.ServeFile(w, r, indexPath)
	})
}
