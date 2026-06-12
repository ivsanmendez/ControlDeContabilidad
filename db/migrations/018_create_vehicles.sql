-- +goose Up
CREATE TABLE vehicles (
    id BIGSERIAL PRIMARY KEY,
    house_id BIGINT NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
    plate TEXT NOT NULL,
    color TEXT NOT NULL,
    brand TEXT NOT NULL DEFAULT '',
    model TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_vehicles_house_id ON vehicles(house_id);

-- +goose Down
DROP TABLE vehicles;