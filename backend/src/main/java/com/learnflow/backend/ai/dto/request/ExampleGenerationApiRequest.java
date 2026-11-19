package com.learnflow.backend.ai.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ExampleGenerationApiRequest(@NotBlank String languageCode, @NotBlank String word) {}
