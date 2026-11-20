-- Readings of a han character, any language: ON/KUN (ja), PINYIN (zh). Keyed by (character, position).
CREATE TABLE han_character_reading
(
    han_character_id BIGINT      NOT NULL REFERENCES han_character (id) ON DELETE CASCADE,
    position         INT         NOT NULL CHECK (position >= 0),
    kind             VARCHAR(10) NOT NULL CHECK (kind IN ('ON', 'KUN', 'PINYIN')),
    value            VARCHAR(50) NOT NULL CHECK (value <> ''),
    PRIMARY KEY (han_character_id, position)
);

-- Move the Japanese readings out of han_character's onyomi/kunyomi arrays (on first, then kun).
INSERT INTO han_character_reading (han_character_id, position, kind, value)
SELECT id, (row_number() OVER (PARTITION BY id ORDER BY ord)) - 1, kind, value
FROM (SELECT h.id, 'ON' AS kind, r.value, r.ord
      FROM han_character h, unnest(h.onyomi) WITH ORDINALITY AS r (value, ord)
      UNION ALL
      SELECT h.id, 'KUN', r.value, 1000 + r.ord
      FROM han_character h, unnest(h.kunyomi) WITH ORDINALITY AS r (value, ord)) AS readings;
