package com.learnflow.backend.dailyplan.engine;

/**
 * Deterministic input for one language: how many words are due, and (optionally) its weakest
 * mistake topic to target with a grammar exercise. No AI involved in producing this data.
 */
public record LanguageDemand(String languageCode, String languageName, long dueCount, String weakTopic) {}
