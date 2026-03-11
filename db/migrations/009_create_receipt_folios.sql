-- +goose Up

-- Per-year atomic sequence counter for receipt folios
CREATE TABLE receipt_folio_counters (
    year INT PRIMARY KEY,
    last_seq INT NOT NULL DEFAULT 0
);

-- Stores every signed receipt with its folio
CREATE TABLE receipt_folios (
    id BIGSERIAL PRIMARY KEY,
    folio VARCHAR(30) NOT NULL UNIQUE,
    year_issued INT NOT NULL,
    seq_number INT NOT NULL,
    uuid_suffix VARCHAR(8) NOT NULL,
    contributor_id BIGINT NOT NULL REFERENCES contributors(id),
    receipt_year INT NOT NULL,
    signer_name VARCHAR(200) NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id),
    canonical_json BYTEA NOT NULL,
    signature BYTEA NOT NULL,
    certificate BYTEA NOT NULL,
    signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_receipt_folios_contributor ON receipt_folios (contributor_id);
CREATE INDEX idx_receipt_folios_year ON receipt_folios (year_issued);

-- +goose Down

DROP TABLE IF EXISTS receipt_folios;
DROP TABLE IF EXISTS receipt_folio_counters;
