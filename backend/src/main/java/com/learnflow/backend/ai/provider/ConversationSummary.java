package com.learnflow.backend.ai.provider;

import java.util.List;

/** Structured end-of-conversation summary (PROJECT.md §4.4: Mistakes / New vocabulary / Better expressions / Grammar problems). */
public record ConversationSummary(
        String overview,
        List<ConversationMistake> mistakes,
        List<SuggestedVocabulary> newVocabulary,
        List<String> betterExpressions,
        List<String> grammarProblems) {}
