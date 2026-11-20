package com.learnflow.backend.curriculum.engine;

import com.learnflow.backend.curriculum.domain.ReadingKind;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * What differs per target language when validating content (D18). Adding a language means adding
 * one implementation here plus its rows in {@code language} and {@code proficiency_level}; the
 * tables, importer and API stay the same.
 */
public interface LanguageRules {

    /** Every language content can be written in, by code. */
    Map<String, LanguageRules> ALL = Map.of("ja", new JapaneseRules());

    static Optional<LanguageRules> forCode(String code) {
        return Optional.ofNullable(code == null ? null : ALL.get(code));
    }

    String code();

    /** Level codes, easiest first; must match the language's {@code proficiency_level} rows. */
    List<String> levels();

    /** Whether a word's reading is written correctly, e.g. kana only for Japanese. */
    boolean isValidReading(String reading);

    /** For error messages, e.g. "kana only". */
    String readingRule();

    /** Reading kinds a han character may have in this language, e.g. ON/KUN for Japanese. */
    Set<ReadingKind> characterReadingKinds();
}
