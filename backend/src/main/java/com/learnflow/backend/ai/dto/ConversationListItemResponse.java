package com.learnflow.backend.ai.dto;

import com.learnflow.backend.ai.domain.AIConversation;
import com.learnflow.backend.language.dto.LanguageResponse;
import java.time.Instant;

public record ConversationListItemResponse(
        Long conversationId,
        LanguageResponse language,
        String scenario,
        Instant startedAt,
        Instant endedAt,
        String summary) {

    public static ConversationListItemResponse from(AIConversation conversation) {
        return new ConversationListItemResponse(
                conversation.getId(),
                conversation.getLanguage() == null ? null : LanguageResponse.from(conversation.getLanguage()),
                conversation.getScenario(),
                conversation.getStartedAt(),
                conversation.getEndedAt(),
                conversation.getSummary());
    }
}
