package com.learnflow.backend.srs.dto;

import com.learnflow.backend.srs.domain.ReviewHistory;
import com.learnflow.backend.srs.engine.SrsRating;
import java.math.BigDecimal;
import java.time.Instant;

public record ReviewHistoryResponse(
        Long id,
        Instant reviewedAt,
        SrsRating rating,
        BigDecimal previousInterval,
        BigDecimal newInterval,
        Integer responseTimeMs) {

    public static ReviewHistoryResponse from(ReviewHistory history) {
        return new ReviewHistoryResponse(
                history.getId(),
                history.getReviewedAt(),
                history.getRating(),
                history.getPreviousInterval(),
                history.getNewInterval(),
                history.getResponseTimeMs());
    }
}
