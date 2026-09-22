package com.learnflow.backend.ai.provider;

import java.util.List;

public record ConversationSummaryRequest(String languageCode, List<ConversationTurn> history) {}
