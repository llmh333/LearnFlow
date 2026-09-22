package com.learnflow.backend.srs.domain;

import com.learnflow.backend.vocabulary.domain.Vocabulary;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One row per vocabulary word (shared primary key), holding its current SRS state. This entity
 * only stores state — the SRS calculation itself lives in {@code srs.engine} and never touches
 * persistence directly, per {@code plan/phases/00-overview.md} §3 rule 1.
 */
@Entity
@Table(name = "review_schedule")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ReviewSchedule {

    @Id
    private Long vocabularyId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "vocabulary_id")
    private Vocabulary vocabulary;

    @Setter
    @Column(name = "last_review")
    private Instant lastReview;

    @Setter
    @Column(name = "next_review", nullable = false)
    private Instant nextReview;

    @Setter
    @Column(name = "interval_days", nullable = false, precision = 10, scale = 2)
    private BigDecimal intervalDays;

    @Setter
    @Column(name = "ease_factor", nullable = false, precision = 4, scale = 2)
    private BigDecimal easeFactor;

    @Setter
    @Column(name = "review_count", nullable = false)
    private int reviewCount;

    @Setter
    @Column(name = "success_count", nullable = false)
    private int successCount;

    @Setter
    @Column(name = "failure_count", nullable = false)
    private int failureCount;

    @Setter
    @Column(name = "memory_strength", nullable = false, precision = 5, scale = 2)
    private BigDecimal memoryStrength;

    public ReviewSchedule(Vocabulary vocabulary, Instant now) {
        this.vocabulary = vocabulary;
        this.nextReview = now;
        this.intervalDays = BigDecimal.ZERO.setScale(2);
        this.easeFactor = BigDecimal.valueOf(2.5).setScale(2);
        this.reviewCount = 0;
        this.successCount = 0;
        this.failureCount = 0;
        this.memoryStrength = BigDecimal.ZERO.setScale(2);
    }
}
