package com.learnflow.backend.common.error;

/**
 * Thrown when a requested resource does not exist. Translated to HTTP 404 by
 * {@link GlobalExceptionHandler}.
 */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
