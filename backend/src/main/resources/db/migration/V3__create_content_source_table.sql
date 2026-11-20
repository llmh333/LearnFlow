CREATE TABLE content_source
(
    id          BIGSERIAL PRIMARY KEY,
    content_key VARCHAR(100) NOT NULL UNIQUE,
    name        VARCHAR(200) NOT NULL,
    url         TEXT,
    license     VARCHAR(100) NOT NULL,
    license_url TEXT,
    attribution TEXT
);
