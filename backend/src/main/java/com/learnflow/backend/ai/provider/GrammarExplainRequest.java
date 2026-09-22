package com.learnflow.backend.ai.provider;

public record GrammarExplainRequest(String languageCode, String question, String currentLevel) {}
