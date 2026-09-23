package com.learnflow.backend.mistake.domain;

import com.learnflow.backend.auth.domain.User;
import com.learnflow.backend.language.domain.Language;
import com.learnflow.backend.vocabulary.domain.Vocabulary;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A recurring-error record (PROJECT.md §4.5). Repeated occurrences of the same
 * {@code language + category + topic} combination increment {@code timesRepeated} on the existing
 * row instead of creating duplicates — {@code createdAt} stays the first-seen timestamp.
 */
@Entity
@Table(name = "mistake")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Mistake {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "language_id")
    private Language language;

    /** Nullable — only set when the mistake is tied to a specific vocabulary word. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vocabulary_id")
    private Vocabulary vocabulary;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private MistakeCategory category;

    @Column(length = 100)
    private String topic;

    @Column(nullable = false, columnDefinition = "text")
    private String original;

    @Setter
    @Column(nullable = false, columnDefinition = "text")
    private String corrected;

    @Setter
    @Column(columnDefinition = "text")
    private String explanation;

    @Setter
    @Column(name = "times_repeated", nullable = false)
    private int timesRepeated;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public Mistake(
            User user,
            Language language,
            Vocabulary vocabulary,
            MistakeCategory category,
            String topic,
            String original,
            String corrected,
            String explanation,
            Instant createdAt) {
        this.user = user;
        this.language = language;
        this.vocabulary = vocabulary;
        this.category = category;
        this.topic = topic;
        this.original = original;
        this.corrected = corrected;
        this.explanation = explanation;
        this.timesRepeated = 1;
        this.createdAt = createdAt;
    }
}
