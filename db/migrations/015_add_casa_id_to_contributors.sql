-- +goose Up
ALTER TABLE contributors
    ADD COLUMN casa_id BIGINT REFERENCES casas(id) ON DELETE SET NULL;

CREATE INDEX idx_contributors_casa_id ON contributors(casa_id);

-- +goose Down
DROP INDEX IF EXISTS idx_contributors_casa_id;
ALTER TABLE contributors DROP COLUMN IF EXISTS casa_id;