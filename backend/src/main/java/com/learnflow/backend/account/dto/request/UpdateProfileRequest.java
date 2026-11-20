package com.learnflow.backend.account.dto.request;

import com.learnflow.backend.account.domain.LearningGoal;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

/** Partial update: a null field is left unchanged. */
public record UpdateProfileRequest(
        @Size(max = 64) String timezone,
        LearningGoal goal,
        Integer dailyMinutes,
        @Min(0) @Max(50) Integer dailyNewItems) {}
