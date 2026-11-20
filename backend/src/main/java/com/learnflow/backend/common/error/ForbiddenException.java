package com.learnflow.backend.common.error;

/** The action is understood but not allowed right now (e.g. registration closed). HTTP 403. */
public class ForbiddenException extends RuntimeException {

    public ForbiddenException(String message) {
        super(message);
    }
}
