package com.learnflow.backend.exercise.domain;

import com.learnflow.backend.auth.domain.User;
import com.learnflow.backend.language.domain.Language;
import com.learnflow.backend.vocabulary.domain.Vocabulary;
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
import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "exercise")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Exercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "language_id", nullable = false, updatable = false)
    private Language language;

    /** The word this exercise is built around — nullable since not every AI-generated exercise
     * necessarily maps to one stored vocabulary row. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vocabulary_id")
    private Vocabulary vocabulary;

    @Column(name = "exercise_date", nullable = false)
    private LocalDate exerciseDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ExerciseType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ExerciseSource source;

    /** Type-specific content, including the answer key — never serialized straight to the client
     * (see {@code ExerciseResponse}, which omits it; the answer key is exposed only after
     * submission, via {@code ExerciseAnswerResponse}). */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> payload;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Setter
    @Column(nullable = false)
    private boolean completed;

    @Setter
    @Column
    private Boolean correct;

    @Setter
    @Column(name = "answered_at")
    private Instant answeredAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public Exercise(
            User user,
            Language language,
            Vocabulary vocabulary,
            LocalDate exerciseDate,
            ExerciseType type,
            ExerciseSource source,
            Map<String, Object> payload,
            int displayOrder,
            Instant createdAt) {
        this.user = user;
        this.language = language;
        this.vocabulary = vocabulary;
        this.exerciseDate = exerciseDate;
        this.type = type;
        this.source = source;
        this.payload = new LinkedHashMap<>(payload);
        this.displayOrder = displayOrder;
        this.completed = false;
        this.createdAt = createdAt;
    }
}
