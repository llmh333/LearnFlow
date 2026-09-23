package com.learnflow.backend.dailyplan.engine;

import java.util.List;

public record DailyPlanDraft(int totalMinutes, List<LanguagePlan> languages) {}
