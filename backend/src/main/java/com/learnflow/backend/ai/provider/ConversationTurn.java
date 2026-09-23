package com.learnflow.backend.ai.provider;

/** {@code role} is {@code "user"} or {@code "assistant"} (lowercase, matching Anthropic's wire format). */
public record ConversationTurn(String role, String content) {}
