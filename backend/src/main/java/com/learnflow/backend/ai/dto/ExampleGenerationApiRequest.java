package com.learnflow.backend.ai.dto;

import jakarta.validation.constraints.NotBlank;

public record ExampleGenerationApiRequest(@NotBlank String languageCode, @NotBlank String word) {}
