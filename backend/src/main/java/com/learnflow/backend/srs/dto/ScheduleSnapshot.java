package com.learnflow.backend.srs.dto;

import com.learnflow.backend.srs.domain.ReviewSchedule;
import java.math.BigDecimal;

/**
 * Read-only projection of a word's SRS state, for the {@code progress} module to aggregate
 * (mastery buckets, weak areas) without depending on {@code srs}'s repositories or JPA entities.
 */
public record ScheduleSnapshot(
        Long vocabularyId,
        String word,
        String meaning,
        BigDecimal intervalDays,
        BigDecimal easeFactor,
        int reviewCount,
        int successCount,
        int failureCount) {

    public static ScheduleSnapshot from(ReviewSchedule schedule) {
        var vocabulary = schedule.getVocabulary();
        return new ScheduleSnapshot(
                vocabulary.getId(),
                vocabulary.getWord(),
                vocabulary.getMeaning(),
                schedule.getIntervalDays(),
                schedule.getEaseFactor(),
                schedule.getReviewCount(),
                schedule.getSuccessCount(),
                schedule.getFailureCount());
    }
}
