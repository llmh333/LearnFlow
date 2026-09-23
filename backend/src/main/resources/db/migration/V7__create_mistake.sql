CREATE TABLE mistake_category
(
    id   SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO mistake_category (name)
VALUES ('Vocabulary'),
       ('Grammar'),
       ('Word order'),
       ('Pronunciation'),
       ('Usage'),
       ('Spelling'),
       ('Tone'),
       ('Other');

CREATE TABLE mistake
(
    id             BIGSERIAL PRIMARY KEY,
    language_id    SMALLINT REFERENCES language (id),
    vocabulary_id  BIGINT REFERENCES vocabulary (id),
    category_id    INT REFERENCES mistake_category (id),
    topic          VARCHAR(100),
    original       TEXT        NOT NULL,
    corrected      TEXT        NOT NULL,
    explanation    TEXT,
    times_repeated INT         NOT NULL DEFAULT 1,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mistake_language ON mistake (language_id);
CREATE INDEX idx_mistake_topic_category ON mistake (language_id, category_id, topic);
