package com.learnflow.backend.account.dto;

import com.learnflow.backend.account.domain.LearningGoal;
import com.learnflow.backend.account.domain.UserProfile;
import java.time.Instant;

public record ProfileResponse(
        String timezone,
        LearningGoal goal,
        int dailyMinutes,
        int dailyNewItems,
        Instant onboardedAt) {

    public static ProfileResponse from(UserProfile p) {
        return new ProfileResponse(
                p.getTimezone(),
                p.getGoal(),
                p.getDailyMinutes(),
                p.getDailyNewItems(),
                p.getOnboardedAt());
    }
}
