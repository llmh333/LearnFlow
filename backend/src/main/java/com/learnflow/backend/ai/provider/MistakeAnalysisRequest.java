package com.learnflow.backend.ai.provider;

public record MistakeAnalysisRequest(
        String languageCode, String original, String corrected, String explanation) {}
