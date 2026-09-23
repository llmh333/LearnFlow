package com.learnflow.backend.dailyplan.dto;

import com.learnflow.backend.dailyplan.domain.DailyPlan;
import com.learnflow.backend.dailyplan.domain.DailyPlanItem;
import java.time.LocalDate;
import java.util.List;

public record DailyPlanResponse(
        Long id,
        LocalDate planDate,
        int availableMinutes,
        String intro,
        List<DailyPlanItemResponse> items) {

    public static DailyPlanResponse from(DailyPlan plan, List<DailyPlanItem> items) {
        return new DailyPlanResponse(
                plan.getId(),
                plan.getPlanDate(),
                plan.getAvailableMinutes(),
                plan.getIntro(),
                items.stream().map(DailyPlanItemResponse::from).toList());
    }
}
