package com.learnflow.backend.auth;

import com.learnflow.backend.auth.dto.response.AuthResponse;
import java.time.Instant;

/**
 * What a successful login/register/refresh produces: the JSON body (access token + user) and the
 * refresh token, which the controller puts in an HttpOnly cookie instead of the body.
 */
public record AuthSession(AuthResponse response, String refreshToken, Instant refreshExpiresAt) {}
