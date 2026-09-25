package com.learnflow.backend.exercise.scheduler;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.learnflow.backend.auth.AuthService;
import com.learnflow.backend.exercise.ExerciseProperties;
import com.learnflow.backend.exercise.ExerciseService;
import com.learnflow.backend.language.LanguageService;
import com.learnflow.backend.language.dto.LanguageResponse;
import com.learnflow.backend.vocabulary.VocabularyService;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ExerciseGenerationSchedulerTest {

    private static final Clock FIXED_CLOCK =
            Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);

    @Mock private AuthService authService;
    @Mock private LanguageService languageService;
    @Mock private VocabularyService vocabularyService;
    @Mock private ExerciseService exerciseService;

    private ExerciseGenerationScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler =
                new ExerciseGenerationScheduler(
                        authService,
                        languageService,
                        vocabularyService,
                        exerciseService,
                        new ExerciseProperties(5, 3, 3),
                        FIXED_CLOCK);
    }

    @Test
    void topUpAiExercises_topsUpOnlyLanguagesTheUserHasVocabularyIn() {
        when(authService.listActiveUserIds()).thenReturn(List.of(1L));
        when(languageService.listAll())
                .thenReturn(
                        List.of(
                                new LanguageResponse((short) 1, "en", "English"),
                                new LanguageResponse((short) 2, "zh", "Chinese")));
        when(vocabularyService.countByLanguage(1L, "en")).thenReturn(10L);
        when(vocabularyService.countByLanguage(1L, "zh")).thenReturn(0L);

        scheduler.topUpAiExercises();

        LocalDate expectedHorizon = LocalDate.now(FIXED_CLOCK).plusDays(2);
        verify(exerciseService).topUpAiExercisesFor(1L, "en", expectedHorizon);
        verify(exerciseService, never()).topUpAiExercisesFor(eq(1L), eq("zh"), any());
    }

    @Test
    void topUpAiExercises_oneUserFailing_doesNotStopOthers() {
        when(authService.listActiveUserIds()).thenReturn(List.of(1L, 2L));
        when(languageService.listAll()).thenReturn(List.of(new LanguageResponse((short) 1, "en", "English")));
        when(vocabularyService.countByLanguage(1L, "en")).thenReturn(10L);
        when(vocabularyService.countByLanguage(2L, "en")).thenReturn(10L);
        doThrow(new RuntimeException("AI provider down"))
                .when(exerciseService)
                .topUpAiExercisesFor(eq(1L), eq("en"), any());

        scheduler.topUpAiExercises();

        verify(exerciseService).topUpAiExercisesFor(eq(2L), eq("en"), any());
    }
}
