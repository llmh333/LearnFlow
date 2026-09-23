package com.learnflow.backend.srs.dto;

import com.learnflow.backend.srs.engine.SrsRating;
import jakarta.validation.constraints.NotNull;

public record ReviewSubmitRequest(
        @NotNull SrsRating rating, Integer responseTimeMs, Long studySessionId) {}
