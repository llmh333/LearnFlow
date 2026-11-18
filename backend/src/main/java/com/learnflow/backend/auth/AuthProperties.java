package com.learnflow.backend.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Binds {@code app.auth.*} — the JWT secret comes from the {@code JWT_SECRET} env var via {@code
 * application-local.yml}, never hardcoded or stored in the database.
 */
@ConfigurationProperties(prefix = "app.auth")
@Validated
public record AuthProperties(
        // HS256 needs at least 256 bits; startup fails instead of signing with a weak or empty key.
        @NotBlank @Size(min = 32) String jwtSecret,
        Duration tokenTtl,
        boolean registrationEnabled,
        boolean inviteRequired) {}
