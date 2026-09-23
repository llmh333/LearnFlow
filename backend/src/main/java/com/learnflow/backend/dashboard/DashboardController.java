package com.learnflow.backend.dashboard;

import com.learnflow.backend.dashboard.dto.DashboardTodayResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/today")
    public DashboardTodayResponse today(@AuthenticationPrincipal Long userId) {
        return dashboardService.today(userId);
    }
}
