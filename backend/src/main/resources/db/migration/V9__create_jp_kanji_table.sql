CREATE TABLE jp_kanji
(
    id           BIGSERIAL PRIMARY KEY,
    content_key  VARCHAR(100) NOT NULL UNIQUE,
    character    VARCHAR(2)   NOT NULL UNIQUE CHECK (char_length(character) = 1),
    meanings_vi  TEXT[]       NOT NULL CHECK (cardinality(meanings_vi) > 0
        AND array_position(meanings_vi, NULL) IS NULL AND array_position(meanings_vi, '') IS NULL),
    meanings_en  TEXT[]       NOT NULL CHECK (array_position(meanings_en, NULL) IS NULL),
    onyomi       TEXT[]       NOT NULL CHECK (array_position(onyomi, NULL) IS NULL),
    kunyomi      TEXT[]       NOT NULL CHECK (array_position(kunyomi, NULL) IS NULL),
    stroke_count SMALLINT CHECK (stroke_count > 0),
    jlpt_level   VARCHAR(2) CHECK (jlpt_level IN ('N5', 'N4', 'N3', 'N2', 'N1')),
    status       VARCHAR(10)  NOT NULL CHECK (status IN ('DRAFT', 'REVIEWED')),
    source_id    BIGINT       NOT NULL REFERENCES content_source (id),
    source_ref   VARCHAR(100)
);
