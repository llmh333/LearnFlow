package com.learnflow.backend.auth.dto;

import com.learnflow.backend.auth.domain.User;

public record UserResponse(Long id, String email, String displayName) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getDisplayName());
    }
}
