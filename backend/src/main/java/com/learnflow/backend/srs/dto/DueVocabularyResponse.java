package com.learnflow.backend.srs.dto;

import com.learnflow.backend.language.dto.LanguageResponse;
import com.learnflow.backend.srs.domain.ReviewSchedule;
import java.time.Instant;
import java.util.Map;

public record DueVocabularyResponse(
        Long vocabularyId,
        LanguageResponse language,
        String word,
        String meaning,
        String example,
        Map<String, Object> attributes,
        Instant nextReview,
        int reviewCount,
        double memoryStrength) {

    public static DueVocabularyResponse from(ReviewSchedule schedule) {
        var vocabulary = schedule.getVocabulary();
        return new DueVocabularyResponse(
                vocabulary.getId(),
                LanguageResponse.from(vocabulary.getLanguage()),
                vocabulary.getWord(),
                vocabulary.getMeaning(),
                vocabulary.getExample(),
                vocabulary.getAttributes(),
                schedule.getNextReview(),
                schedule.getReviewCount(),
                schedule.getMemoryStrength().doubleValue());
    }
}
