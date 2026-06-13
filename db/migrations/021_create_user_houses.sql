-- +goose Up
CREATE TABLE user_houses (
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    house_id    BIGINT NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, house_id)
);
CREATE INDEX idx_user_houses_user_id  ON user_houses(user_id);
CREATE INDEX idx_user_houses_house_id ON user_houses(house_id);

-- +goose Down
DROP TABLE user_houses;
