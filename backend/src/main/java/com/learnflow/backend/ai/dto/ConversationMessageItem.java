package com.learnflow.backend.ai.dto;

import com.learnflow.backend.ai.domain.AIMessage;
import java.time.Instant;

public record ConversationMessageItem(String role, String content, Instant createdAt) {

    public static ConversationMessageItem from(AIMessage message) {
        return new ConversationMessageItem(message.getRole(), message.getContent(), message.getCreatedAt());
    }
}
