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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "word")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Word {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "content_key", nullable = false, unique = true)
    private String contentKey;

    private String written;

    @Column(nullable = false)
    private String reading;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "meanings_vi", nullable = false, columnDefinition = "text[]")
    private List<String> meaningsVi = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "meanings_en", nullable = false, columnDefinition = "text[]")
    private List<String> meaningsEn = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "part_of_speech", nullable = false, columnDefinition = "text[]")
    private List<String> partOfSpeech = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "language_id")
    private Language language;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "level_id")
    private ProficiencyLevel level;

    private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContentStatus status;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "source_id")
    private ContentSource source;

    @Column(name = "source_ref")
    private String sourceRef;

    @ManyToMany
    @JoinTable(
            name = "word_example",
            joinColumns = @JoinColumn(name = "word_id"),
            inverseJoinColumns = @JoinColumn(name = "sentence_id"))
    @OrderColumn(name = "position")
    private List<ExampleSentence> examples = new ArrayList<>();

    public Word(String contentKey) {
        this.contentKey = contentKey;
    }
}
