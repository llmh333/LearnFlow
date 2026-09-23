package com.learnflow.backend.vocabulary.domain;

import com.learnflow.backend.language.domain.Language;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "vocabulary")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Vocabulary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Setter
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "language_id", nullable = false)
    private Language language;

    @Setter
    @Column(nullable = false)
    private String word;

    @Setter
    @Column(nullable = false)
    private String meaning;

    @Setter
    @Column private String example;

    @Setter
    @Column(nullable = false)
    private Short difficulty;

    @Setter
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> attributes = new LinkedHashMap<>();

    @ManyToMany
    @JoinTable(
            name = "vocabulary_tag_link",
            joinColumns = @JoinColumn(name = "vocabulary_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id"))
    private Set<VocabularyTag> tags = new LinkedHashSet<>();

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Setter
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Vocabulary(
            Language language,
            String word,
            String meaning,
            String example,
            Short difficulty,
            Map<String, Object> attributes,
            Instant createdAt,
            Instant updatedAt) {
        this.language = language;
        this.word = word;
        this.meaning = meaning;
        this.example = example;
        this.difficulty = difficulty;
        this.attributes = new LinkedHashMap<>(attributes);
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public void replaceTags(Set<VocabularyTag> newTags) {
        this.tags.clear();
        this.tags.addAll(newTags);
    }
}
