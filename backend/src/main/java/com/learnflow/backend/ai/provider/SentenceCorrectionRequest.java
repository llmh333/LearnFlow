package com.learnflow.backend.ai.provider;

public record SentenceCorrectionRequest(String languageCode, String text, String currentLevel) {}
