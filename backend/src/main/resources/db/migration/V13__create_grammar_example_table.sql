CREATE TABLE grammar_example
(
    grammar_point_id BIGINT NOT NULL REFERENCES grammar_point (id) ON DELETE CASCADE,
    position         INT    NOT NULL CHECK (position >= 0),
    sentence_id      BIGINT NOT NULL REFERENCES example_sentence (id),
    PRIMARY KEY (grammar_point_id, position)
);
