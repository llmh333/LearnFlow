CREATE TABLE example_sentence
(
    id             BIGSERIAL PRIMARY KEY,
    content_key    VARCHAR(100) NOT NULL UNIQUE,
    text           TEXT         NOT NULL CHECK (text <> ''),
    reading        TEXT,
    translation_vi TEXT         NOT NULL CHECK (translation_vi <> ''),
    translation_en TEXT,
    status         VARCHAR(10)  NOT NULL CHECK (status IN ('DRAFT', 'REVIEWED')),
    source_id      BIGINT       NOT NULL REFERENCES content_source (id),
    source_ref     VARCHAR(100),
    -- Tatoeba (CC BY) requires crediting each sentence's author.
    source_author  VARCHAR(100)
);
