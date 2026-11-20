-- Exactly one target per row ("exclusive arc"): every target has a real foreign key.
CREATE TABLE lesson_item
(
    lesson_id        BIGINT NOT NULL REFERENCES lesson (id) ON DELETE CASCADE,
    position         INT    NOT NULL CHECK (position >= 0),
    kana_id          BIGINT REFERENCES kana (id),
    word_id          BIGINT REFERENCES jp_word (id),
    kanji_id         BIGINT REFERENCES jp_kanji (id),
    grammar_point_id BIGINT REFERENCES grammar_point (id),
    sentence_id      BIGINT REFERENCES example_sentence (id),
    PRIMARY KEY (lesson_id, position),
    CONSTRAINT chk_lesson_item_one_target
        CHECK (num_nonnulls(kana_id, word_id, kanji_id, grammar_point_id, sentence_id) = 1)
);
