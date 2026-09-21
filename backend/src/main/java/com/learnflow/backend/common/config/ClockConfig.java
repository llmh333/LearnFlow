package com.learnflow.backend.common.config;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Provides the single {@link Clock} bean the whole application must inject instead of calling
 * {@code Instant.now()} directly. Tests override this bean with {@code Clock.fixed(...)} so that
 * time-dependent logic (SRS scheduling above all) stays deterministic.
 */
@Configuration
public class ClockConfig {

    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}
