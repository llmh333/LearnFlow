package com.learnflow.backend.auth;

import com.learnflow.backend.auth.domain.RefreshToken;
import com.learnflow.backend.auth.domain.User;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

/**
 * Opaque, rotating refresh tokens. Each refresh revokes the presented token and issues a new one in
 * the same family; presenting an already-revoked token means it leaked, so the whole family is
 * revoked. Not transactional itself: always called inside an {@link AuthService} transaction.
 */
@Service
class RefreshTokenService {

    private static final int TOKEN_BYTES = 32;

    private final RefreshTokenRepository refreshTokenRepository;
    private final AuthProperties authProperties;
    private final Clock clock;
    private final SecureRandom secureRandom = new SecureRandom();

    RefreshTokenService(
            RefreshTokenRepository refreshTokenRepository,
            AuthProperties authProperties,
            Clock clock) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.authProperties = authProperties;
        this.clock = clock;
    }

    /** Starts a new family, e.g. on login. */
    IssuedRefreshToken issue(User user) {
        return issue(user, UUID.randomUUID());
    }

    /** Revokes {@code rawToken} and returns its replacement; 401 if it is unknown or unusable. */
    Rotation rotate(String rawToken) {
        Instant now = Instant.now(clock);
        RefreshToken current =
                refreshTokenRepository
                        .findByTokenHash(hash(rawToken))
                        .orElseThrow(RefreshTokenService::invalid);
        if (current.isRevoked()) {
            refreshTokenRepository.revokeFamily(current.getFamilyId(), now);
            throw invalid();
        }
        if (!current.getExpiresAt().isAfter(now)) {
            throw invalid();
        }
        current.revoke(now);
        User user = current.getUser();
        return new Rotation(user, issue(user, current.getFamilyId()));
    }

    /** Logout: revokes the token if it exists; unknown tokens are ignored. */
    void revoke(String rawToken) {
        refreshTokenRepository
                .findByTokenHash(hash(rawToken))
                .ifPresent(token -> token.revoke(Instant.now(clock)));
    }

    void revokeAll(Long userId) {
        refreshTokenRepository.revokeAllForUser(userId, Instant.now(clock));
    }

    private IssuedRefreshToken issue(User user, UUID familyId) {
        Instant now = Instant.now(clock);
        refreshTokenRepository.deleteExpiredForUser(user.getId(), now);

        byte[] bytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Instant expiresAt = now.plus(authProperties.refreshTokenTtl());
        refreshTokenRepository.save(
                new RefreshToken(user, hash(rawToken), familyId, now, expiresAt));
        return new IssuedRefreshToken(rawToken, expiresAt);
    }

    private static String hash(String rawToken) {
        try {
            byte[] digest =
                    MessageDigest.getInstance("SHA-256")
                            .digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is always available", e);
        }
    }

    private static BadCredentialsException invalid() {
        return new BadCredentialsException("Refresh token is invalid or expired");
    }

    record IssuedRefreshToken(String token, Instant expiresAt) {}

    record Rotation(User user, IssuedRefreshToken refreshToken) {}
}
