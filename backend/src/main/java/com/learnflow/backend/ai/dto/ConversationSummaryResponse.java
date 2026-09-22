package com.learnflow.backend.ai.dto;

import com.learnflow.backend.ai.domain.AIConversation;
import java.time.Instant;

public record ConversationSummaryResponse(Long conversationId, String summary, Instant endedAt) {

    public static ConversationSummaryResponse from(AIConversation conversation) {
        return new ConversationSummaryResponse(
                conversation.getId(), conversation.getSummary(), conversation.getEndedAt());
    }
}
