package com.learnflow.backend.ai.dto.request;

import jakarta.validation.constraints.NotBlank;

public record GrammarExplainApiRequest(@NotBlank String languageCode, @NotBlank String question) {}
