package com.learnflow.backend.auth;

import com.learnflow.backend.auth.domain.PasswordResetCode;
import com.learnflow.backend.auth.domain.User;
import com.learnflow.backend.auth.dto.request.ForgotPasswordRequest;
import com.learnflow.backend.auth.dto.request.ResetPasswordRequest;
import com.learnflow.backend.auth.dto.request.VerifyResetCodeRequest;
import com.learnflow.backend.common.error.BadRequestException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Forgot password: email a 6-digit code, check it, then set a new password. Every answer is the
 * same whether or not the email has an account, so the endpoints cannot be used to find accounts.
 */
@Service
@Transactional
public class PasswordResetService {

    static final Duration CODE_TTL = Duration.ofMinutes(10);
    static final Duration RESEND_COOLDOWN = Duration.ofSeconds(60);
    static final int MAX_CODES_PER_HOUR = 5;
    static final int MAX_ATTEMPTS = 5;

    static final String INVALID_CODE = "Invalid or expired code";

    private final UserRepository userRepository;
    private final PasswordResetCodeRepository codeRepository;
    private final RefreshTokenService refreshTokenService;
    private final PasswordResetMailer mailer;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;
    private final SecureRandom secureRandom = new SecureRandom();

    public PasswordResetService(
            UserRepository userRepository,
            PasswordResetCodeRepository codeRepository,
            RefreshTokenService refreshTokenService,
            PasswordResetMailer mailer,
            PasswordEncoder passwordEncoder,
            Clock clock) {
        this.userRepository = userRepository;
        this.codeRepository = codeRepository;
        this.refreshTokenService = refreshTokenService;
        this.mailer = mailer;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
    }

    /**
     * Emails a new code. Silently does nothing for unknown emails, within the resend cooldown, or
     * past the hourly cap: an error there would reveal that the account exists.
     */
    public void requestCode(ForgotPasswordRequest request) {
        User user =
                userRepository
                        .findByEmail(AuthService.normalizeEmail(request.email()))
                        .orElse(null);
        if (user == null) {
            return;
        }
        Instant now = Instant.now(clock);
        boolean coolingDown =
                codeRepository
                        .findFirstByUser_IdOrderByCreatedAtDesc(user.getId())
                        .filter(last -> last.getCreatedAt().isAfter(now.minus(RESEND_COOLDOWN)))
                        .isPresent();
        if (coolingDown
                || codeRepository.countByUser_IdAndCreatedAtAfter(
                                user.getId(), now.minus(Duration.ofHours(1)))
                        >= MAX_CODES_PER_HOUR) {
            return;
        }

        codeRepository.deleteOlderThan(user.getId(), now.minus(Duration.ofDays(1)));
        codeRepository.consumeAllForUser(user.getId(), now);
        String code = "%06d".formatted(secureRandom.nextInt(1_000_000));
        codeRepository.save(new PasswordResetCode(user, hash(code), now, now.plus(CODE_TTL)));
        mailer.sendAfterCommit(user.getEmail(), user.getDisplayName(), code, CODE_TTL);
    }

    /** Checks the code without using it up, so the client can move on to the new-password step. */
    @Transactional(noRollbackFor = BadRequestException.class)
    public void verifyCode(VerifyResetCodeRequest request) {
        checkCode(request.email(), request.code());
    }

    /** Sets the new password, uses up the code and signs out every device. */
    @Transactional(noRollbackFor = BadRequestException.class)
    public void resetPassword(ResetPasswordRequest request) {
        // Password rules first, so a weak password does not cost a code attempt.
        AuthService.checkNewPassword(
                "newPassword",
                request.newPassword(),
                "confirmNewPassword",
                request.confirmNewPassword());
        PasswordResetCode code = checkCode(request.email(), request.code());
        User user = code.getUser();
        user.changePasswordHash(passwordEncoder.encode(request.newPassword()));
        code.consume(Instant.now(clock));
        refreshTokenService.revokeAll(user.getId());
    }

    /** The live code if it matches; otherwise counts the attempt and fails with one message. */
    private PasswordResetCode checkCode(String email, String rawCode) {
        Instant now = Instant.now(clock);
        PasswordResetCode code =
                userRepository
                        .findByEmail(AuthService.normalizeEmail(email))
                        .flatMap(user ->
                                codeRepository
                                        .findFirstByUser_IdAndConsumedAtIsNullOrderByCreatedAtDesc(
                                                user.getId()))
                        .filter(c -> c.getExpiresAt().isAfter(now))
                        .filter(c -> c.getAttempts() < MAX_ATTEMPTS)
                        .orElseThrow(PasswordResetService::invalidCode);
        if (!MessageDigest.isEqual(
                code.getCodeHash().getBytes(StandardCharsets.UTF_8),
                hash(rawCode).getBytes(StandardCharsets.UTF_8))) {
            code.recordFailedAttempt();
            throw invalidCode();
        }
        return code;
    }

    // shortcut: plain SHA-256 of a 6-digit code is brute-forceable from a DB dump; the code lives
    // 10 minutes, so that is accepted. Switch to HMAC with a server secret if codes live longer.
    private static String hash(String code) {
        try {
            byte[] digest =
                    MessageDigest.getInstance("SHA-256")
                            .digest(code.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is always available", e);
        }
    }

    private static BadRequestException invalidCode() {
        return new BadRequestException("code", INVALID_CODE);
    }
}
