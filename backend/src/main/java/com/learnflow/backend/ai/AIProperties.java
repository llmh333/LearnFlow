package com.learnflow.backend.ai;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Binds {@code app.ai.*} — see {@code application.yml} / {@code application-local.yml}. */
@ConfigurationProperties(prefix = "app.ai")
public record AIProperties(String provider, String anthropicApiKey, String model, int timeoutSeconds) {

    private static final String DEFAULT_MODEL = "claude-sonnet-5";
    private static final int DEFAULT_TIMEOUT_SECONDS = 60;

    public AIProperties {
        if (model == null || model.isBlank()) {
            model = DEFAULT_MODEL;
        }
        if (timeoutSeconds <= 0) {
            timeoutSeconds = DEFAULT_TIMEOUT_SECONDS;
        }
    }
}
