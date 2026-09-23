package com.learnflow.backend.study.domain;

import com.learnflow.backend.auth.domain.User;
import com.learnflow.backend.language.domain.Language;
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

@Entity
@Table(name = "study_session")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StudySession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "language_id")
    private Language language;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Setter
    @Column(name = "ended_at")
    private Instant endedAt;

    @Setter
    @Column(name = "words_reviewed", nullable = false)
    private int wordsReviewed;

    @Setter
    @Column(name = "words_learned", nullable = false)
    private int wordsLearned;

    @Setter
    @Column(name = "mistakes_count", nullable = false)
    private int mistakesCount;

    public StudySession(User user, Language language, Instant startedAt) {
        this.user = user;
        this.language = language;
        this.startedAt = startedAt;
        this.wordsReviewed = 0;
        this.wordsLearned = 0;
        this.mistakesCount = 0;
    }
}
