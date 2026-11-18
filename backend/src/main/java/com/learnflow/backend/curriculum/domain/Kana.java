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
@Table(name = "kana")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Kana {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "content_key", nullable = false, unique = true)
    private String contentKey;

    @Column(nullable = false)
    private String character;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private KanaScript script;

    @Column(nullable = false)
    private String romaji;

    @Enumerated(EnumType.STRING)
    @Column(name = "kana_group", nullable = false)
    private KanaGroup kanaGroup;

    @Column(name = "row_label", nullable = false)
    private String rowLabel;

    @Column(nullable = false)
    private Integer position;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContentStatus status;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "source_id")
    private ContentSource source;

    public Kana(String contentKey) {
        this.contentKey = contentKey;
    }
}
