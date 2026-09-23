package com.learnflow.backend.dailyplan.dto;

import com.learnflow.backend.dailyplan.domain.DailyPlanItem;

public record DailyPlanItemResponse(
        Long id, String languageCode, int minutes, String kind, String description, boolean completed) {

    public static DailyPlanItemResponse from(DailyPlanItem item) {
        return new DailyPlanItemResponse(
                item.getId(),
                item.getLanguage() == null ? null : item.getLanguage().getCode(),
                item.getMinutes(),
                item.getKind().name(),
                item.getDescription(),
                item.isCompleted());
    }
}
