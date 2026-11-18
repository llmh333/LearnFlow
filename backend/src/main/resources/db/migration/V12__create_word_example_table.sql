-- Join tables are keyed by (parent, position): reordering is a plain UPDATE per slot.
CREATE TABLE word_example
(
    word_id     BIGINT NOT NULL REFERENCES jp_word (id) ON DELETE CASCADE,
    position    INT    NOT NULL CHECK (position >= 0),
    sentence_id BIGINT NOT NULL REFERENCES example_sentence (id),
    PRIMARY KEY (word_id, position)
);
