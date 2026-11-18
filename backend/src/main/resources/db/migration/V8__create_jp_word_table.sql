-- Arrays: NOT NULL, no NULL or empty elements; meanings_vi must have at least one entry.
CREATE TABLE jp_word
(
    id             BIGSERIAL PRIMARY KEY,
    content_key    VARCHAR(100) NOT NULL UNIQUE,
    written        VARCHAR(100) CHECK (written <> ''),
    reading        VARCHAR(100) NOT NULL CHECK (reading <> ''),
    meanings_vi    TEXT[]       NOT NULL CHECK (cardinality(meanings_vi) > 0
        AND array_position(meanings_vi, NULL) IS NULL AND array_position(meanings_vi, '') IS NULL),
    meanings_en    TEXT[]       NOT NULL CHECK (array_position(meanings_en, NULL) IS NULL),
    part_of_speech TEXT[]       NOT NULL CHECK (array_position(part_of_speech, NULL) IS NULL),
    jlpt_level     VARCHAR(2) CHECK (jlpt_level IN ('N5', 'N4', 'N3', 'N2', 'N1')),
    note           TEXT,
    status         VARCHAR(10)  NOT NULL CHECK (status IN ('DRAFT', 'REVIEWED')),
    source_id      BIGINT       NOT NULL REFERENCES content_source (id),
    source_ref     VARCHAR(100)
);

CREATE INDEX idx_jp_word_reading ON jp_word (reading);

CREATE INDEX idx_jp_word_written ON jp_word (written);
