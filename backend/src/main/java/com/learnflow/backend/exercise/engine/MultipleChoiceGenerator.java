package com.learnflow.backend.exercise.engine;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import org.springframework.stereotype.Component;

/**
 * Builds a "what does this word mean" exercise: the word's own meaning plus 3 distractor meanings
 * picked from other words. Pure and deterministic given the same {@link Random}.
 */
@Component
public class MultipleChoiceGenerator {

    private static final int OPTION_COUNT = 4;

    /** Empty if fewer than {@code OPTION_COUNT - 1} distinct distractor meanings are available. */
    public Optional<ChoiceContent> generate(
            String word, String correctMeaning, List<String> distractorMeaningPool, Random random) {
        List<String> distractors =
                distractorMeaningPool.stream().filter(m -> !m.equals(correctMeaning)).distinct().toList();
        if (distractors.size() < OPTION_COUNT - 1) {
            return Optional.empty();
        }

        List<String> shuffledDistractors = new ArrayList<>(distractors);
        Collections.shuffle(shuffledDistractors, random);

        List<String> options = new ArrayList<>(shuffledDistractors.subList(0, OPTION_COUNT - 1));
        options.add(correctMeaning);
        Collections.shuffle(options, random);

        String question = "What does \"%s\" mean?".formatted(word);
        return Optional.of(new ChoiceContent(question, options, options.indexOf(correctMeaning)));
    }
}
