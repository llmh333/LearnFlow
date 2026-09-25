package com.learnflow.backend.exercise.domain;

public enum ExerciseSource {
    /** Built from the user's own vocabulary at request time — free, instant, no AI call. */
    DETERMINISTIC,
    /** Pre-generated ahead of time by the nightly cron job (ExerciseGenerationScheduler). */
    AI
}
