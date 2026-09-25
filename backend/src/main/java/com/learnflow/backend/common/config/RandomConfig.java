package com.learnflow.backend.common.config;

import java.util.Random;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Provides the single {@link Random} bean for anything that needs non-deterministic choices (e.g.
 * exercise generation). Tests override this bean with a seeded {@code new Random(fixedSeed)} so
 * that random-dependent logic stays deterministic and assertable — same rationale as
 * {@link ClockConfig}.
 */
@Configuration
public class RandomConfig {

    @Bean
    public Random random() {
        return new Random();
    }
}
