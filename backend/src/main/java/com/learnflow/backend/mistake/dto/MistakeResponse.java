package com.learnflow.backend.mistake.dto;

import com.learnflow.backend.language.dto.LanguageResponse;
import com.learnflow.backend.mistake.domain.Mistake;
import java.time.Instant;

public record MistakeResponse(
        Long id,
        LanguageResponse language,
        Long vocabularyId,
        String category,
        String topic,
        String original,
        String corrected,
        String explanation,
        int timesRepeated,
        Instant createdAt) {

    public static MistakeResponse from(Mistake mistake) {
        return new MistakeResponse(
                mistake.getId(),
                mistake.getLanguage() == null ? null : LanguageResponse.from(mistake.getLanguage()),
                mistake.getVocabulary() == null ? null : mistake.getVocabulary().getId(),
                mistake.getCategory() == null ? null : mistake.getCategory().getName(),
                mistake.getTopic(),
                mistake.getOriginal(),
                mistake.getCorrected(),
                mistake.getExplanation(),
                mistake.getTimesRepeated(),
                mistake.getCreatedAt());
    }
}
