package com.learnflow.backend.srs.dto;

/** Aggregated stats for one study session, computed from its {@code review_history} rows. */
public record SessionSummary(int wordsReviewed, int wordsLearned, int mistakesCount) {}
