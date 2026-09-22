package com.learnflow.backend.progress;

import com.learnflow.backend.progress.dto.ProgressSummaryResponse;
import com.learnflow.backend.progress.dto.RetentionResponse;
import com.learnflow.backend.progress.dto.WeakAreaResponse;
import com.learnflow.backend.srs.ReviewService;
import com.learnflow.backend.srs.dto.RetentionStats;
import com.learnflow.backend.srs.dto.ScheduleSnapshot;
import com.learnflow.backend.study.StudySessionService;
import com.learnflow.backend.study.dto.StudySessionResponse;
import com.learnflow.backend.vocabulary.VocabularyService;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Pure aggregator: composes data already owned by other modules' public services. No own table
 * (per {@code PROJECT.md} §4.6/§6), no repository of its own, per the module boundary rule in
 * {@code plan/phases/00-overview.md} §1.1.
 */
@Service
@Transactional(readOnly = true)
public class ProgressService {

    private final VocabularyService vocabularyService;
    private final ReviewService reviewService;
    private final StudySessionService studySessionService;

    public ProgressService(
            VocabularyService vocabularyService,
            ReviewService reviewService,
            StudySessionService studySessionService) {
        this.vocabularyService = vocabularyService;
        this.reviewService = reviewService;
        this.studySessionService = studySessionService;
    }

    public ProgressSummaryResponse summary(String languageCode) {
        long total = vocabularyService.countByLanguage(languageCode);
        long dueCount = reviewService.countDue(languageCode);
        List<ScheduleSnapshot> schedules = reviewService.allSchedules(languageCode);

        long newCount = schedules.stream().filter(s -> s.reviewCount() == 0).count();
        long masteredCount =
                schedules.stream()
                        .filter(s -> MasteryPolicy.isMastered(s.intervalDays(), s.easeFactor()))
                        .count();
        long learningCount = schedules.size() - newCount - masteredCount;

        return new ProgressSummaryResponse(total, newCount, learningCount, masteredCount, dueCount);
    }

    public RetentionResponse retention(String languageCode, int days) {
        RetentionStats stats = reviewService.retentionStats(languageCode, days);
        return new RetentionResponse(stats.successCount(), stats.totalCount(), stats.rate() * 100);
    }

    /** Lowest ease factor first (weakest), tie-broken by highest failure rate. */
    public List<WeakAreaResponse> weakAreas(String languageCode, int limit) {
        return reviewService.allSchedules(languageCode).stream()
                .filter(s -> s.reviewCount() > 0)
                .sorted(
                        Comparator.comparing(ScheduleSnapshot::easeFactor)
                                .thenComparing(this::failureRate, Comparator.reverseOrder()))
                .limit(limit)
                .map(
                        s ->
                                new WeakAreaResponse(
                                        s.vocabularyId(),
                                        s.word(),
                                        s.meaning(),
                                        s.easeFactor(),
                                        s.reviewCount(),
                                        s.failureCount()))
                .toList();
    }

    public List<StudySessionResponse> history(String languageCode, Instant from, Instant to) {
        return studySessionService.listBetween(languageCode, from, to);
    }

    private double failureRate(ScheduleSnapshot snapshot) {
        return snapshot.reviewCount() == 0 ? 0.0 : (double) snapshot.failureCount() / snapshot.reviewCount();
    }
}
