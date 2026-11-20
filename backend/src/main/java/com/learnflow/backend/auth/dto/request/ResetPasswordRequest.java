package com.learnflow.backend.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Password strength and the confirm match are checked in the service, as for register. */
public record ResetPasswordRequest(
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Pattern(regexp = "\\d{6}", message = "Code must be 6 digits") String code,
        @NotBlank String newPassword,
        @NotBlank String confirmNewPassword) {}
