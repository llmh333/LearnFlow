package com.learnflow.backend.ai.domain;

/** What an AI call was for; every call counts against the same daily quota (D8). */
public enum AiFeature {
    GRAMMAR_EXPLAIN,
    EXAMPLES,
    SENTENCE_CORRECTION,
    CONVERSATION,
    CONVERSATION_SUMMARY
}
