package com.learnflow.backend.auth;

import com.learnflow.backend.auth.domain.User;
import com.learnflow.backend.auth.dto.AuthResponse;
import com.learnflow.backend.auth.dto.LoginRequest;
import com.learnflow.backend.auth.dto.RegisterRequest;
import com.learnflow.backend.auth.dto.UserResponse;
import com.learnflow.backend.common.error.ConflictException;
import com.learnflow.backend.common.error.NotFoundException;
import com.learnflow.backend.vocabulary.VocabularyService;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {

    /**
     * Reserved system account that owns the canonical starter vocabulary pack (see
     * V12__restore_starter_vocabulary_per_user.sql). Never logged into — no UI path creates or
     * authenticates it.
     */
    private static final String STARTER_VOCABULARY_TEMPLATE_EMAIL = "seed@learnflow.system";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthProperties authProperties;
    private final VocabularyService vocabularyService;
    private final Clock clock;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthProperties authProperties,
            VocabularyService vocabularyService,
            Clock clock) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authProperties = authProperties;
        this.vocabularyService = vocabularyService;
        this.clock = clock;
    }

    public AuthResponse register(RegisterRequest request) {
        if (!authProperties.registrationEnabled()) {
            throw new IllegalStateException("Registration is disabled");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("Email already registered: " + request.email());
        }

        User user =
                new User(
                        request.email(),
                        passwordEncoder.encode(request.password()),
                        request.displayName(),
                        Instant.now(clock));
        userRepository.save(user);

        userRepository
                .findByEmail(STARTER_VOCABULARY_TEMPLATE_EMAIL)
                .ifPresent(
                        templateUser ->
                                vocabularyService.seedStarterVocabularyFor(user.getId(), templateUser.getId()));

        return issueAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user =
                userRepository
                        .findByEmail(request.email())
                        .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        return issueAuthResponse(user);
    }

    /** Real, loggable-into accounts only — excludes the starter-vocabulary template account. Used
     * by {@code exercise.scheduler.ExerciseGenerationScheduler} to know which users to top up AI
     * exercises for, without that module depending on {@code UserRepository} directly. */
    @Transactional(readOnly = true)
    public List<Long> listActiveUserIds() {
        return userRepository.findAllByEmailNot(STARTER_VOCABULARY_TEMPLATE_EMAIL).stream()
                .map(User::getId)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserResponse me(Long userId) {
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new NotFoundException("User not found: " + userId));
        return UserResponse.from(user);
    }

    private AuthResponse issueAuthResponse(User user) {
        JwtService.IssuedToken issued = jwtService.issue(user.getId(), user.getEmail());
        return new AuthResponse(issued.token(), issued.expiresAt(), UserResponse.from(user));
    }
}
