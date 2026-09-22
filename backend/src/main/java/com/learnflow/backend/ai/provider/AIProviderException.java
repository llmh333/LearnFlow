package com.learnflow.backend.ai.provider;

/**
 * Thrown when the AI backend call fails (bad key, timeout, malformed response) after the retry.
 * Translated to HTTP 502 by {@link com.learnflow.backend.common.error.GlobalExceptionHandler} so a
 * flaky/misconfigured AI provider degrades gracefully instead of crashing the request.
 */
public class AIProviderException extends RuntimeException {

    public AIProviderException(String message, Throwable cause) {
        super(message, cause);
    }

    public AIProviderException(String message) {
        super(message);
    }
}
