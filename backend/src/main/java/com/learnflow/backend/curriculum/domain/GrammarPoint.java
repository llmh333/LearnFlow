package com.learnflow.backend.curriculum.domain;

import com.learnflow.backend.language.domain.Language;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "grammar_point")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GrammarPoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "content_key", nullable = false, unique = true)
    private String contentKey;

    @Column(nullable = false)
    private String pattern;

    @Column(name = "meaning_vi")
    private String meaningVi;

    @Column(name = "explanation_vi", nullable = false)
    private String explanationVi;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "language_id")
    private Language language;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "level_id")
    private ProficiencyLevel level;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContentStatus status;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "source_id")
    private ContentSource source;

    @ManyToMany
    @JoinTable(
            name = "grammar_example",
            joinColumns = @JoinColumn(name = "grammar_point_id"),
            inverseJoinColumns = @JoinColumn(name = "sentence_id"))
    @OrderColumn(name = "position")
    private List<ExampleSentence> examples = new ArrayList<>();

    public GrammarPoint(String contentKey) {
        this.contentKey = contentKey;
    }
}
