package com.learnflow.backend.study.dto;

/** {@code languageCode} is optional — a session isn't required to be scoped to one language. */
public record StartStudySessionRequest(String languageCode) {}
