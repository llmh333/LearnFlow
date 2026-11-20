package com.learnflow.backend.curriculum.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import java.util.Locale;

public enum JlptLevel {
    N5,
    N4,
    N3,
    N2,
    N1;

    /** Content YAML writes enum values in lower case. */
    @JsonCreator
    public static JlptLevel fromYaml(String value) {
        return valueOf(value.toUpperCase(Locale.ROOT));
    }
}
