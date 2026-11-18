package com.learnflow.backend.curriculum.dto;

import com.learnflow.backend.curriculum.domain.ContentSource;

public record SourceResponse(
        String key,
        String name,
        String url,
        String license,
        String licenseUrl,
        String attribution) {

    public static SourceResponse from(ContentSource s) {
        return new SourceResponse(
                s.getContentKey(),
                s.getName(),
                s.getUrl(),
                s.getLicense(),
                s.getLicenseUrl(),
                s.getAttribution());
    }
}
