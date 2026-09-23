package com.learnflow.backend.srs.domain;

import com.learnflow.backend.auth.domain.User;
import com.learnflow.backend.srs.engine.SrsRating;
import com.learnflow.backend.vocabulary.domain.Vocabulary;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Append-only log of every review, kept even after a word is deleted from view (cascades with the
 * word) so retention/progress analytics (Phase 4+) have real history to compute from.
 *
 * <p>Maps {@code vocabulary} as a JPA relation (not a raw {@code Long} id) so Phase 4's
 * language-filtered retention/weak-area queries can traverse {@code h.vocabulary.language.code} in
 * JPQL, the same pattern {@code ReviewSchedule} already uses.
 */
@Entity
@Table(name = "review_history")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ReviewHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vocabulary_id", nullable = false)
    private Vocabulary vocabulary;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

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
            Vocabulary vocabulary,
            User user,
            Long studySessionId,
            Instant reviewedAt,
            SrsRating rating,
            BigDecimal previousInterval,
            BigDecimal newInterval,
            Integer responseTimeMs) {
        this.vocabulary = vocabulary;
        this.user = user;
        this.studySessionId = studySessionId;
        this.reviewedAt = reviewedAt;
        this.rating = rating;
        this.previousInterval = previousInterval;
        this.newInterval = newInterval;
        this.responseTimeMs = responseTimeMs;
    }
}
