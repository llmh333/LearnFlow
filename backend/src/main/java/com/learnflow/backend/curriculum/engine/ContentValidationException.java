package com.learnflow.backend.curriculum.engine;

import java.util.List;

public class ContentValidationException extends RuntimeException {

    private final List<String> errors;

    public ContentValidationException(List<String> errors) {
        super("Invalid learning content:\n  - " + String.join("\n  - ", errors));
        this.errors = List.copyOf(errors);
    }

    public List<String> getErrors() {
        return errors;
    }
}
