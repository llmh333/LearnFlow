package com.learnflow.backend.language.dto;

import com.learnflow.backend.language.domain.Language;

public record LanguageResponse(Short id, String code, String name) {

    public static LanguageResponse from(Language language) {
        return new LanguageResponse(language.getId(), language.getCode(), language.getName());
    }
}
