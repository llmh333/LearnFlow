package com.learnflow.backend.ai.dto;

import com.learnflow.backend.ai.domain.AIConversation;
import com.learnflow.backend.language.dto.LanguageResponse;
import java.time.Instant;
import java.util.List;

public record ConversationDetailResponse(
        Long conversationId,
        LanguageResponse language,
        String scenario,
        Instant startedAt,
        Instant endedAt,
        String summary,
        List<ConversationMessageItem> messages) {

    public static ConversationDetailResponse from(
            AIConversation conversation, List<ConversationMessageItem> messages) {
        return new ConversationDetailResponse(
                conversation.getId(),
                conversation.getLanguage() == null ? null : LanguageResponse.from(conversation.getLanguage()),
                conversation.getScenario(),
                conversation.getStartedAt(),
                conversation.getEndedAt(),
                conversation.getSummary(),
                messages);
    }
}
