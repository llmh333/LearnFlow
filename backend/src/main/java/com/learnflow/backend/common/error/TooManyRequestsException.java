package com.learnflow.backend.common.error;

/** A per-user limit was reached (e.g. the daily AI quota). HTTP 429. */
public class TooManyRequestsException extends RuntimeException {

    public TooManyRequestsException(String message) {
        super(message);
    }
}
