package com.learnflow.backend.curriculum.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import java.util.Locale;

/** How a han character is read: ON/KUN in Japanese, PINYIN in Chinese. */
public enum ReadingKind {
    ON,
    KUN,
    PINYIN;

    /** Content YAML writes enum values in lower case. */
    @JsonCreator
    public static ReadingKind fromYaml(String value) {
        return valueOf(value.toUpperCase(Locale.ROOT));
    }
}
