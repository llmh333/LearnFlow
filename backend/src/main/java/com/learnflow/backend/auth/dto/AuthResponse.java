package com.learnflow.backend.auth.dto;

import java.time.Instant;

public record AuthResponse(String token, Instant expiresAt, UserResponse user) {}
