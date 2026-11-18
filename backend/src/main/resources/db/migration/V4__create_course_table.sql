CREATE TABLE course
(
    id          BIGSERIAL PRIMARY KEY,
    content_key VARCHAR(100) NOT NULL UNIQUE,
    language_id SMALLINT     NOT NULL REFERENCES language (id),
    level       VARCHAR(10)  NOT NULL CHECK (level IN ('KANA', 'N5', 'N4', 'N3')),
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    position    INT          NOT NULL CHECK (position > 0),
    status      VARCHAR(10)  NOT NULL CHECK (status IN ('DRAFT', 'REVIEWED')),
    -- Deferred so a re-import can reorder rows inside one transaction.
    CONSTRAINT uq_course_position UNIQUE (language_id, position) DEFERRABLE INITIALLY DEFERRED
);
