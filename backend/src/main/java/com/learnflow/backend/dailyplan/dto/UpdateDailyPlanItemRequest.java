package com.learnflow.backend.dailyplan.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateDailyPlanItemRequest(@NotNull Boolean completed) {}
