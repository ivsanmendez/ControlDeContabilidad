-- +goose Up
-- house_number is now derived from the linked house's name.
-- Multiple contributors can belong to the same house, so the UNIQUE
-- constraint would prevent that — drop it.
ALTER TABLE contributors DROP CONSTRAINT IF EXISTS contributors_house_number_key;

-- +goose Down
ALTER TABLE contributors ADD CONSTRAINT contributors_house_number_key UNIQUE (house_number);