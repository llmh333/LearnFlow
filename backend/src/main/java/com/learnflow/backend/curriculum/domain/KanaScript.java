package com.learnflow.backend.curriculum.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import java.util.Locale;

public enum KanaScript {
    HIRAGANA,
    KATAKANA;

    /** Content YAML writes enum values in lower case. */
    @JsonCreator
    public static KanaScript fromYaml(String value) {
        return valueOf(value.toUpperCase(Locale.ROOT));
    }
}
