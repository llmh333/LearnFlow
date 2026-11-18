package com.learnflow.backend.ai.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Mapped for schema validation and reads; writes go through the upsert in AiUsageRepository. */
@Entity
@Table(name = "ai_usage")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AiUsage {

    @EmbeddedId private Key id;

    @Column(name = "call_count", nullable = false)
    private Integer callCount;

    @Embeddable
    public record Key(
            @Column(name = "user_id") Long userId,
            @Column(name = "local_date") LocalDate localDate,
            @Enumerated(EnumType.STRING) @Column(name = "feature") AiFeature feature)
            implements Serializable {}
}
