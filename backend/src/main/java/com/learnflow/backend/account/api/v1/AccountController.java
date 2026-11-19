package com.learnflow.backend.account.api.v1;

import com.learnflow.backend.account.AccountService;
import com.learnflow.backend.account.dto.ProfileResponse;
import com.learnflow.backend.account.dto.UpdateProfileRequest;
import com.learnflow.backend.common.web.ApiPaths;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiPaths.V1.Account.BASE)
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping(ApiPaths.V1.Account.PROFILE)
    public ProfileResponse profile(@AuthenticationPrincipal Long userId) {
        return accountService.getProfile(userId);
    }

    @PatchMapping(ApiPaths.V1.Account.PROFILE)
    public ProfileResponse updateProfile(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody UpdateProfileRequest request) {
        return accountService.updateProfile(userId, request);
    }
}
