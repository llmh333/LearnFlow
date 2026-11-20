package com.learnflow.backend.curriculum.engine;

import com.learnflow.backend.curriculum.domain.ReadingKind;
import java.util.List;
import java.util.Set;

public final class JapaneseRules implements LanguageRules {

    @Override
    public String code() {
        return "ja";
    }

    @Override
    public List<String> levels() {
        return List.of("N5", "N4", "N3", "N2", "N1");
    }

    @Override
    public boolean isValidReading(String reading) {
        return reading != null
                && !reading.isBlank()
                && reading.codePoints().allMatch(JapaneseRules::isKana);
    }

    @Override
    public String readingRule() {
        return "kana only";
    }

    @Override
    public Set<ReadingKind> characterReadingKinds() {
        return Set.of(ReadingKind.ON, ReadingKind.KUN);
    }

    static boolean isHiragana(int cp) {
        return cp >= 0x3041 && cp <= 0x309F;
    }

    static boolean isKatakana(int cp) {
        return cp >= 0x30A0 && cp <= 0x30FF;
    }

    static boolean isKana(int cp) {
        return isHiragana(cp) || isKatakana(cp);
    }
}
