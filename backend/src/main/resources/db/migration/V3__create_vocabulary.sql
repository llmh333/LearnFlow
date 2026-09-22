CREATE TABLE vocabulary
(
    id          BIGSERIAL PRIMARY KEY,
    language_id SMALLINT     NOT NULL REFERENCES language (id),
    word        VARCHAR(255) NOT NULL,
    meaning     TEXT         NOT NULL,
    example     TEXT,
    difficulty  SMALLINT     NOT NULL DEFAULT 0,
    attributes  JSONB        NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_vocabulary_language ON vocabulary (language_id);
CREATE INDEX idx_vocabulary_attributes ON vocabulary USING gin (attributes);

CREATE TABLE vocabulary_tag
(
    id   SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE vocabulary_tag_link
(
    vocabulary_id BIGINT REFERENCES vocabulary (id) ON DELETE CASCADE,
    tag_id        INT REFERENCES vocabulary_tag (id) ON DELETE CASCADE,
    PRIMARY KEY (vocabulary_id, tag_id)
);
