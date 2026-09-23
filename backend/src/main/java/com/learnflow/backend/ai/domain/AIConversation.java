package com.learnflow.backend.ai.domain;

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
@Table(name = "ai_conversation")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AIConversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "language_id")
    private Language language;

    @Column(nullable = false, length = 30)
    private String mode;

    @Column(length = 100)
    private String scenario;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Setter
    @Column(name = "ended_at")
    private Instant endedAt;

    @Setter
    @Column(columnDefinition = "text")
    private String summary;

    public AIConversation(
            User user, Language language, String mode, String scenario, Instant startedAt) {
        this.user = user;
        this.language = language;
        this.mode = mode;
        this.scenario = scenario;
        this.startedAt = startedAt;
    }
}
