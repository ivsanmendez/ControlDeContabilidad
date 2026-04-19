-- +goose Up
ALTER TABLE contributors
    ADD COLUMN house_id BIGINT REFERENCES houses(id) ON DELETE SET NULL;

CREATE INDEX idx_contributors_house_id ON contributors(house_id);

-- +goose Down
DROP INDEX IF EXISTS idx_contributors_house_id;
ALTER TABLE contributors DROP COLUMN IF EXISTS house_id;