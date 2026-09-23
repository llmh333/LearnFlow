package com.learnflow.backend.progress;

import com.learnflow.backend.progress.dto.ProgressSummaryResponse;
import com.learnflow.backend.progress.dto.RetentionResponse;
import com.learnflow.backend.progress.dto.WeakAreaResponse;
import com.learnflow.backend.study.dto.StudySessionResponse;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {

    private final ProgressService progressService;
    private final Clock clock;

    public ProgressController(ProgressService progressService, Clock clock) {
        this.progressService = progressService;
        this.clock = clock;
    }

    @GetMapping("/summary")
    public ProgressSummaryResponse summary(
            @AuthenticationPrincipal Long userId, @RequestParam(required = false) String language) {
        return progressService.summary(userId, language);
    }

    @GetMapping("/retention")
    public RetentionResponse retention(
            @AuthenticationPrincipal Long userId,
            @RequestParam(required = false) String language,
            @RequestParam(defaultValue = "30") int days) {
        return progressService.retention(userId, language, days);
    }

    @GetMapping("/weak-areas")
    public List<WeakAreaResponse> weakAreas(
            @AuthenticationPrincipal Long userId,
            @RequestParam(required = false) String language,
            @RequestParam(defaultValue = "10") int limit) {
        return progressService.weakAreas(userId, language, limit);
    }

    @GetMapping("/history")
    public List<StudySessionResponse> history(
            @AuthenticationPrincipal Long userId,
            @RequestParam(required = false) String language,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                    Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                    Instant to) {
        Instant effectiveTo = to != null ? to : Instant.now(clock);
        Instant effectiveFrom = from != null ? from : effectiveTo.minus(Duration.ofDays(30));
        return progressService.history(userId, language, effectiveFrom, effectiveTo);
    }
}
