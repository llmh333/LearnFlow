package com.learnflow.backend.auth;

import com.learnflow.backend.account.AccountService;
import com.learnflow.backend.auth.domain.InviteCode;
import com.learnflow.backend.auth.domain.User;
import com.learnflow.backend.auth.dto.AuthResponse;
import com.learnflow.backend.auth.dto.LoginRequest;
import com.learnflow.backend.auth.dto.RegisterRequest;
import com.learnflow.backend.auth.dto.UserResponse;
import com.learnflow.backend.common.error.BadRequestException;
import com.learnflow.backend.common.error.ConflictException;
import com.learnflow.backend.common.error.ForbiddenException;
import com.learnflow.backend.common.error.NotFoundException;
import java.time.Clock;
import java.time.Instant;
import java.util.Locale;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final InviteCodeRepository inviteCodeRepository;
    private final AccountService accountService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthProperties authProperties;
    private final Clock clock;

    public AuthService(
            UserRepository userRepository,
            InviteCodeRepository inviteCodeRepository,
            AccountService accountService,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthProperties authProperties,
            Clock clock) {
        this.userRepository = userRepository;
        this.inviteCodeRepository = inviteCodeRepository;
        this.accountService = accountService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authProperties = authProperties;
        this.clock = clock;
    }

    public AuthResponse register(RegisterRequest request) {
        if (!authProperties.registrationEnabled()) {
            throw new ForbiddenException("Registration is closed");
        }
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email already registered: " + email);
        }

        User user =
                new User(
                        email,
                        passwordEncoder.encode(request.password()),
                        request.displayName(),
                        Instant.now(clock),
                        resolveInvite(request.inviteCode()));
        userRepository.save(user);
        accountService.createProfile(user.getId(), request.timezone());

        return issueAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user =
                userRepository
                        .findByEmail(normalizeEmail(request.email()))
                        .orElseThrow(
                                () -> new BadCredentialsException("Invalid email or password"));

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

    /**
     * Returns the invite the new user registers with, or null when none is given and none is
     * required. Locks the code's row, so the use count cannot be raced past {@code max_uses}.
     */
    private InviteCode resolveInvite(String rawCode) {
        if (rawCode == null || rawCode.isBlank()) {
            if (authProperties.inviteRequired()) {
                throw new BadRequestException("inviteCode", "An invite code is required");
            }
            return null;
        }
        InviteCode invite =
                inviteCodeRepository
                        .findByCode(rawCode.trim().toUpperCase(Locale.ROOT))
                        .orElseThrow(
                                () -> new BadRequestException("inviteCode", "Unknown invite code"));
        if (invite.getExpiresAt() != null && !invite.getExpiresAt().isAfter(Instant.now(clock))) {
            throw new BadRequestException("inviteCode", "This invite code has expired");
        }
        if (userRepository.countByInviteCode_Id(invite.getId()) >= invite.getMaxUses()) {
            throw new BadRequestException("inviteCode", "This invite code has been used up");
        }
        return invite;
    }

    /** Emails are stored lower-cased (the DB has a CHECK), so Foo@x and foo@x are one account. */
    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
