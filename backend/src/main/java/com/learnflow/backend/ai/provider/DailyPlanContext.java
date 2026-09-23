package com.learnflow.backend.ai.provider;

import java.util.List;

/**
 * Purely descriptive of numbers {@code dailyplan.PlanningEngine} already computed — the AI only
 * writes a motivating intro from this, it never sees raw learner data and never changes a number
 * (PROJECT.md §4.7: "AI có thể hỗ trợ xây dựng kế hoạch... nhưng dữ liệu có tính xác định phải được
 * tính bởi ứng dụng").
 */
public record DailyPlanContext(int totalMinutes, List<String> languageSummaries) {}
