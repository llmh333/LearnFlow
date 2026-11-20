-- D18: lesson items point at han_character (renamed from jp_kanji in V28).
ALTER TABLE lesson_item RENAME COLUMN kanji_id TO han_character_id;
