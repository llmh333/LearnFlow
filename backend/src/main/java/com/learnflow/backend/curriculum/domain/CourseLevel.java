package com.learnflow.backend.curriculum.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import java.util.Locale;

public enum CourseLevel {
    KANA,
    N5,
    N4,
    N3;

    /** Content YAML writes enum values in lower case. */
    @JsonCreator
    public static CourseLevel fromYaml(String value) {
        return valueOf(value.toUpperCase(Locale.ROOT));
    }
}
