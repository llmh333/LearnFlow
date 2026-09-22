package com.learnflow.backend.vocabulary;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.learnflow.backend.common.error.BadRequestException;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class VocabularyAttributesValidatorTest {

    private final VocabularyAttributesValidator validator = new VocabularyAttributesValidator();

    @Test
    void validate_emptyAttributes_neverRejected() {
        for (String code : List.of("en", "zh", "ja")) {
            validator.validate(code, Map.of());
        }
    }

    @Test
    void validate_english_acceptsWhitelistedKeys() {
        validator.validate(
                "en",
                Map.of(
                        "ipa", "/əˈtʃiːv/",
                        "partOfSpeech", "verb",
                        "cefrLevel", "B1",
                        "collocations", List.of("achieve a goal")));
    }

    @Test
    void validate_chinese_acceptsWhitelistedKeys() {
        validator.validate(
                "zh",
                Map.of(
                        "pinyin", "xuéxí",
                        "hskLevel", 1,
                        "examplePinyin", "Wǒ měitiān xuéxí Zhōngwén.",
                        "measureWord", "个"));
    }

    @Test
    void validate_japanese_acceptsWhitelistedKeys() {
        validator.validate(
                "ja",
                Map.of(
                        "reading", "べんきょう",
                        "exampleReading", "まいにちにほんごをべんきょうします。",
                        "partOfSpeech", "noun",
                        "jlptLevel", "N5"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"en", "zh", "ja"})
    void validate_unknownKey_rejectedForEveryLanguage(String code) {
        assertThatThrownBy(() -> validator.validate(code, Map.of("notARealKey", "value")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("notARealKey");
    }

    @Test
    void validate_missingKeys_doesNotThrow() {
        // Partial attributes are allowed — only unknown keys are rejected, not absent ones.
        validator.validate("en", Map.of("ipa", "/test/"));
    }

    @Test
    void validate_unknownLanguage_withAttributes_rejected() {
        assertThatThrownBy(() -> validator.validate("fr", Map.of("anything", "value")))
                .isInstanceOf(BadRequestException.class);
        assertThat(validator).isNotNull();
    }

    @Test
    void validate_unknownLanguage_withoutAttributes_allowed() {
        validator.validate("fr", Map.of());
    }
}
