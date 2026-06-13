-- +goose Up
ALTER TABLE contributors
    ADD COLUMN camera_access BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN camera_email  TEXT    NOT NULL DEFAULT '',
    ADD COLUMN camera_phone  TEXT    NOT NULL DEFAULT '';

-- +goose Down
ALTER TABLE contributors
    DROP COLUMN camera_access,
    DROP COLUMN camera_email,
    DROP COLUMN camera_phone;