-- +goose Up
CREATE TABLE vehicle_access_controls (
    vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    access_control_id BIGINT NOT NULL REFERENCES access_controls(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (vehicle_id, access_control_id)
);

-- +goose Down
DROP TABLE vehicle_access_controls;