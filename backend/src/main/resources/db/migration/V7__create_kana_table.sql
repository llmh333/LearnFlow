CREATE TABLE kana
(
    id          BIGSERIAL PRIMARY KEY,
    content_key VARCHAR(100) NOT NULL UNIQUE,
    character   VARCHAR(2)   NOT NULL UNIQUE,
    script      VARCHAR(10)  NOT NULL CHECK (script IN ('HIRAGANA', 'KATAKANA')),
    romaji      VARCHAR(5)   NOT NULL CHECK (romaji ~ '^[a-z]+$'),
    kana_group  VARCHAR(10)  NOT NULL CHECK (kana_group IN ('BASIC', 'DAKUTEN', 'HANDAKUTEN', 'YOON')),
    row_label   VARCHAR(5)   NOT NULL,
    position    INT          NOT NULL CHECK (position > 0),
    status      VARCHAR(10)  NOT NULL CHECK (status IN ('DRAFT', 'REVIEWED')),
    source_id   BIGINT       NOT NULL REFERENCES content_source (id),
    CONSTRAINT uq_kana_position UNIQUE (script, position) DEFERRABLE INITIALLY DEFERRED
);
