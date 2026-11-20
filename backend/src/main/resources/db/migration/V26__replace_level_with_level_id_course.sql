-- course.level (enum incl. KANA) → proficiency_level. The Kana course has no level (NULL).
ALTER TABLE course
    ADD COLUMN level_id SMALLINT REFERENCES proficiency_level (id);

UPDATE course c
SET level_id = p.id
FROM proficiency_level p
WHERE p.language_id = c.language_id
  AND p.code = c.level;

ALTER TABLE course
    DROP COLUMN level;
