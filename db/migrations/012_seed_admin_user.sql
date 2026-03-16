-- +goose Up

-- Insert admin user only if no users exist yet
-- +goose StatementBegin
DO $$
DECLARE
    v_user_id BIGINT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users LIMIT 1) THEN
        INSERT INTO users (email, password_hash, role)
        VALUES ('admin@cdc.local', '$2a$10$ltLirjY4Niw9B5j3lLLga.U39mM8wdYMvc17gzUJdHDVXqAZLBgrO', 'admin')
        RETURNING id INTO v_user_id;

        -- Also seed default expense categories for the admin
        INSERT INTO expense_categories (name, description, is_active, user_id)
        VALUES
            ('Comida',      'Gastos de comida',       TRUE, v_user_id),
            ('Transporte',  'Gastos de transporte',   TRUE, v_user_id),
            ('Vivienda',    'Gastos de vivienda',     TRUE, v_user_id),
            ('Otro',        'Gastos varios',           TRUE, v_user_id);
    END IF;
END $$;
-- +goose StatementEnd

-- +goose Down
DELETE FROM users WHERE email = 'admin@cdc.local';