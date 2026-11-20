-- D18: kanji (ja) and hanzi (zh) share one table; a character is unique per language, not globally.
ALTER TABLE jp_kanji RENAME TO han_character;
ALTER SEQUENCE jp_kanji_id_seq RENAME TO han_character_id_seq;
ALTER TABLE han_character RENAME CONSTRAINT jp_kanji_pkey TO han_character_pkey;
ALTER TABLE han_character RENAME CONSTRAINT jp_kanji_content_key_key TO han_character_content_key_key;
ALTER TABLE han_character DROP CONSTRAINT jp_kanji_character_key;

ALTER TABLE han_character
    ADD COLUMN language_id SMALLINT REFERENCES language (id),
    ADD COLUMN level_id    SMALLINT REFERENCES proficiency_level (id);

UPDATE han_character h
SET language_id = l.id,
    level_id    = (SELECT p.id FROM proficiency_level p WHERE p.language_id = l.id AND p.code = h.jlpt_level)
FROM language l
WHERE l.code = 'ja';

ALTER TABLE han_character
    ALTER COLUMN language_id SET NOT NULL,
    DROP COLUMN jlpt_level,
    ADD CONSTRAINT uq_han_character_language_character UNIQUE (language_id, character);
