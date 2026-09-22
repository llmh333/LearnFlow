package com.learnflow.backend.srs.dto;

import com.learnflow.backend.srs.domain.ReviewSchedule;
import java.math.BigDecimal;
import java.time.Instant;

public record ReviewSubmitResponse(
        Long vocabularyId,
        Instant lastReview,
        Instant nextReview,
        BigDecimal intervalDays,
        BigDecimal easeFactor,
        int reviewCount,
        int successCount,
        int failureCount,
        BigDecimal memoryStrength) {

    public static ReviewSubmitResponse from(ReviewSchedule schedule) {
        return new ReviewSubmitResponse(
                schedule.getVocabularyId(),
                schedule.getLastReview(),
                schedule.getNextReview(),
                schedule.getIntervalDays(),
                schedule.getEaseFactor(),
                schedule.getReviewCount(),
                schedule.getSuccessCount(),
                schedule.getFailureCount(),
                schedule.getMemoryStrength());
    }
}
