-- +goose Up

-- 1. Create contribution_categories table
CREATE TABLE contribution_categories (
    id          BIGSERIAL    PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500),
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    user_id     BIGINT       NOT NULL REFERENCES users(id),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 2. Seed default "General" category (using the first user as owner)
INSERT INTO contribution_categories (name, description, is_active, user_id)
SELECT 'General', 'Categoría general', TRUE, id
FROM users
ORDER BY id
LIMIT 1;

-- 3. Add category_id to contributions and backfill with "General"
ALTER TABLE contributions ADD COLUMN category_id BIGINT;

UPDATE contributions
SET category_id = (SELECT id FROM contribution_categories WHERE name = 'General');

ALTER TABLE contributions ALTER COLUMN category_id SET NOT NULL;
ALTER TABLE contributions
    ADD CONSTRAINT fk_contributions_category
    FOREIGN KEY (category_id) REFERENCES contribution_categories(id);

-- 4. Replace unique constraint: (contributor_id, month, year) → (contributor_id, category_id, month, year)
ALTER TABLE contributions DROP CONSTRAINT uq_contributions_contributor_month_year;
ALTER TABLE contributions ADD CONSTRAINT uq_contributions_contributor_category_month_year
    UNIQUE (contributor_id, category_id, month, year);

-- 5. Index for category lookups
CREATE INDEX idx_contributions_category ON contributions(category_id);

-- +goose Down

DROP INDEX IF EXISTS idx_contributions_category;
ALTER TABLE contributions DROP CONSTRAINT IF EXISTS uq_contributions_contributor_category_month_year;
ALTER TABLE contributions ADD CONSTRAINT uq_contributions_contributor_month_year
    UNIQUE (contributor_id, month, year);
ALTER TABLE contributions DROP CONSTRAINT IF EXISTS fk_contributions_category;
ALTER TABLE contributions DROP COLUMN IF EXISTS category_id;
DROP TABLE IF EXISTS contribution_categories;
