-- +goose Up
CREATE TABLE access_controls (
    id BIGSERIAL PRIMARY KEY,
    house_id BIGINT NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    admin_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'warning', 'inactive')),
    physical_synced_at TIMESTAMPTZ,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_access_controls_house_id ON access_controls(house_id);

-- +goose Down
DROP TABLE access_controls;