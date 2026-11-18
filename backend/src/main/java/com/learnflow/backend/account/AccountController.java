package com.learnflow.backend.account;

import com.learnflow.backend.account.dto.ProfileResponse;
import com.learnflow.backend.account.dto.UpdateProfileRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/account")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping("/profile")
    public ProfileResponse profile(@AuthenticationPrincipal Long userId) {
        return accountService.getProfile(userId);
    }

    @PatchMapping("/profile")
    public ProfileResponse updateProfile(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody UpdateProfileRequest request) {
        return accountService.updateProfile(userId, request);
    }
}
