package com.learnflow.backend.srs;

import com.learnflow.backend.common.error.NotFoundException;
import com.learnflow.backend.srs.domain.ReviewHistory;
import com.learnflow.backend.srs.domain.ReviewSchedule;
import com.learnflow.backend.srs.dto.DueVocabularyResponse;
import com.learnflow.backend.srs.dto.ReviewHistoryResponse;
import com.learnflow.backend.srs.dto.ReviewSubmitResponse;
import com.learnflow.backend.srs.engine.SrsAlgorithm;
import com.learnflow.backend.srs.engine.SrsRating;
import com.learnflow.backend.srs.engine.SrsState;
import com.learnflow.backend.vocabulary.domain.Vocabulary;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Owns the SRS lifecycle for every word. Per {@code plan/phases/00-overview.md} §3 rule 1, this is
 * the *only* path that may write {@code review_schedule} — the {@code ai} module must never touch
 * it directly, even indirectly through this service's internals.
 */
@Service
@Transactional
public class ReviewService {

    private final ReviewScheduleRepository scheduleRepository;
    private final ReviewHistoryRepository historyRepository;
    private final SrsAlgorithm algorithm;
    private final EntityManager entityManager;
    private final Clock clock;

    public ReviewService(
            ReviewScheduleRepository scheduleRepository,
            ReviewHistoryRepository historyRepository,
            SrsAlgorithm algorithm,
            EntityManager entityManager,
            Clock clock) {
        this.scheduleRepository = scheduleRepository;
        this.historyRepository = historyRepository;
        this.algorithm = algorithm;
        this.entityManager = entityManager;
        this.clock = clock;
    }

    /**
     * Called by {@code VocabularyService} right after a new word is persisted. Uses {@link
     * EntityManager#getReference} instead of {@code VocabularyRepository} so this module never
     * depends on another module's repository (00-overview.md §1.1 rule 2).
     */
    public void createScheduleFor(Long vocabularyId) {
        if (scheduleRepository.existsById(vocabularyId)) {
            return;
        }
        Vocabulary vocabularyRef = entityManager.getReference(Vocabulary.class, vocabularyId);
        scheduleRepository.save(new ReviewSchedule(vocabularyRef, Instant.now(clock)));
    }

    @Transactional(readOnly = true)
    public List<DueVocabularyResponse> findDue(String languageCode, int limit) {
        Instant now = Instant.now(clock);
        Pageable pageable = PageRequest.of(0, limit);
        List<ReviewSchedule> due =
                (languageCode == null || languageCode.isBlank())
                        ? scheduleRepository.findDue(now, pageable)
                        : scheduleRepository.findDueByLanguageCode(languageCode, now, pageable);
        return due.stream().map(DueVocabularyResponse::from).toList();
    }

    public ReviewSubmitResponse submit(
            Long vocabularyId, SrsRating rating, Integer responseTimeMs, Long studySessionId) {
        ReviewSchedule schedule =
                scheduleRepository
                        .findById(vocabularyId)
                        .orElseThrow(
                                () ->
                                        new NotFoundException(
                                                "Review schedule not found for vocabulary: " + vocabularyId));

        SrsState previousState = toState(schedule);
        BigDecimal previousInterval = schedule.getIntervalDays();

        SrsState newState = algorithm.apply(previousState, rating);
        Instant now = Instant.now(clock);
        applyState(schedule, newState, now);

        historyRepository.save(
                new ReviewHistory(
                        vocabularyId,
                        studySessionId,
                        now,
                        rating,
                        previousInterval,
                        schedule.getIntervalDays(),
                        responseTimeMs));

        return ReviewSubmitResponse.from(schedule);
    }

    @Transactional(readOnly = true)
    public List<ReviewHistoryResponse> historyOf(Long vocabularyId) {
        return historyRepository.findByVocabularyIdOrderByReviewedAtDesc(vocabularyId).stream()
                .map(ReviewHistoryResponse::from)
                .toList();
    }

    private SrsState toState(ReviewSchedule schedule) {
        return new SrsState(
                schedule.getIntervalDays().doubleValue(),
                schedule.getEaseFactor().doubleValue(),
                schedule.getReviewCount(),
                schedule.getSuccessCount(),
                schedule.getFailureCount(),
                schedule.getMemoryStrength().doubleValue());
    }

    private void applyState(ReviewSchedule schedule, SrsState state, Instant now) {
        schedule.setIntervalDays(toScaledBigDecimal(state.intervalDays(), 2));
        schedule.setEaseFactor(toScaledBigDecimal(state.easeFactor(), 2));
        schedule.setReviewCount(state.reviewCount());
        schedule.setSuccessCount(state.successCount());
        schedule.setFailureCount(state.failureCount());
        schedule.setMemoryStrength(toScaledBigDecimal(state.memoryStrength(), 2));
        schedule.setLastReview(now);
        schedule.setNextReview(now.plus(daysToDuration(state.intervalDays())));
    }

    private BigDecimal toScaledBigDecimal(double value, int scale) {
        return BigDecimal.valueOf(value).setScale(scale, RoundingMode.HALF_UP);
    }

    private Duration daysToDuration(double days) {
        return Duration.ofSeconds(Math.round(days * 86400));
    }
}
