package com.learnflow.backend.ai.dto;

import jakarta.validation.constraints.NotBlank;

/** {@code scenario} is only used when starting a new conversation; ignored when continuing one. */
public record ConversationMessageRequest(
        @NotBlank String languageCode, String scenario, @NotBlank String message) {}
