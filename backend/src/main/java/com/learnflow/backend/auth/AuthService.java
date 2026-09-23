package com.learnflow.backend.auth;

import com.learnflow.backend.auth.domain.User;
import com.learnflow.backend.auth.dto.AuthResponse;
import com.learnflow.backend.auth.dto.LoginRequest;
import com.learnflow.backend.auth.dto.RegisterRequest;
import com.learnflow.backend.auth.dto.UserResponse;
import com.learnflow.backend.common.error.ConflictException;
import com.learnflow.backend.common.error.NotFoundException;
import java.time.Clock;
import java.time.Instant;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthProperties authProperties;
    private final Clock clock;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthProperties authProperties,
            Clock clock) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authProperties = authProperties;
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
