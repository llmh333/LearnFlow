-- Readings now live in han_character_reading (V29).
ALTER TABLE han_character
    DROP COLUMN onyomi,
    DROP COLUMN kunyomi;
