package com.learnflow.backend.ai.provider;

/** One notable mistake surfaced from an end-of-conversation summary, ready to push to the Mistake Book. */
public record ConversationMistake(
        String category, String topic, String original, String corrected, String explanation) {}
