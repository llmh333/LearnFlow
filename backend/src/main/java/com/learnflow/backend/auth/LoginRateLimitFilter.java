package com.learnflow.backend.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import org.springframework.context.annotation.Profile;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Simple in-memory fixed-window limiter on {@code POST /api/auth/login}, keyed by client IP.
 * Only meant to slow down brute-force guessing against the single account this app serves — not a
 * distributed rate limiter, so it resets on restart and doesn't share state across instances,
 * which is fine since there is exactly one backend container in production. Disabled under the
 * {@code test} profile: integration tests share one Spring context (and thus one instance of this
 * bean) across the whole suite, so its counter would otherwise accumulate across unrelated test
 * classes and start rejecting legitimate test logins.
 */
@Component
@Profile("!test")
public class LoginRateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_ATTEMPTS = 10;
    private static final long WINDOW_MILLIS = 5 * 60 * 1000L;

    private final Clock clock;
    private final ConcurrentHashMap<String, Deque<Long>> attemptsByIp = new ConcurrentHashMap<>();

    public LoginRateLimitFilter(Clock clock) {
        this.clock = clock;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        if (!isLoginRequest(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String ip = request.getRemoteAddr();
        Deque<Long> attempts = attemptsByIp.computeIfAbsent(ip, key -> new ConcurrentLinkedDeque<>());
        long now = Instant.now(clock).toEpochMilli();
        attempts.removeIf(timestamp -> now - timestamp > WINDOW_MILLIS);

        if (attempts.size() >= MAX_ATTEMPTS) {
            response.setStatus(429);
            return;
        }

        attempts.add(now);
        filterChain.doFilter(request, response);
    }

    private boolean isLoginRequest(HttpServletRequest request) {
        return "POST".equalsIgnoreCase(request.getMethod())
                && "/api/auth/login".equals(request.getRequestURI());
    }
}
