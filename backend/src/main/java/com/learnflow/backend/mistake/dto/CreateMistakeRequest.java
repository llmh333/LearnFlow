package com.learnflow.backend.mistake.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateMistakeRequest(
        @NotBlank String languageCode,
        Long vocabularyId,
        @NotBlank String category,
        String topic,
        @NotBlank String original,
        @NotBlank String corrected,
        String explanation) {}
