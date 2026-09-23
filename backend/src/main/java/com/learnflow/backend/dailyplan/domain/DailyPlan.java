package com.learnflow.backend.dailyplan.domain;

import com.learnflow.backend.auth.domain.User;
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
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "daily_plan")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DailyPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @Column(name = "plan_date", nullable = false)
    private LocalDate planDate;

    @Setter
    @Column(name = "available_minutes", nullable = false)
    private int availableMinutes;

    /** Friendly intro blurb from {@code AIProvider.generateDailyPlan} — never affects minutes/counts. */
    @Setter
    @Column(columnDefinition = "text")
    private String intro;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public DailyPlan(User user, LocalDate planDate, int availableMinutes, Instant createdAt) {
        this.user = user;
        this.planDate = planDate;
        this.availableMinutes = availableMinutes;
        this.createdAt = createdAt;
    }
}
