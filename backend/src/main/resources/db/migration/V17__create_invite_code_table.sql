CREATE TABLE invite_code
(
    id         BIGSERIAL PRIMARY KEY,
    code       VARCHAR(32) NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9-]{6,32}$'),
    max_uses   INT         NOT NULL CHECK (max_uses > 0),
    expires_at TIMESTAMPTZ,
    note       TEXT,
    created_at TIMESTAMPTZ NOT NULL
);
