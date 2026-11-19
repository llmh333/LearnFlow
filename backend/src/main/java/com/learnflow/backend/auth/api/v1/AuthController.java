package com.learnflow.backend.auth.api.v1;

import com.learnflow.backend.auth.AuthService;
import com.learnflow.backend.auth.AuthSession;
import com.learnflow.backend.auth.dto.request.ChangePasswordRequest;
import com.learnflow.backend.auth.dto.request.LoginRequest;
import com.learnflow.backend.auth.dto.request.RegisterRequest;
import com.learnflow.backend.auth.dto.response.AuthResponse;
import com.learnflow.backend.auth.dto.response.UserResponse;
import com.learnflow.backend.common.web.ApiPaths;
import jakarta.validation.Valid;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * The access token (JWT) goes in the JSON body; the refresh token only ever travels in an HttpOnly,
 * Secure, SameSite=Strict cookie scoped to {@code /api/v1/auth}, so page scripts cannot read it.
 */
@RestController
@RequestMapping(ApiPaths.V1.Auth.BASE)
public class AuthController {

    public static final String REFRESH_COOKIE = "refresh_token";

    private final AuthService authService;
    private final Clock clock;

    public AuthController(AuthService authService, Clock clock) {
        this.authService = authService;
        this.clock = clock;
    }

    @PostMapping(ApiPaths.V1.Auth.REGISTER)
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return withRefreshCookie(authService.register(request));
    }

    @PostMapping(ApiPaths.V1.Auth.LOGIN)
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return withRefreshCookie(authService.login(request));
    }

    @PostMapping(ApiPaths.V1.Auth.REFRESH)
    public ResponseEntity<AuthResponse> refresh(
            @CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new BadCredentialsException("Missing refresh token");
        }
        return withRefreshCookie(authService.refresh(refreshToken));
    }

    @PostMapping(ApiPaths.V1.Auth.LOGOUT)
    public ResponseEntity<Void> logout(
            @CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            authService.logout(refreshToken);
        }
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, refreshCookie("", Duration.ZERO).toString())
                .build();
    }

    @PostMapping(ApiPaths.V1.Auth.CHANGE_PASSWORD)
    public ResponseEntity<AuthResponse> changePassword(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody ChangePasswordRequest request) {
        return withRefreshCookie(authService.changePassword(userId, request));
    }

    @GetMapping(ApiPaths.V1.Auth.ME)
    public UserResponse me(@AuthenticationPrincipal Long userId) {
        return authService.me(userId);
    }

    private ResponseEntity<AuthResponse> withRefreshCookie(AuthSession session) {
        Duration maxAge = Duration.between(Instant.now(clock), session.refreshExpiresAt());
        return ResponseEntity.ok()
                .header(
                        HttpHeaders.SET_COOKIE,
                        refreshCookie(session.refreshToken(), maxAge).toString())
                .body(session.response());
    }

    private static ResponseCookie refreshCookie(String value, Duration maxAge) {
        return ResponseCookie.from(REFRESH_COOKIE, value)
                .httpOnly(true)
                .secure(true)
                .sameSite("Strict")
                .path(ApiPaths.V1.Auth.BASE)
                .maxAge(maxAge)
                .build();
    }
}
