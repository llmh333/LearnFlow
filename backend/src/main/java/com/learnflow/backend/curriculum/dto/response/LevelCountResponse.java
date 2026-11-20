package com.learnflow.backend.curriculum.dto.response;

/**
 * How many dictionary words a level has. {@code level} is the code (N5, HSK1...) and {@code name}
 * its display name; both null for words without a level.
 */
public record LevelCountResponse(String level, String name, long wordCount) {}
