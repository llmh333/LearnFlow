package com.learnflow.backend.dashboard;

import com.learnflow.backend.dashboard.dto.DashboardTodayResponse;
import com.learnflow.backend.dashboard.dto.LanguageTodaySummary;
import com.learnflow.backend.language.LanguageService;
import com.learnflow.backend.language.dto.LanguageResponse;
import com.learnflow.backend.srs.ReviewService;
import com.learnflow.backend.srs.dto.RetentionStats;
import com.learnflow.backend.vocabulary.VocabularyService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Answers "what do I need to learn today?" (PROJECT.md §4.1) by composing the other modules'
 * public services — same aggregator pattern as {@code progress}, no table of its own.
 */
@Service
@Transactional(readOnly = true)
public class DashboardService {

    private static final int RETENTION_WINDOW_DAYS = 30;

    /**
     * Placeholder pacing heuristic until the real Daily Plan engine exists (Phase 7): ~30s per due
     * review, ~1min per brand-new word. Not meant to be precise, just a rough "how long today".
     */
    private static final double MINUTES_PER_DUE_WORD = 0.5;

    private static final double MINUTES_PER_NEW_WORD = 1.0;

    private final LanguageService languageService;
    private final VocabularyService vocabularyService;
    private final ReviewService reviewService;

    public DashboardService(
            LanguageService languageService,
            VocabularyService vocabularyService,
            ReviewService reviewService) {
        this.languageService = languageService;
        this.vocabularyService = vocabularyService;
        this.reviewService = reviewService;
    }

    public DashboardTodayResponse today() {
        var languages =
                languageService.listAll().stream().map(this::summarize).toList();
        int totalEstimatedMinutes =
                languages.stream().mapToInt(LanguageTodaySummary::estimatedMinutes).sum();
        int streakDays = reviewService.currentStreakDays();

        return new DashboardTodayResponse(languages, totalEstimatedMinutes, streakDays);
    }

    private LanguageTodaySummary summarize(LanguageResponse language) {
        String code = language.code();
        long dueCount = reviewService.countDue(code);
        long newCount = reviewService.countNew(code);
        long total = vocabularyService.countByLanguage(code);
        long knownWords = total - newCount;
        RetentionStats retention = reviewService.retentionStats(code, RETENTION_WINDOW_DAYS);
        int estimatedMinutes =
                (int) Math.ceil(dueCount * MINUTES_PER_DUE_WORD + newCount * MINUTES_PER_NEW_WORD);

        return new LanguageTodaySummary(
                language, dueCount, newCount, knownWords, retention.rate() * 100, estimatedMinutes);
    }
}
