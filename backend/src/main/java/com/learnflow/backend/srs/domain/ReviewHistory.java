package com.learnflow.backend.srs.domain;

import com.learnflow.backend.srs.engine.SrsRating;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Append-only log of every review, kept even after a word is deleted from view (cascades with the
 * word) so retention/progress analytics (Phase 4+) have real history to compute from.
 */
@Entity
@Table(name = "review_history")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ReviewHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vocabulary_id", nullable = false)
    private Long vocabularyId;

    /** No FK yet — the study_session table doesn't exist until Phase 4 (see V4 migration note). */
    @Column(name = "study_session_id")
    private Long studySessionId;

    @Column(name = "reviewed_at", nullable = false)
    private Instant reviewedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "rating", nullable = false, length = 10)
    private SrsRating rating;

    @Column(name = "previous_interval", precision = 10, scale = 2)
    private BigDecimal previousInterval;

    @Column(name = "new_interval", precision = 10, scale = 2)
    private BigDecimal newInterval;

    @Column(name = "response_time_ms")
    private Integer responseTimeMs;

    public ReviewHistory(
            Long vocabularyId,
            Long studySessionId,
            Instant reviewedAt,
            SrsRating rating,
            BigDecimal previousInterval,
            BigDecimal newInterval,
            Integer responseTimeMs) {
        this.vocabularyId = vocabularyId;
        this.studySessionId = studySessionId;
        this.reviewedAt = reviewedAt;
        this.rating = rating;
        this.previousInterval = previousInterval;
        this.newInterval = newInterval;
        this.responseTimeMs = responseTimeMs;
    }
}
