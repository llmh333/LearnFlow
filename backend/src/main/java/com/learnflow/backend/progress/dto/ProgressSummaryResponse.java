package com.learnflow.backend.progress.dto;

public record ProgressSummaryResponse(
        long total, long newCount, long learningCount, long masteredCount, long dueCount) {}
