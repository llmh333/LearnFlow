package com.learnflow.backend.ai.provider;

/** {@code category} should be one of the fixed {@code mistake_category} names (PROJECT.md §4.5). */
public record MistakeAnalysis(String category, String topic) {}
