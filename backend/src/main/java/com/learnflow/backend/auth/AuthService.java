package com.learnflow.backend.auth;

import com.learnflow.backend.account.AccountService;
import com.learnflow.backend.auth.domain.User;
import com.learnflow.backend.auth.dto.request.ChangePasswordRequest;
import com.learnflow.backend.auth.dto.request.LoginRequest;
import com.learnflow.backend.auth.dto.request.RegisterRequest;
import com.learnflow.backend.auth.dto.response.AuthResponse;
import com.learnflow.backend.auth.dto.response.UserResponse;
import com.learnflow.backend.common.error.BadRequestException;
import com.learnflow.backend.common.error.ConflictException;
import com.learnflow.backend.common.error.ForbiddenException;
import com.learnflow.backend.common.error.NotFoundException;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.Locale;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {

    static final int MIN_PASSWORD_CHARS = 8;

    /** BCrypt ignores everything after 72 bytes, and Spring's encoder rejects longer input. */
    static final int MAX_PASSWORD_BYTES = 72;

    private static final String INVALID_LOGIN = "Invalid email or password";

    private final UserRepository userRepository;
    private final RefreshTokenService refreshTokenService;
    private final AccountService accountService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthProperties authProperties;
    private final Clock clock;

    /** Compared against when the email is unknown, so login takes as long either way. */
    private final String dummyPasswordHash;

    public AuthService(
            UserRepository userRepository,
            RefreshTokenService refreshTokenService,
            AccountService accountService,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthProperties authProperties,
            Clock clock) {
        this.userRepository = userRepository;
        this.refreshTokenService = refreshTokenService;
        this.accountService = accountService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authProperties = authProperties;
        this.clock = clock;
        this.dummyPasswordHash = passwordEncoder.encode("timing-equalizer-not-a-password");
    }

    public AuthSession register(RegisterRequest request) {
        if (!authProperties.registrationEnabled()) {
            throw new ForbiddenException("Registration is closed");
        }
        checkNewPassword(
                "password", request.password(), "confirmPassword", request.confirmPassword());
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw emailTaken(email);
        }

        User user =
                new User(
                        email,
                        passwordEncoder.encode(request.password()),
                        request.displayName().strip(),
                        Instant.now(clock));
        try {
            // Flush now so a concurrent registration with the same email hits the UNIQUE here.
            userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException e) {
            throw emailTaken(email);
        }
        accountService.createProfile(user.getId(), request.timezone());

        return startSession(user);
    }

    public AuthSession login(LoginRequest request) {
        User user = userRepository.findByEmail(normalizeEmail(request.email())).orElse(null);
        String hash = user != null ? user.getPasswordHash() : dummyPasswordHash;
        boolean matches =
                fitsBcrypt(request.password()) && passwordEncoder.matches(request.password(), hash);
        if (user == null || !matches) {
            throw new BadCredentialsException(INVALID_LOGIN);
        }
        return startSession(user);
    }

    /** Rotates the refresh token. A failed refresh must still commit the family revocation. */
    @Transactional(noRollbackFor = BadCredentialsException.class)
    public AuthSession refresh(String refreshToken) {
        RefreshTokenService.Rotation rotation = refreshTokenService.rotate(refreshToken);
        return session(rotation.user(), rotation.refreshToken());
    }

    public void logout(String refreshToken) {
        refreshTokenService.revoke(refreshToken);
    }

    /** Signs out every device (all refresh tokens) and returns a new session for this one. */
    public AuthSession changePassword(Long userId, ChangePasswordRequest request) {
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new NotFoundException("User not found: " + userId));
        if (!fitsBcrypt(request.currentPassword())
                || !passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            // 400, not 401: the access token is fine, and 401 would sign the client out.
            throw new BadRequestException("currentPassword", "Current password is incorrect");
        }
        checkNewPassword(
                "newPassword",
                request.newPassword(),
                "confirmNewPassword",
                request.confirmNewPassword());
        if (request.newPassword().equals(request.currentPassword())) {
            throw new BadRequestException(
                    "newPassword", "New password must differ from the current one");
        }

        user.changePasswordHash(passwordEncoder.encode(request.newPassword()));
        refreshTokenService.revokeAll(userId);
        return startSession(user);
    }

    @Transactional(readOnly = true)
    public UserResponse me(Long userId) {
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new NotFoundException("User not found: " + userId));
        return UserResponse.from(user);
    }

    private AuthSession startSession(User user) {
        return session(user, refreshTokenService.issue(user));
    }

    private AuthSession session(User user, RefreshTokenService.IssuedRefreshToken refreshToken) {
        JwtService.IssuedToken access = jwtService.issue(user.getId(), user.getEmail());
        return new AuthSession(
                new AuthResponse(access.token(), access.expiresAt(), UserResponse.from(user)),
                refreshToken.token(),
                refreshToken.expiresAt());
    }

    /** 8+ characters, at most 72 bytes, at least one letter and one digit, and confirmed. */
    private static void checkNewPassword(
            String field, String password, String confirmField, String confirmation) {
        if (password.length() < MIN_PASSWORD_CHARS) {
            throw new BadRequestException(
                    field, "Password must be at least " + MIN_PASSWORD_CHARS + " characters");
        }
        if (!fitsBcrypt(password)) {
            throw new BadRequestException(
                    field, "Password must be at most " + MAX_PASSWORD_BYTES + " bytes");
        }
        if (password.chars().noneMatch(Character::isLetter)
                || password.chars().noneMatch(Character::isDigit)) {
            throw new BadRequestException(
                    field, "Password must contain at least one letter and one digit");
        }
        if (!password.equals(confirmation)) {
            throw new BadRequestException(confirmField, "Passwords do not match");
        }
    }

    private static boolean fitsBcrypt(String password) {
        return password.getBytes(StandardCharsets.UTF_8).length <= MAX_PASSWORD_BYTES;
    }

    private static ConflictException emailTaken(String email) {
        return new ConflictException("Email already registered: " + email);
    }

    /** Emails are stored lower-cased (the DB has a CHECK), so Foo@x and foo@x are one account. */
    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
