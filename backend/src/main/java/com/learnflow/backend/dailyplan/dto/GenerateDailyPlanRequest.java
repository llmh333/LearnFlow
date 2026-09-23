package com.learnflow.backend.dailyplan.dto;

import jakarta.validation.constraints.Min;

public record GenerateDailyPlanRequest(@Min(1) int availableMinutes) {}
