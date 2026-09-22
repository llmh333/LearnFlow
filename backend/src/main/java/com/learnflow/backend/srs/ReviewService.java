package com.learnflow.backend.srs;

import com.learnflow.backend.common.error.NotFoundException;
import com.learnflow.backend.srs.domain.ReviewHistory;
import com.learnflow.backend.srs.domain.ReviewSchedule;
import com.learnflow.backend.srs.dto.DueVocabularyResponse;
import com.learnflow.backend.srs.dto.ReviewHistoryResponse;
import com.learnflow.backend.srs.dto.ReviewSubmitResponse;
import com.learnflow.backend.srs.dto.RetentionStats;
import com.learnflow.backend.srs.dto.ScheduleSnapshot;
import com.learnflow.backend.srs.dto.SessionSummary;
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
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
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

    /**
     * Streak/retention windows only look back this far — a personal app doesn't need to scan its
     * entire history for a "last 60 days" style stat.
     */
    private static final int STREAK_LOOKBACK_DAYS = 60;

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
                        schedule.getVocabulary(),
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
        return historyRepository.findByVocabulary_IdOrderByReviewedAtDesc(vocabularyId).stream()
                .map(ReviewHistoryResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public long countDue(String languageCode) {
        Instant now = Instant.now(clock);
        return (languageCode == null || languageCode.isBlank())
                ? scheduleRepository.countByNextReviewLessThanEqual(now)
                : scheduleRepository.countDueByLanguageCode(languageCode, now);
    }

    /** Words never reviewed yet — the pool of "new" words a learner could start today. */
    @Transactional(readOnly = true)
    public long countNew(String languageCode) {
        return (languageCode == null || languageCode.isBlank())
                ? scheduleRepository.countByReviewCount(0)
                : scheduleRepository.countNewByLanguageCode(languageCode);
    }

    @Transactional(readOnly = true)
    public List<ScheduleSnapshot> allSchedules(String languageCode) {
        List<ReviewSchedule> schedules =
                (languageCode == null || languageCode.isBlank())
                        ? scheduleRepository.findAll()
                        : scheduleRepository.findAllByVocabulary_Language_Code(languageCode);
        return schedules.stream().map(ScheduleSnapshot::from).toList();
    }

    @Transactional(readOnly = true)
    public RetentionStats retentionStats(String languageCode, int days) {
        Instant since = Instant.now(clock).minus(Duration.ofDays(days));
        long total =
                (languageCode == null || languageCode.isBlank())
                        ? historyRepository.countByReviewedAtGreaterThanEqual(since)
                        : historyRepository.countByLanguageCodeAndReviewedAtGreaterThanEqual(
                                languageCode, since);
        long success =
                (languageCode == null || languageCode.isBlank())
                        ? historyRepository.countByReviewedAtGreaterThanEqualAndRatingNot(
                                since, SrsRating.AGAIN)
                        : historyRepository.countByLanguageCodeAndReviewedAtGreaterThanEqualAndRatingNot(
                                languageCode, since, SrsRating.AGAIN);
        return new RetentionStats(success, total);
    }

    /** Consecutive days (ending today, UTC) with at least one review. */
    @Transactional(readOnly = true)
    public int currentStreakDays() {
        Instant since = Instant.now(clock).minus(Duration.ofDays(STREAK_LOOKBACK_DAYS));
        Set<LocalDate> activeDays = new HashSet<>();
        for (Instant reviewedAt : historyRepository.findReviewedTimestampsSince(since)) {
            activeDays.add(reviewedAt.atZone(ZoneOffset.UTC).toLocalDate());
        }

        LocalDate day = LocalDate.now(clock.withZone(ZoneOffset.UTC));
        int streak = 0;
        while (activeDays.contains(day)) {
            streak++;
            day = day.minusDays(1);
        }
        return streak;
    }

    @Transactional(readOnly = true)
    public SessionSummary summarizeSession(Long studySessionId) {
        List<ReviewHistory> entries = historyRepository.findByStudySessionId(studySessionId);
        long wordsReviewed = entries.stream().map(h -> h.getVocabulary().getId()).distinct().count();
        long wordsLearned =
                entries.stream()
                        .filter(h -> h.getPreviousInterval() != null && h.getPreviousInterval().signum() == 0)
                        .count();
        long mistakes = entries.stream().filter(h -> h.getRating() == SrsRating.AGAIN).count();
        return new SessionSummary((int) wordsReviewed, (int) wordsLearned, (int) mistakes);
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
