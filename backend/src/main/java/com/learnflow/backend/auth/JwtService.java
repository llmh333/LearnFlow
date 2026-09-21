package com.learnflow.backend.auth;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

/** Issues and parses HS256 JWTs. The signing key comes from {@code JWT_SECRET} (never hardcoded). */
@Service
public class JwtService {

    private final AuthProperties authProperties;
    private final Clock clock;
    private final SecretKey signingKey;

    public JwtService(AuthProperties authProperties, Clock clock) {
        this.authProperties = authProperties;
        this.clock = clock;
        this.signingKey =
                Keys.hmacShaKeyFor(authProperties.jwtSecret().getBytes(StandardCharsets.UTF_8));
    }

    public IssuedToken issue(Long userId, String email) {
        Instant now = Instant.now(clock);
        Instant expiresAt = now.plus(authProperties.tokenTtl());

        String token =
                Jwts.builder()
                        .subject(String.valueOf(userId))
                        .claim("email", email)
                        .issuedAt(Date.from(now))
                        .expiration(Date.from(expiresAt))
                        .signWith(signingKey)
                        .compact();

        return new IssuedToken(token, expiresAt);
    }

    /** Returns the subject (user id as string) if the token is valid and not expired, else empty. */
    public Optional<Long> parseUserId(String token) {
        try {
            String subject =
                    Jwts.parser()
                            .verifyWith(signingKey)
                            .build()
                            .parseSignedClaims(token)
                            .getPayload()
                            .getSubject();
            return Optional.of(Long.valueOf(subject));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    public record IssuedToken(String token, Instant expiresAt) {}
}
