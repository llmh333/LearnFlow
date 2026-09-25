package com.learnflow.backend.exercise.engine;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.Set;
import org.springframework.stereotype.Component;

/**
 * Builds a "put the words back in order" exercise from a vocabulary word's example sentence — pure
 * and deterministic given the same {@link Random}, no Spring/DB dependency beyond the
 * {@code @Component} annotation used to wire it, same shape as {@code srs.engine.Sm2Algorithm}.
 */
@Component
public class SentenceScrambleGenerator {

    private static final Set<String> CHARACTER_TOKENIZED_LANGUAGES = Set.of("zh", "ja");
    private static final int MAX_SHUFFLE_ATTEMPTS = 20;

    /** Empty if {@code example} is blank or too short (fewer than 2 tokens) to scramble. */
    public Optional<ScrambleContent> generate(String example, String languageCode, Random random) {
        if (example == null || example.isBlank()) {
            return Optional.empty();
        }
        List<String> tokens = tokenize(example, languageCode);
        if (tokens.size() < 2) {
            return Optional.empty();
        }

        List<String> shuffled = new ArrayList<>(tokens);
        for (int attempt = 0; attempt < MAX_SHUFFLE_ATTEMPTS && shuffled.equals(tokens); attempt++) {
            Collections.shuffle(shuffled, random);
        }
        return Optional.of(new ScrambleContent(tokens, shuffled));
    }

    private List<String> tokenize(String text, String languageCode) {
        String trimmed = text.trim();
        if (CHARACTER_TOKENIZED_LANGUAGES.contains(languageCode)) {
            return trimmed
                    .codePoints()
                    .filter(cp -> !Character.isWhitespace(cp))
                    .mapToObj(cp -> new String(Character.toChars(cp)))
                    .toList();
        }
        return Arrays.stream(trimmed.split("\\s+")).filter(t -> !t.isBlank()).toList();
    }
}
