package com.learnflow.backend.dashboard;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.learnflow.backend.dashboard.dto.DashboardTodayResponse;
import com.learnflow.backend.language.LanguageService;
import com.learnflow.backend.language.dto.LanguageResponse;
import com.learnflow.backend.srs.ReviewService;
import com.learnflow.backend.srs.dto.RetentionStats;
import com.learnflow.backend.vocabulary.VocabularyService;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock private LanguageService languageService;
    @Mock private VocabularyService vocabularyService;
    @Mock private ReviewService reviewService;

    private DashboardService dashboardService;

    @BeforeEach
    void setUp() {
        dashboardService = new DashboardService(languageService, vocabularyService, reviewService);
    }

    @Test
    void today_computesPerLanguageSummaryAndTotals() {
        LanguageResponse english = new LanguageResponse((short) 1, "en", "English");
        LanguageResponse chinese = new LanguageResponse((short) 2, "zh", "Chinese");
        when(languageService.listAll()).thenReturn(List.of(english, chinese));

        when(reviewService.countDue("en")).thenReturn(12L);
        when(reviewService.countNew("en")).thenReturn(5L);
        when(vocabularyService.countByLanguage("en")).thenReturn(1240L);
        when(reviewService.retentionStats("en", 30)).thenReturn(new RetentionStats(87L, 100L));

        when(reviewService.countDue("zh")).thenReturn(18L);
        when(reviewService.countNew("zh")).thenReturn(5L);
        when(vocabularyService.countByLanguage("zh")).thenReturn(420L);
        when(reviewService.retentionStats("zh", 30)).thenReturn(new RetentionStats(79L, 100L));

        when(reviewService.currentStreakDays()).thenReturn(7);

        DashboardTodayResponse response = dashboardService.today();

        assertThat(response.languages()).hasSize(2);
        var englishSummary = response.languages().get(0);
        assertThat(englishSummary.dueCount()).isEqualTo(12);
        assertThat(englishSummary.newCount()).isEqualTo(5);
        assertThat(englishSummary.knownWords()).isEqualTo(1235); // total - new
        assertThat(englishSummary.retentionPercent()).isEqualTo(87.0);
        // ceil(12 * 0.5 + 5 * 1.0) = ceil(11.0) = 11
        assertThat(englishSummary.estimatedMinutes()).isEqualTo(11);

        assertThat(response.streakDays()).isEqualTo(7);
        assertThat(response.totalEstimatedMinutes())
                .isEqualTo(response.languages().stream().mapToInt(l -> l.estimatedMinutes()).sum());
    }

    @Test
    void today_noLanguages_returnsEmptySummaryWithZeroTotals() {
        when(languageService.listAll()).thenReturn(List.of());
        when(reviewService.currentStreakDays()).thenReturn(0);

        DashboardTodayResponse response = dashboardService.today();

        assertThat(response.languages()).isEmpty();
        assertThat(response.totalEstimatedMinutes()).isZero();
        assertThat(response.streakDays()).isZero();
    }
}
