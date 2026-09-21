package com.learnflow.backend.auth;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Binds {@code app.auth.*} — the JWT secret comes from the {@code JWT_SECRET} env var via
 * {@code application-local.yml}, never hardcoded or stored in the database.
 */
@ConfigurationProperties(prefix = "app.auth")
public record AuthProperties(String jwtSecret, Duration tokenTtl, boolean registrationEnabled) {}
