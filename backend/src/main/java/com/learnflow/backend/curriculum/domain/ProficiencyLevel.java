package com.learnflow.backend.curriculum.domain;

import com.learnflow.backend.language.domain.Language;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** A level of one language's proficiency framework (JLPT N5, HSK 1, CEFR A1...). Reference data. */
@Entity
@Table(name = "proficiency_level")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProficiencyLevel {

    @Id private Short id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "language_id")
    private Language language;

    @Column(nullable = false)
    private String framework;

    /** Upper case, e.g. N5, HSK1, A1. */
    @Column(nullable = false)
    private String code;

    @Column(nullable = false)
    private String name;

    /** 1 = easiest. */
    @Column(nullable = false)
    private short rank;
}
