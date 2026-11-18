package com.learnflow.backend.curriculum.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import java.util.Locale;

public enum ContentStatus {
    DRAFT,
    REVIEWED;

    /** Content YAML writes enum values in lower case. */
    @JsonCreator
    public static ContentStatus fromYaml(String value) {
        return valueOf(value.toUpperCase(Locale.ROOT));
    }
}
