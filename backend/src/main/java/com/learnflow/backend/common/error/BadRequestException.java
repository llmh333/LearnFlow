package com.learnflow.backend.common.error;

import java.util.Map;

/**
 * Thrown when a request is well-formed but fails a domain-level input rule. Translated to HTTP 400
 * by {@link GlobalExceptionHandler}; with a field it carries the same {@code errors} map as bean
 * validation failures.
 */
public class BadRequestException extends RuntimeException {

    private final Map<String, String> errors;

    public BadRequestException(String message) {
        super(message);
        this.errors = Map.of();
    }

    public BadRequestException(String field, String message) {
        super(message);
        this.errors = Map.of(field, message);
    }

    public Map<String, String> getErrors() {
        return errors;
    }
}
