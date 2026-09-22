package com.learnflow.backend.ai;

import com.learnflow.backend.ai.provider.AIProviderException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Kept local to {@code ai} instead of the shared {@code common.error.GlobalExceptionHandler}, so
 * that shared module doesn't have to depend on {@code ai} (would invert the dependency direction
 * every other module already has on {@code common}).
 */
@RestControllerAdvice
public class AiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(AiExceptionHandler.class);

    @ExceptionHandler(AIProviderException.class)
    public ProblemDetail handleAIProviderError(AIProviderException ex) {
        log.warn("AI provider call failed: {}", ex.getMessage());
        return ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_GATEWAY, "AI service is temporarily unavailable. Please try again.");
    }
}
