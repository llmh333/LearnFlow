package com.learnflow.backend.vocabulary;

import com.learnflow.backend.common.error.BadRequestException;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

/**
 * Whitelists the keys allowed in {@code vocabulary.attributes} (JSONB) per language, per
 * {@code plan/PROJECT.md} §4.2 and decision D9. Each supported language has its own set of
 * exam-relevant fields; any other key is rejected so the column doesn't turn into an unbounded
 * bag of unrelated data (risk noted in {@code plan/phases/00-overview.md} §4).
 */
@Component
public class VocabularyAttributesValidator {

    private static final Map<String, Set<String>> ALLOWED_KEYS_BY_LANGUAGE =
            Map.of(
                    "en", Set.of("ipa", "partOfSpeech", "cefrLevel", "collocations"),
                    "zh", Set.of("pinyin", "hskLevel", "examplePinyin", "measureWord"),
                    "ja", Set.of("reading", "exampleReading", "partOfSpeech", "jlptLevel"));

    public void validate(String languageCode, Map<String, Object> attributes) {
        Set<String> allowedKeys = ALLOWED_KEYS_BY_LANGUAGE.get(languageCode.toLowerCase());
        if (allowedKeys == null) {
            // Unknown language: nothing to validate against, but don't silently accept anything.
            if (!attributes.isEmpty()) {
                throw new BadRequestException(
                        "No attribute schema registered for language: " + languageCode);
            }
            return;
        }

        for (String key : attributes.keySet()) {
            if (!allowedKeys.contains(key)) {
                throw new BadRequestException(
                        "Unknown attribute key '%s' for language '%s'. Allowed keys: %s"
                                .formatted(key, languageCode, allowedKeys));
            }
        }
    }
}
