package com.learnflow.backend.vocabulary.dto;

import com.learnflow.backend.language.dto.LanguageResponse;
import com.learnflow.backend.vocabulary.domain.Vocabulary;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public record VocabularyResponse(
        Long id,
        LanguageResponse language,
        String word,
        String meaning,
        String example,
        Short difficulty,
        List<String> tags,
        Map<String, Object> attributes,
        Instant createdAt,
        Instant updatedAt) {

    public static VocabularyResponse from(Vocabulary vocabulary) {
        return new VocabularyResponse(
                vocabulary.getId(),
                LanguageResponse.from(vocabulary.getLanguage()),
                vocabulary.getWord(),
                vocabulary.getMeaning(),
                vocabulary.getExample(),
                vocabulary.getDifficulty(),
                vocabulary.getTags().stream().map(t -> t.getName()).sorted().toList(),
                vocabulary.getAttributes(),
                vocabulary.getCreatedAt(),
                vocabulary.getUpdatedAt());
    }
}
