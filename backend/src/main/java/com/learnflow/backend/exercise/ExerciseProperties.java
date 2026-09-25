package com.learnflow.backend.exercise;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Binds {@code app.exercise.*} (cron expression stays a raw {@code ${}} placeholder on the
 * {@code @Scheduled} annotation itself, so it isn't duplicated here). */
@ConfigurationProperties(prefix = "app.exercise")
public record ExerciseProperties(int deterministicCountPerDay, int aiCountPerDay, int pregenerateDays) {}
