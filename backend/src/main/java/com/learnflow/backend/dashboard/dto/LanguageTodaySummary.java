package com.learnflow.backend.dashboard.dto;

import com.learnflow.backend.language.dto.LanguageResponse;

public record LanguageTodaySummary(
        LanguageResponse language,
        long dueCount,
        long newCount,
        long knownWords,
        double retentionPercent,
        int estimatedMinutes) {}
