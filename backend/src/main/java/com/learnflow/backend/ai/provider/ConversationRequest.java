package com.learnflow.backend.ai.provider;

import java.util.List;

public record ConversationRequest(
        String languageCode,
        String scenario,
        String currentLevel,
        List<ConversationTurn> history,
        String userMessage) {}
