package com.learnflow.backend.ai.dto;

import com.learnflow.backend.ai.domain.AIConversation;
import com.learnflow.backend.mistake.dto.MistakeResponse;
import java.time.Instant;
import java.util.List;

public record ConversationSummaryResponse(
        Long conversationId,
        String overview,
        List<MistakeResponse> pushedMistakes,
        List<SuggestedVocabularyResponse> suggestedVocabulary,
        List<String> betterExpressions,
        List<String> grammarProblems,
        Instant endedAt) {

    /** Calling end() again on an already-ended conversation just returns the stored text — the
     * structured breakdown (mistakes/vocab/expressions) was only available at the first call. */
    public static ConversationSummaryResponse alreadyEnded(AIConversation conversation) {
        return new ConversationSummaryResponse(
                conversation.getId(),
                conversation.getSummary(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                conversation.getEndedAt());
    }
}
