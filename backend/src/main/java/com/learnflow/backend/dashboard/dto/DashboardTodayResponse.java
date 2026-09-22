package com.learnflow.backend.dashboard.dto;

import java.util.List;

public record DashboardTodayResponse(
        List<LanguageTodaySummary> languages, int totalEstimatedMinutes, int streakDays) {}
