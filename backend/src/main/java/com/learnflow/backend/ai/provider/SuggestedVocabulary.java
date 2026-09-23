package com.learnflow.backend.ai.provider;

/** A new word the learner used/encountered — {@code meaningVietnamese} per decision D10. Suggested only, never auto-added (PROJECT.md §4.4). */
public record SuggestedVocabulary(String word, String meaningVietnamese) {}
