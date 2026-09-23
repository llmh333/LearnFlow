package com.learnflow.backend.progress.dto;

import java.math.BigDecimal;

public record WeakAreaResponse(
        Long vocabularyId,
        String word,
        String meaning,
        BigDecimal easeFactor,
        int reviewCount,
        int failureCount) {}
