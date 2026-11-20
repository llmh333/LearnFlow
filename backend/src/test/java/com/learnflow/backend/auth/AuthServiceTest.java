package com.learnflow.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.learnflow.backend.account.AccountService;
import com.learnflow.backend.auth.domain.User;
import com.learnflow.backend.auth.dto.request.ChangePasswordRequest;
import com.learnflow.backend.auth.dto.request.LoginRequest;
import com.learnflow.backend.auth.dto.request.RegisterRequest;
import com.learnflow.backend.common.error.BadRequestException;
import com.learnflow.backend.common.error.ConflictException;
import com.learnflow.backend.common.error.ForbiddenException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    private static final Clock FIXED_CLOCK =
            Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);
    private static final String DUMMY_HASH = "dummy-hash";
    private static final RefreshTokenService.IssuedRefreshToken REFRESH =
            new RefreshTokenService.IssuedRefreshToken(
                    "refresh-token", Instant.parse("2026-01-31T00:00:00Z"));

    @Mock private UserRepository userRepository;
    @Mock private RefreshTokenService refreshTokenService;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AccountService accountService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = service(true);
    }

    private AuthService service(boolean registrationEnabled) {
        when(passwordEncoder.encode("timing-equalizer-not-a-password")).thenReturn(DUMMY_HASH);
        AuthProperties properties =
                new AuthProperties(
                        "unit-test-secret-at-least-32-bytes-long!!",
                        Duration.ofMinutes(15),
                        Duration.ofDays(30),
                        registrationEnabled);
        return new AuthService(
                userRepository,
                refreshTokenService,
                accountService,
                passwordEncoder,
                new JwtService(properties, FIXED_CLOCK),
                properties,
                FIXED_CLOCK);
    }

    private static RegisterRequest register(String email, String password, String confirm) {
        return new RegisterRequest(email, password, confirm, " New User ", "Asia/Ho_Chi_Minh");
    }

    private void stubSave() {
        when(userRepository.saveAndFlush(any(User.class)))
                .thenAnswer(invocation -> {
                    User saved = invocation.getArgument(0);
                    setId(saved, 1L);
                    return saved;
                });
    }

    @Test
    void register_hashesPasswordAndIssuesBothTokens() {
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed-password");
        stubSave();
        when(refreshTokenService.issue(any(User.class))).thenReturn(REFRESH);

        AuthSession session =
                authService.register(register("new@example.com", "password123", "password123"));

        assertThat(session.response().token()).isNotBlank();
        assertThat(session.response().expiresAt())
                .isEqualTo(Instant.now(FIXED_CLOCK).plus(Duration.ofMinutes(15)));
        assertThat(session.response().user().displayName()).isEqualTo("New User");
        assertThat(session.refreshToken()).isEqualTo("refresh-token");
    }

    @Test
    void register_mixedCaseEmail_isStoredLowerCase() {
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed-password");
        stubSave();
        when(refreshTokenService.issue(any(User.class))).thenReturn(REFRESH);

        AuthSession session =
                authService.register(register("  New@Example.COM ", "password123", "password123"));

        assertThat(session.response().user().email()).isEqualTo("new@example.com");
    }

    @Test
    void register_confirmMismatch_isAFieldError() {
        assertFieldError(
                () -> authService.register(register("a@example.com", "password123", "password124")),
                "confirmPassword");
    }

    @Test
    void register_tooShort_isAFieldError() {
        assertFieldError(
                () -> authService.register(register("a@example.com", "abc123", "abc123")),
                "password");
    }

    @Test
    void register_withoutDigit_isAFieldError() {
        assertFieldError(
                () -> authService.register(register("a@example.com", "password", "password")),
                "password");
    }

    @Test
    void register_over72Bytes_isAFieldError() {
        // 25 three-byte characters + 1 digit: 26 characters but 76 bytes, past BCrypt's limit.
        String longPassword = "あ".repeat(25) + "1";

        assertFieldError(
                () -> authService.register(register("a@example.com", longPassword, longPassword)),
                "password");
    }

    @Test
    void register_duplicateEmail_throwsConflict() {
        when(userRepository.existsByEmail("dup@example.com")).thenReturn(true);

        assertThatThrownBy(() ->
                        authService.register(
                                register("dup@example.com", "password123", "password123")))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void register_concurrentDuplicate_isAConflictNotAServerError() {
        when(userRepository.existsByEmail("race@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed-password");
        when(userRepository.saveAndFlush(any(User.class)))
                .thenThrow(new DataIntegrityViolationException("app_user_email_key"));

        assertThatThrownBy(() ->
                        authService.register(
                                register("race@example.com", "password123", "password123")))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void register_whenClosed_throwsForbidden() {
        AuthService closed = service(false);

        assertThatThrownBy(() ->
                        closed.register(register("a@example.com", "password123", "password123")))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void login_wrongPassword_throwsBadCredentials() {
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user()));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("user@example.com", "wrong")))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void login_unknownEmail_stillRunsBcrypt_soTimingDoesNotRevealTheEmail() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                        authService.login(new LoginRequest("missing@example.com", "whatever1")))
                .isInstanceOf(BadCredentialsException.class);
        verify(passwordEncoder).matches("whatever1", DUMMY_HASH);
    }

    @Test
    void changePassword_wrongCurrent_isAFieldError_andRevokesNothing() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user()));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        assertFieldError(
                () ->
                        authService.changePassword(
                                1L,
                                new ChangePasswordRequest("wrong", "newpassword1", "newpassword1")),
                "currentPassword");
        verify(refreshTokenService, never()).revokeAll(any());
    }

    @Test
    void changePassword_sameAsCurrent_isAFieldError() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user()));
        when(passwordEncoder.matches("password123", "hashed")).thenReturn(true);

        assertFieldError(
                () ->
                        authService.changePassword(
                                1L,
                                new ChangePasswordRequest(
                                        "password123", "password123", "password123")),
                "newPassword");
    }

    @Test
    void changePassword_updatesHash_andSignsOutOtherDevices() {
        User user = user();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "hashed")).thenReturn(true);
        when(passwordEncoder.encode("newpassword1")).thenReturn("new-hash");
        when(refreshTokenService.issue(user)).thenReturn(REFRESH);

        AuthSession session =
                authService.changePassword(
                        1L,
                        new ChangePasswordRequest("password123", "newpassword1", "newpassword1"));

        assertThat(user.getPasswordHash()).isEqualTo("new-hash");
        verify(refreshTokenService).revokeAll(1L);
        assertThat(session.refreshToken()).isEqualTo("refresh-token");
    }

    private static void assertFieldError(Runnable call, String field) {
        assertThatThrownBy(call::run)
                .isInstanceOfSatisfying(
                        BadRequestException.class,
                        e -> assertThat(e.getErrors()).containsKey(field));
    }

    private static User user() {
        User user = new User("user@example.com", "hashed", "User", Instant.now(FIXED_CLOCK));
        setId(user, 1L);
        return user;
    }

    private static void setId(User user, Long id) {
        try {
            var field = User.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(user, id);
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException(e);
        }
    }
}
