package com.learnflow.backend.common.error;

/**
 * Thrown when a request would violate a uniqueness/state constraint (e.g. registering an email
 * that already exists). Translated to HTTP 409 by {@link GlobalExceptionHandler}.
 */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
