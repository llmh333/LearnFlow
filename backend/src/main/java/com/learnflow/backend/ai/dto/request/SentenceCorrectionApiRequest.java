package com.learnflow.backend.ai.dto.request;

import jakarta.validation.constraints.NotBlank;

public record SentenceCorrectionApiRequest(@NotBlank String languageCode, @NotBlank String text) {}
