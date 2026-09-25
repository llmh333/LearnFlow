package com.learnflow.backend.exercise.engine;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Random;
import org.junit.jupiter.api.Test;

class SentenceScrambleGeneratorTest {

    private final SentenceScrambleGenerator generator = new SentenceScrambleGenerator();

    @Test
    void generate_englishExample_tokenizesBySpace() {
        var result = generator.generate("I want to achieve my goals.", "en", new Random(1));

        assertThat(result).isPresent();
        assertThat(result.get().correctTokens())
                .containsExactly("I", "want", "to", "achieve", "my", "goals.");
    }

    @Test
    void generate_chineseExample_tokenizesByCharacter() {
        var result = generator.generate("我每天学习中文。", "zh", new Random(1));

        assertThat(result).isPresent();
        assertThat(result.get().correctTokens())
                .containsExactly("我", "每", "天", "学", "习", "中", "文", "。");
    }

    @Test
    void generate_japaneseExample_tokenizesByCharacter() {
        var result = generator.generate("私は毎日勉強します。", "ja", new Random(1));

        assertThat(result).isPresent();
        assertThat(result.get().correctTokens()).hasSize(10);
    }

    @Test
    void generate_shuffledOrderAlwaysDiffersFromCorrectOrder() {
        for (long seed = 0; seed < 50; seed++) {
            var result = generator.generate("I want to achieve my goals.", "en", new Random(seed));
            assertThat(result).isPresent();
            assertThat(result.get().shuffledTokens()).isNotEqualTo(result.get().correctTokens());
            assertThat(result.get().shuffledTokens())
                    .containsExactlyInAnyOrderElementsOf(result.get().correctTokens());
        }
    }

    @Test
    void generate_nullExample_isEmpty() {
        assertThat(generator.generate(null, "en", new Random(1))).isEmpty();
    }

    @Test
    void generate_blankExample_isEmpty() {
        assertThat(generator.generate("   ", "en", new Random(1))).isEmpty();
    }

    @Test
    void generate_singleWordExample_isEmpty() {
        assertThat(generator.generate("Hello", "en", new Random(1))).isEmpty();
    }

    @Test
    void generate_singleCharacterExample_isEmpty() {
        assertThat(generator.generate("是", "zh", new Random(1))).isEmpty();
    }
}
