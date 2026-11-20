-- D18: an example sentence is written in one language.
ALTER TABLE example_sentence
    ADD COLUMN language_id SMALLINT REFERENCES language (id);

UPDATE example_sentence s
SET language_id = l.id
FROM language l
WHERE l.code = 'ja';

ALTER TABLE example_sentence
    ALTER COLUMN language_id SET NOT NULL;
