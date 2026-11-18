package com.learnflow.backend.account.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** 1–1 with {@code app_user}; keyed by the user id, so no join is needed to find it. */
@Entity
@Table(name = "user_profile")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserProfile {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false)
    private String timezone;

    @Enumerated(EnumType.STRING)
    private LearningGoal goal;

    @Column(name = "daily_minutes", nullable = false)
    private Short dailyMinutes;

    @Column(name = "daily_new_items", nullable = false)
    private Short dailyNewItems;

    @Column(name = "onboarded_at")
    private Instant onboardedAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public UserProfile(
            Long userId, String timezone, short dailyMinutes, short dailyNewItems, Instant now) {
        this.userId = userId;
        this.timezone = timezone;
        this.dailyMinutes = dailyMinutes;
        this.dailyNewItems = dailyNewItems;
        this.updatedAt = now;
    }
}
