-- One-time codes for "forgot password", emailed to the user. Only the SHA-256 hex of the code is
-- stored. A new request consumes the user's older codes, so at most one code is live per user.
CREATE TABLE password_reset_code
(
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    code_hash   VARCHAR(64) NOT NULL CHECK (length(code_hash) = 64),
    attempts    SMALLINT    NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    created_at  TIMESTAMPTZ NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL CHECK (expires_at > created_at),
    consumed_at TIMESTAMPTZ
);

CREATE INDEX idx_password_reset_code_user ON password_reset_code (user_id, created_at DESC);
