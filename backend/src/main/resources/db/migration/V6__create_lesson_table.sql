CREATE TABLE lesson
(
    id          BIGSERIAL PRIMARY KEY,
    content_key VARCHAR(100) NOT NULL UNIQUE,
    unit_id     BIGINT       NOT NULL REFERENCES unit (id),
    position    INT          NOT NULL CHECK (position > 0),
    title       VARCHAR(200) NOT NULL,
    status      VARCHAR(10)  NOT NULL CHECK (status IN ('DRAFT', 'REVIEWED')),
    CONSTRAINT uq_lesson_position UNIQUE (unit_id, position) DEFERRABLE INITIALLY DEFERRED
);
