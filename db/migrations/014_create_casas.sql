-- +goose Up
CREATE TABLE casas (
    id         BIGSERIAL    PRIMARY KEY,
    name       VARCHAR(255) NOT NULL UNIQUE,
    address    TEXT         NOT NULL DEFAULT '',
    notes      TEXT         NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- +goose Down
DROP TABLE casas;