package com.learnflow.backend.auth.dto.response;

import java.time.Instant;

public record AuthResponse(String token, Instant expiresAt, UserResponse user) {}
