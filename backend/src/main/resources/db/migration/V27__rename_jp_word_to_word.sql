-- D18: one word table for every language; jlpt_level → proficiency_level.
ALTER TABLE jp_word RENAME TO word;
ALTER SEQUENCE jp_word_id_seq RENAME TO word_id_seq;
ALTER TABLE word RENAME CONSTRAINT jp_word_pkey TO word_pkey;
ALTER TABLE word RENAME CONSTRAINT jp_word_content_key_key TO word_content_key_key;
ALTER INDEX idx_jp_word_reading RENAME TO idx_word_reading;
ALTER INDEX idx_jp_word_written RENAME TO idx_word_written;

ALTER TABLE word
    ADD COLUMN language_id SMALLINT REFERENCES language (id),
    ADD COLUMN level_id    SMALLINT REFERENCES proficiency_level (id);

-- Every existing row is Japanese (the only language so far).
UPDATE word w
SET language_id = l.id,
    level_id    = (SELECT p.id FROM proficiency_level p WHERE p.language_id = l.id AND p.code = w.jlpt_level)
FROM language l
WHERE l.code = 'ja';

ALTER TABLE word
    ALTER COLUMN language_id SET NOT NULL,
    DROP COLUMN jlpt_level;

CREATE INDEX idx_word_language_level ON word (language_id, level_id);
