package com.learnflow.backend.exercise.scheduler;

import com.learnflow.backend.auth.AuthService;
import com.learnflow.backend.exercise.ExerciseProperties;
import com.learnflow.backend.exercise.ExerciseService;
import com.learnflow.backend.language.LanguageService;
import com.learnflow.backend.language.dto.LanguageResponse;
import com.learnflow.backend.vocabulary.VocabularyService;
import java.time.Clock;
import java.time.LocalDate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Keeps the AI-generated exercise buffer always {@code pregenerateDays} days deep (today, today+1,
 * ... today+(pregenerateDays-1)) for every user × language they have vocabulary in. Runs once a
 * day; each run tops up whatever is missing rather than counting a fixed "3 days since last run",
 * so a missed run self-heals on the next one instead of leaving a permanent gap.
 */
@Component
public class ExerciseGenerationScheduler {

    private static final Logger log = LoggerFactory.getLogger(ExerciseGenerationScheduler.class);

    private final AuthService authService;
    private final LanguageService languageService;
    private final VocabularyService vocabularyService;
    private final ExerciseService exerciseService;
    private final ExerciseProperties properties;
    private final Clock clock;

    public ExerciseGenerationScheduler(
            AuthService authService,
            LanguageService languageService,
            VocabularyService vocabularyService,
            ExerciseService exerciseService,
            ExerciseProperties properties,
            Clock clock) {
        this.authService = authService;
        this.languageService = languageService;
        this.vocabularyService = vocabularyService;
        this.exerciseService = exerciseService;
        this.properties = properties;
        this.clock = clock;
    }

    @Scheduled(cron = "${app.exercise.cron:0 0 3 * * *}")
    public void topUpAiExercises() {
        LocalDate targetHorizon = LocalDate.now(clock).plusDays(properties.pregenerateDays() - 1L);

        for (Long userId : authService.listActiveUserIds()) {
            for (LanguageResponse language : languageService.listAll()) {
                try {
                    if (vocabularyService.countByLanguage(userId, language.code()) == 0) {
                        continue;
                    }
                    exerciseService.topUpAiExercisesFor(userId, language.code(), targetHorizon);
                } catch (Exception e) {
                    log.warn(
                            "Failed to top up AI exercises for user {} language {}: {}",
                            userId,
                            language.code(),
                            e.getMessage());
                }
            }
        }
    }
}
