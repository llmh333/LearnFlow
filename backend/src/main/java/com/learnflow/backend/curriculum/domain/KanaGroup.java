package com.learnflow.backend.curriculum.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import java.util.Locale;

public enum KanaGroup {
    BASIC,
    DAKUTEN,
    HANDAKUTEN,
    YOON;

    /** Content YAML writes enum values in lower case. */
    @JsonCreator
    public static KanaGroup fromYaml(String value) {
        return valueOf(value.toUpperCase(Locale.ROOT));
    }
}
