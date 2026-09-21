package com.learnflow.backend.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Placeholder security config for Phase 0: no auth exists yet, so every request is permitted and
 * CSRF is disabled (the API is stateless JSON, not form-based). Phase 1 replaces this with real
 * JWT authentication, restricting access to {@code /api/auth/**} and {@code /api/health} only.
 */
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }
}
