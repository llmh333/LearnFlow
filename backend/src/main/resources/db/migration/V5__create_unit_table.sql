CREATE TABLE unit
(
    id          BIGSERIAL PRIMARY KEY,
    content_key VARCHAR(100) NOT NULL UNIQUE,
    course_id   BIGINT       NOT NULL REFERENCES course (id),
    position    INT          NOT NULL CHECK (position > 0),
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    status      VARCHAR(10)  NOT NULL CHECK (status IN ('DRAFT', 'REVIEWED')),
    CONSTRAINT uq_unit_position UNIQUE (course_id, position) DEFERRABLE INITIALLY DEFERRED
);
