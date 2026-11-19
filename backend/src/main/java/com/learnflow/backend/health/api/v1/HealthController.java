package com.learnflow.backend.health.api.v1;

import com.learnflow.backend.common.web.ApiPaths;
import java.time.Clock;
import java.time.Instant;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Public endpoint (see {@code SecurityConfig}) used by the frontend to show backend status. */
@RestController
public class HealthController {

    private final Clock clock;

    public HealthController(Clock clock) {
        this.clock = clock;
    }

    @GetMapping(ApiPaths.V1.Health.BASE)
    public HealthResponse health() {
        return new HealthResponse("UP", Instant.now(clock));
    }

    public record HealthResponse(String status, Instant time) {}
}
