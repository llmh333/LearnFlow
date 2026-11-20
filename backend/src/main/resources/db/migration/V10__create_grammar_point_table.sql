CREATE TABLE grammar_point
(
    id             BIGSERIAL PRIMARY KEY,
    content_key    VARCHAR(100) NOT NULL UNIQUE,
    pattern        VARCHAR(200) NOT NULL CHECK (pattern <> ''),
    meaning_vi     TEXT,
    explanation_vi TEXT         NOT NULL CHECK (explanation_vi <> ''),
    jlpt_level     VARCHAR(2) CHECK (jlpt_level IN ('N5', 'N4', 'N3', 'N2', 'N1')),
    status         VARCHAR(10)  NOT NULL CHECK (status IN ('DRAFT', 'REVIEWED')),
    source_id      BIGINT       NOT NULL REFERENCES content_source (id)
);
