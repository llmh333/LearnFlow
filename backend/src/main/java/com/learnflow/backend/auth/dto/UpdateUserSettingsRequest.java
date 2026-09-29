package com.learnflow.backend.auth.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateUserSettingsRequest(@NotNull Integer dailyNewWordsLimit) {}
