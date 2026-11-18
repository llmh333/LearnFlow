package com.learnflow.backend.ai.context;

import java.util.List;
import org.springframework.stereotype.Component;

/**
 * Builds a small, bounded {@link LearnerContext} for AI prompts. Reads learner data only through
 * other modules' public services, never a repository.
 */
@Component
public class AIContextBuilder {

    // shortcut: no learner data yet (old SRS removed in the DB redesign), so every learner gets the
    // beginner level and no weak words; read srs_card/lesson_progress once they exist (R3).
    public LearnerContext build(Long userId, String languageCode) {
        return new LearnerContext(languageCode, beginnerLevelFor(languageCode), List.of());
    }

    private String beginnerLevelFor(String languageCode) {
        return switch (languageCode == null ? "" : languageCode) {
            case "en" -> "A1";
            case "zh" -> "HSK 1";
            case "ja" -> "N5";
            default -> "beginner";
        };
    }
}
