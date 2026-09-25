package com.learnflow.backend.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Turns on {@code @Scheduled} methods app-wide (currently just the nightly AI-exercise top-up,
 * see {@code exercise.scheduler.ExerciseGenerationScheduler}). */
@Configuration
@EnableScheduling
public class SchedulingConfig {}
