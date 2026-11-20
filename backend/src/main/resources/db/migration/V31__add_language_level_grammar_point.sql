-- D18: grammar belongs to a language; jlpt_level → proficiency_level.
ALTER TABLE grammar_point
    ADD COLUMN language_id SMALLINT REFERENCES language (id),
    ADD COLUMN level_id    SMALLINT REFERENCES proficiency_level (id);

UPDATE grammar_point g
SET language_id = l.id,
    level_id    = (SELECT p.id FROM proficiency_level p WHERE p.language_id = l.id AND p.code = g.jlpt_level)
FROM language l
WHERE l.code = 'ja';

ALTER TABLE grammar_point
    ALTER COLUMN language_id SET NOT NULL,
    DROP COLUMN jlpt_level;
