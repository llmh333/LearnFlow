package com.learnflow.backend.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Password strength and the confirm match are checked in AuthService (BCrypt's 72-byte limit). */
public record RegisterRequest(
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank String password,
        @NotBlank String confirmPassword,
        @NotBlank @Size(max = 100) String displayName,
        /** IANA zone from the browser, e.g. Asia/Ho_Chi_Minh (D7). */
        @NotBlank @Size(max = 64) String timezone) {}
