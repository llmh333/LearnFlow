package com.learnflow.backend.ai;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Binds {@code app.ai.*} — see {@code application.yml} / {@code application-local.yml}. {@code
 * model} has no default here since it's provider-specific (each {@code AIProvider} implementation
 * applies its own default when left blank) — only one provider is ever active at a time, selected
 * by {@code provider} via {@code @ConditionalOnProperty}.
 */
@ConfigurationProperties(prefix = "app.ai")
public record AIProperties(
        String provider, String anthropicApiKey, String geminiApiKey, String model, int timeoutSeconds) {

    private static final int DEFAULT_TIMEOUT_SECONDS = 60;

    public AIProperties {
        if (timeoutSeconds <= 0) {
            timeoutSeconds = DEFAULT_TIMEOUT_SECONDS;
        }
    }
}
