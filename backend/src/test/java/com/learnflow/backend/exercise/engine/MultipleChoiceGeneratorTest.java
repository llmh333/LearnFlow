package com.learnflow.backend.exercise.engine;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Random;
import org.junit.jupiter.api.Test;

class MultipleChoiceGeneratorTest {

    private final MultipleChoiceGenerator generator = new MultipleChoiceGenerator();

    @Test
    void generate_enoughDistractors_returnsFourOptionsWithCorrectAnswerIncluded() {
        var result =
                generator.generate(
                        "achieve",
                        "đạt được",
                        List.of("quả chuối", "học tập", "làm việc", "gia đình"),
                        new Random(1));

        assertThat(result).isPresent();
        assertThat(result.get().options()).hasSize(4);
        assertThat(result.get().options()).contains("đạt được");
        assertThat(result.get().options().get(result.get().correctOptionIndex())).isEqualTo("đạt được");
        assertThat(result.get().question()).contains("achieve");
    }

    @Test
    void generate_notEnoughDistinctDistractors_isEmpty() {
        var result =
                generator.generate("achieve", "đạt được", List.of("học tập", "học tập"), new Random(1));

        assertThat(result).isEmpty();
    }

    @Test
    void generate_distractorPoolContainingTheCorrectMeaning_excludesItFromDistractors() {
        var result =
                generator.generate(
                        "achieve",
                        "đạt được",
                        List.of("đạt được", "quả chuối", "học tập", "làm việc", "gia đình"),
                        new Random(1));

        assertThat(result).isPresent();
        assertThat(result.get().options()).hasSize(4);
        // "đạt được" only appears once even though the pool contained it as a "distractor" too.
        assertThat(result.get().options()).filteredOn("đạt được"::equals).hasSize(1);
    }

    @Test
    void generate_correctOptionIndexAlwaysWithinBounds() {
        for (long seed = 0; seed < 50; seed++) {
            var result =
                    generator.generate(
                            "achieve",
                            "đạt được",
                            List.of("quả chuối", "học tập", "làm việc", "gia đình"),
                            new Random(seed));
            assertThat(result).isPresent();
            assertThat(result.get().correctOptionIndex()).isBetween(0, 3);
        }
    }
}
