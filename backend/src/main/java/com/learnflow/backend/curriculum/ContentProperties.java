package com.learnflow.backend.curriculum;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param location Spring resource prefix holding the content YAML tree
 * @param includeDrafts import {@code draft} entries too (local and test only, never prod)
 * @param importOnStartup run {@link ContentImporter} when the app starts
 */
@ConfigurationProperties(prefix = "app.content")
public record ContentProperties(String location, boolean includeDrafts, boolean importOnStartup) {}
