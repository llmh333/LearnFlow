package com.learnflow.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.learnflow.backend.auth.domain.User;
import com.learnflow.backend.auth.dto.AuthResponse;
import com.learnflow.backend.auth.dto.LoginRequest;
import com.learnflow.backend.auth.dto.RegisterRequest;
import com.learnflow.backend.common.error.ConflictException;
import com.learnflow.backend.vocabulary.VocabularyService;
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
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    private static final Clock FIXED_CLOCK =
            Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private VocabularyService vocabularyService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        AuthProperties authProperties =
                new AuthProperties(
                        "unit-test-secret-at-least-32-bytes-long!!", Duration.ofHours(12), true);
        JwtService jwtService = new JwtService(authProperties, FIXED_CLOCK);
        authService =
                new AuthService(
                        userRepository, passwordEncoder, jwtService, authProperties, vocabularyService, FIXED_CLOCK);
    }

    @Test
    void register_hashesPasswordAndIssuesToken() {
        RegisterRequest request = new RegisterRequest("new@example.com", "password123", "New User");
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(userRepository.findByEmail("seed@learnflow.system")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("password123")).thenReturn("hashed-password");
        when(userRepository.save(any(User.class)))
                .thenAnswer(
                        invocation -> {
                            User saved = invocation.getArgument(0);
                            setId(saved, 1L);
                            return saved;
                        });

        AuthResponse response = authService.register(request);

        assertThat(response.token()).isNotBlank();
        assertThat(response.user().email()).isEqualTo("new@example.com");
        assertThat(response.user().displayName()).isEqualTo("New User");
    }

    @Test
    void register_templateAccountExists_seedsStarterVocabularyForNewUser() {
        RegisterRequest request = new RegisterRequest("new@example.com", "password123", "New User");
        User templateUser = new User("seed@learnflow.system", "hashed", "Seed", Instant.now(FIXED_CLOCK));
        setId(templateUser, 999L);
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(userRepository.findByEmail("seed@learnflow.system")).thenReturn(Optional.of(templateUser));
        when(passwordEncoder.encode("password123")).thenReturn("hashed-password");
        when(userRepository.save(any(User.class)))
                .thenAnswer(
                        invocation -> {
                            User saved = invocation.getArgument(0);
                            setId(saved, 1L);
                            return saved;
                        });

        authService.register(request);

        org.mockito.Mockito.verify(vocabularyService).seedStarterVocabularyFor(1L, 999L);
    }

    @Test
    void register_duplicateEmail_throwsConflict() {
        RegisterRequest request = new RegisterRequest("dup@example.com", "password123", "Dup");
        when(userRepository.existsByEmail("dup@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request)).isInstanceOf(ConflictException.class);
    }

    @Test
    void login_wrongPassword_throwsBadCredentials() {
        User user = new User("user@example.com", "hashed", "User", Instant.now(FIXED_CLOCK));
        setId(user, 1L);
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        LoginRequest request = new LoginRequest("user@example.com", "wrong");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void login_unknownEmail_throwsBadCredentials() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        LoginRequest request = new LoginRequest("missing@example.com", "whatever");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class);
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
