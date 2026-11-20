-- Sino-Vietnamese (Hán Việt) readings, e.g. 学 → HỌC; KANJIDIC2 has them for every N5 kanji.
ALTER TABLE jp_kanji
    ADD COLUMN han_viet TEXT[] NOT NULL DEFAULT '{}' CHECK (array_position(han_viet, NULL) IS NULL);
