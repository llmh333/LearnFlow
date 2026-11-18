package com.learnflow.backend.curriculum.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "example_sentence")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ExampleSentence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "content_key", nullable = false, unique = true)
    private String contentKey;

    @Column(nullable = false)
    private String text;

    private String reading;

    @Column(name = "translation_vi", nullable = false)
    private String translationVi;

    @Column(name = "translation_en")
    private String translationEn;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContentStatus status;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "source_id")
    private ContentSource source;

    @Column(name = "source_ref")
    private String sourceRef;

    @Column(name = "source_author")
    private String sourceAuthor;

    public ExampleSentence(String contentKey) {
        this.contentKey = contentKey;
    }
}
