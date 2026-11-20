-- Levels are data, not enums (D18): each language has its own framework (JLPT, HSK, CEFR).
-- rank orders levels from easiest (1) up.
CREATE TABLE proficiency_level
(
    id          SMALLSERIAL PRIMARY KEY,
    language_id SMALLINT    NOT NULL REFERENCES language (id),
    framework   VARCHAR(10) NOT NULL CHECK (framework IN ('JLPT', 'HSK', 'CEFR')),
    code        VARCHAR(10) NOT NULL CHECK (code ~ '^[A-Z0-9]+$'),
    name        VARCHAR(50) NOT NULL CHECK (name <> ''),
    rank        SMALLINT    NOT NULL CHECK (rank > 0),
    CONSTRAINT uq_proficiency_level_code UNIQUE (language_id, code),
    CONSTRAINT uq_proficiency_level_rank UNIQUE (language_id, rank)
);

INSERT INTO proficiency_level (language_id, framework, code, name, rank)
SELECT l.id, 'JLPT', v.code, v.name, v.rank
FROM language l
CROSS JOIN (VALUES ('N5', 'JLPT N5', 1), ('N4', 'JLPT N4', 2), ('N3', 'JLPT N3', 3),
                   ('N2', 'JLPT N2', 4), ('N1', 'JLPT N1', 5)) AS v (code, name, rank)
WHERE l.code = 'ja';
