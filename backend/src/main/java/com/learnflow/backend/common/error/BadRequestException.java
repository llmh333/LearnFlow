package com.learnflow.backend.common.error;

/**
 * Thrown when a request is well-formed JSON but fails a domain-level input rule (e.g. an unknown
 * key in a language-specific {@code attributes} map). Translated to HTTP 400 by
 * {@link GlobalExceptionHandler}.
 */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}
