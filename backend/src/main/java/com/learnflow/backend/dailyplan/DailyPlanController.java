package com.learnflow.backend.dailyplan;

import com.learnflow.backend.dailyplan.dto.DailyPlanItemResponse;
import com.learnflow.backend.dailyplan.dto.DailyPlanResponse;
import com.learnflow.backend.dailyplan.dto.GenerateDailyPlanRequest;
import com.learnflow.backend.dailyplan.dto.UpdateDailyPlanItemRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/daily-plan")
public class DailyPlanController {

    private final DailyPlanService dailyPlanService;

    public DailyPlanController(DailyPlanService dailyPlanService) {
        this.dailyPlanService = dailyPlanService;
    }

    @PostMapping("/generate")
    public DailyPlanResponse generate(
            @AuthenticationPrincipal Long userId, @Valid @RequestBody GenerateDailyPlanRequest request) {
        return dailyPlanService.generate(userId, request.availableMinutes());
    }

    @GetMapping("/today")
    public DailyPlanResponse today(@AuthenticationPrincipal Long userId) {
        return dailyPlanService.today(userId);
    }

    @PatchMapping("/item/{id}")
    public DailyPlanItemResponse updateItem(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @Valid @RequestBody UpdateDailyPlanItemRequest request) {
        return dailyPlanService.setCompleted(userId, id, request.completed());
    }
}
