package com.learnflow.backend.vocabulary.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Map;

public record VocabularyRequest(
        @NotBlank String languageCode,
        @NotBlank String word,
        @NotBlank String meaning,
        String example,
        @Min(0) @Max(5) Short difficulty,
        List<String> tags,
        Map<String, Object> attributes) {

    public VocabularyRequest {
        if (difficulty == null) {
            difficulty = 0;
        }
        if (tags == null) {
            tags = List.of();
        }
        if (attributes == null) {
            attributes = Map.of();
        }
    }
}
