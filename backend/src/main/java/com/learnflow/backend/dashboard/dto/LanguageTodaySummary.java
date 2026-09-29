package com.learnflow.backend.dashboard.dto;

import com.learnflow.backend.language.dto.LanguageResponse;

public record LanguageTodaySummary(
        LanguageResponse language,
        long dueCount,
        long newCount,
        long knownWords,
        double retentionPercent,
        /** How many reviews {@code retentionPercent} is computed from (last 30 days) — lets the
         * client avoid presenting e.g. a 100% rate as confident when it's only based on 1-2
         * reviews. */
        long retentionSampleSize,
        int estimatedMinutes) {}
