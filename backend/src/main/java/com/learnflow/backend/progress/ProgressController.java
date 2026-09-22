package com.learnflow.backend.progress;

import com.learnflow.backend.progress.dto.ProgressSummaryResponse;
import com.learnflow.backend.progress.dto.RetentionResponse;
import com.learnflow.backend.progress.dto.WeakAreaResponse;
import com.learnflow.backend.study.dto.StudySessionResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {

    private final ProgressService progressService;

    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    @GetMapping("/summary")
    public ProgressSummaryResponse summary(@RequestParam(required = false) String language) {
        return progressService.summary(language);
    }

    @GetMapping("/retention")
    public RetentionResponse retention(
            @RequestParam(required = false) String language,
            @RequestParam(defaultValue = "30") int days) {
        return progressService.retention(language, days);
    }

    @GetMapping("/weak-areas")
    public List<WeakAreaResponse> weakAreas(
            @RequestParam(required = false) String language,
            @RequestParam(defaultValue = "10") int limit) {
        return progressService.weakAreas(language, limit);
    }

    @GetMapping("/history")
    public List<StudySessionResponse> history(
            @RequestParam(required = false) String language,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                    Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                    Instant to) {
        Instant effectiveTo = to != null ? to : Instant.now();
        Instant effectiveFrom = from != null ? from : effectiveTo.minus(Duration.ofDays(30));
        return progressService.history(language, effectiveFrom, effectiveTo);
    }
}
