package com.learnflow.backend.ai.context;

import com.learnflow.backend.srs.ReviewService;
import com.learnflow.backend.srs.dto.ScheduleSnapshot;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Component;

/**
 * Builds a small, bounded {@link LearnerContext} for AI prompts: the learner's estimated level
 * (decision D11 — inferred from vocabulary attributes, no separate Settings screen) plus their
 * top-N weakest words. Deliberately reads only through {@code srs.ReviewService}'s public surface
 * (never a repository), per the module boundary rule.
 */
@Component
public class AIContextBuilder {

    private static final int WEAK_WORDS_LIMIT = 10;

    private static final List<String> CEFR_ORDER = List.of("A1", "A2", "B1", "B2", "C1", "C2");
    private static final List<String> JLPT_ORDER = List.of("N5", "N4", "N3", "N2", "N1");

    private final ReviewService reviewService;

    public AIContextBuilder(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    public LearnerContext build(String languageCode) {
        List<ScheduleSnapshot> schedules = reviewService.allSchedules(languageCode);
        List<ScheduleSnapshot> engaged = schedules.stream().filter(s -> s.reviewCount() > 0).toList();

        String level = estimateLevel(languageCode, engaged);
        List<String> weakWords =
                engaged.stream()
                        .sorted(Comparator.comparing(ScheduleSnapshot::easeFactor))
                        .limit(WEAK_WORDS_LIMIT)
                        .map(ScheduleSnapshot::word)
                        .toList();

        return new LearnerContext(languageCode, level, weakWords);
    }

    private String estimateLevel(String languageCode, List<ScheduleSnapshot> engaged) {
        String attributeKey =
                switch (languageCode) {
                    case "en" -> "cefrLevel";
                    case "zh" -> "hskLevel";
                    case "ja" -> "jlptLevel";
                    default -> null;
                };
        if (attributeKey == null) {
            return "beginner";
        }
        if (engaged.isEmpty()) {
            return beginnerLevelFor(languageCode);
        }

        List<String> values =
                engaged.stream()
                        .map(s -> attributeValue(s.attributes(), attributeKey))
                        .filter(v -> v != null && !v.isBlank())
                        .toList();
        if (values.isEmpty()) {
            return beginnerLevelFor(languageCode);
        }

        return switch (languageCode) {
            case "en" -> highestByScale(values, CEFR_ORDER).orElse(beginnerLevelFor("en"));
            case "ja" -> highestByScale(values, JLPT_ORDER).orElse(beginnerLevelFor("ja"));
            case "zh" -> highestHskLevel(values).map(n -> "HSK " + n).orElse(beginnerLevelFor("zh"));
            default -> "beginner";
        };
    }

    private String attributeValue(Map<String, Object> attributes, String key) {
        Object value = attributes == null ? null : attributes.get(key);
        return value == null ? null : String.valueOf(value).trim().toUpperCase(Locale.ROOT);
    }

    private java.util.Optional<String> highestByScale(List<String> values, List<String> scale) {
        return values.stream()
                .filter(scale::contains)
                .max(Comparator.comparingInt(scale::indexOf));
    }

    private java.util.Optional<Integer> highestHskLevel(List<String> values) {
        return values.stream()
                .map(v -> v.replaceAll("[^0-9]", ""))
                .filter(v -> !v.isBlank())
                .map(Integer::parseInt)
                .filter(n -> n >= 1 && n <= 6)
                .max(Integer::compareTo);
    }

    private String beginnerLevelFor(String languageCode) {
        return switch (languageCode) {
            case "en" -> "A1";
            case "zh" -> "HSK 1";
            case "ja" -> "N5";
            default -> "beginner";
        };
    }
}
