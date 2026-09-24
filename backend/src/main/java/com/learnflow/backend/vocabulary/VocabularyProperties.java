package com.learnflow.backend.vocabulary;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Binds {@code app.vocabulary.*}. {@code seedStarterPackOnRegister} defaults to true in
 * production ({@code application.yml}) but is turned off in {@code application-test.yml} — most
 * integration tests register a fresh account and then hand-compute exact vocabulary/progress
 * counts, an assumption the 300-word starter pack would otherwise break for every one of them.
 */
@ConfigurationProperties(prefix = "app.vocabulary")
public record VocabularyProperties(boolean seedStarterPackOnRegister) {}
