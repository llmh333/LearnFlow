package com.learnflow.backend.ai.dto;

/**
 * {@code suggestedCategory}/{@code suggestedTopic} are only populated when the corrected sentence
 * actually differs from the original — no point classifying a "mistake" that wasn't one. The user
 * still has to click "Save to Mistake Book" to actually persist it (PROJECT.md §4.4: "tránh rác").
 */
public record SentenceCorrectionApiResponse(
        String corrected, String explanation, String suggestedCategory, String suggestedTopic) {}
