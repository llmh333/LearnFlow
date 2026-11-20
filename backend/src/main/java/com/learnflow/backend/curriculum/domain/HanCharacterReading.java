package com.learnflow.backend.curriculum.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AccessLevel;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** One reading of a han character; its position is the list index. */
@Embeddable
@Getter
@EqualsAndHashCode
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class HanCharacterReading {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReadingKind kind;

    @Column(nullable = false)
    private String value;

    public HanCharacterReading(ReadingKind kind, String value) {
        this.kind = kind;
        this.value = value;
    }
}
