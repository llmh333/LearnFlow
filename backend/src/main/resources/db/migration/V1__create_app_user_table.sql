-- First migration after the 2026-11-18 reset (D12): production must drop the old V1–V15 schema
-- before deploying. One table per migration from here on.

CREATE TABLE app_user
(
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE CHECK (email = lower(email)),
    password_hash VARCHAR(255) NOT NULL,
    display_name  VARCHAR(100) NOT NULL CHECK (display_name <> ''),
    created_at    TIMESTAMPTZ  NOT NULL
);
