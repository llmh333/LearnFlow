package com.learnflow.backend.mistake.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Seeded fixed list (V7): Vocabulary, Grammar, Word order, Pronunciation, Usage, Spelling, Tone, Other. */
@Entity
@Table(name = "mistake_category")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MistakeCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private String name;
}
