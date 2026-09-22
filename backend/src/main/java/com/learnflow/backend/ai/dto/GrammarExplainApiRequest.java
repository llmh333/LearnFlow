package com.learnflow.backend.ai.dto;

import jakarta.validation.constraints.NotBlank;

public record GrammarExplainApiRequest(@NotBlank String languageCode, @NotBlank String question) {}
