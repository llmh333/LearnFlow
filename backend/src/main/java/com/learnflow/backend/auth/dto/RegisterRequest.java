package com.learnflow.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotBlank @Size(max = 100) String displayName,
        /** IANA zone from the browser, e.g. Asia/Ho_Chi_Minh (D7). */
        @NotBlank @Size(max = 64) String timezone,
        /** Required unless app.auth.invite-required is false. */
        @Size(max = 32) String inviteCode) {}
