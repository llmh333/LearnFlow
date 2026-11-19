package com.learnflow.backend.ai;

import com.learnflow.backend.ai.context.AIContextBuilder;
import com.learnflow.backend.ai.context.LearnerContext;
import com.learnflow.backend.ai.domain.AIConversation;
import com.learnflow.backend.ai.domain.AIMessage;
import com.learnflow.backend.ai.domain.AiFeature;
import com.learnflow.backend.ai.dto.ConversationDetailResponse;
import com.learnflow.backend.ai.dto.ConversationListItemResponse;
import com.learnflow.backend.ai.dto.ConversationMessageItem;
import com.learnflow.backend.ai.dto.ConversationMessageResponse;
import com.learnflow.backend.ai.dto.ConversationSummaryResponse;
import com.learnflow.backend.ai.dto.ScenarioResponse;
import com.learnflow.backend.ai.dto.SentenceCorrectionApiResponse;
import com.learnflow.backend.ai.dto.SuggestedVocabularyResponse;
import com.learnflow.backend.ai.provider.AIProvider;
import com.learnflow.backend.ai.provider.ConversationRequest;
import com.learnflow.backend.ai.provider.ConversationSummary;
import com.learnflow.backend.ai.provider.ConversationSummaryRequest;
import com.learnflow.backend.ai.provider.ConversationTurn;
import com.learnflow.backend.ai.provider.ExampleGenerationRequest;
import com.learnflow.backend.ai.provider.GrammarExplainRequest;
import com.learnflow.backend.ai.provider.MistakeAnalysis;
import com.learnflow.backend.ai.provider.MistakeAnalysisRequest;
import com.learnflow.backend.ai.provider.SentenceCorrection;
import com.learnflow.backend.ai.provider.SentenceCorrectionRequest;
import com.learnflow.backend.auth.domain.User;
import com.learnflow.backend.common.error.NotFoundException;
import com.learnflow.backend.language.LanguageService;
import com.learnflow.backend.language.domain.Language;
import jakarta.persistence.EntityManager;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.function.Consumer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Orchestrates AI Tutor requests: builds a bounded {@link LearnerContext}, calls {@link
 * AIProvider}, and persists conversation turns. Never touches {@code srs} beyond what {@link
 * AIContextBuilder} already reads — this service itself has no SRS dependency at all, so it
 * structurally cannot write a review schedule.
 *
 * <p>Every method takes {@code userId} first and every conversation lookup is ownership-checked
 * (see decision D18) so one account can never read or continue another account's conversation.
 */
/**
 * No class-level transaction on purpose: AI calls take seconds and the prod pool has 3 connections,
 * so each flow is read/write (short transaction) → AI call (none) → save (short).
 */
@Service
public class AiTutorService {

    private static final String CONVERSATION_MODE = "CONVERSATION";

    private final AIProvider aiProvider;
    private final AIContextBuilder contextBuilder;
    private final LanguageService languageService;
    private final AIConversationRepository conversationRepository;
    private final AIMessageRepository messageRepository;
    private final EntityManager entityManager;
    private final AiUsageService usageService;
    private final TransactionTemplate tx;
    private final Clock clock;

    public AiTutorService(
            AIProvider aiProvider,
            AIContextBuilder contextBuilder,
            LanguageService languageService,
            AIConversationRepository conversationRepository,
            AIMessageRepository messageRepository,
            EntityManager entityManager,
            AiUsageService usageService,
            TransactionTemplate tx,
            Clock clock) {
        this.aiProvider = aiProvider;
        this.contextBuilder = contextBuilder;
        this.languageService = languageService;
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.entityManager = entityManager;
        this.usageService = usageService;
        this.tx = tx;
        this.clock = clock;
    }

    public String explainGrammar(Long userId, String languageCode, String question) {
        usageService.consume(userId, AiFeature.GRAMMAR_EXPLAIN);
        LearnerContext context = contextBuilder.build(userId, languageCode);
        return aiProvider.explainGrammar(
                new GrammarExplainRequest(languageCode, question, context.currentLevel()));
    }

    public List<String> generateExamples(Long userId, String languageCode, String word) {
        usageService.consume(userId, AiFeature.EXAMPLES);
        LearnerContext context = contextBuilder.build(userId, languageCode);
        return aiProvider.generateExamples(
                new ExampleGenerationRequest(languageCode, word, context.currentLevel()));
    }

    /** One user action, so one quota unit, even though it may take two AI calls. */
    public SentenceCorrectionApiResponse correctSentence(
            Long userId, String languageCode, String text) {
        usageService.consume(userId, AiFeature.SENTENCE_CORRECTION);
        LearnerContext context = contextBuilder.build(userId, languageCode);
        SentenceCorrection correction =
                aiProvider.correctSentence(
                        new SentenceCorrectionRequest(languageCode, text, context.currentLevel()));

        String suggestedCategory = null;
        String suggestedTopic = null;
        if (!correction.corrected().trim().equalsIgnoreCase(text.trim())) {
            MistakeAnalysis analysis =
                    aiProvider.analyzeMistake(
                            new MistakeAnalysisRequest(
                                    languageCode,
                                    text,
                                    correction.corrected(),
                                    correction.explanation()));
            suggestedCategory = analysis.category();
            suggestedTopic = analysis.topic();
        }

        return new SentenceCorrectionApiResponse(
                correction.corrected(),
                correction.explanation(),
                suggestedCategory,
                suggestedTopic);
    }

    public ConversationMessageResponse sendMessage(
            Long userId,
            Long conversationId,
            String languageCode,
            String scenario,
            String message) {
        Turn turn =
                tx.execute(status -> {
                    AIConversation conversation =
                            conversationId != null
                                    ? findConversationOrThrow(userId, conversationId)
                                    : startConversation(userId, languageCode, scenario);
                    return beginTurn(userId, conversation, message);
                });
        String reply = aiProvider.continueConversation(turn.request(message));
        saveAssistantMessage(turn.conversationId(), reply);
        return new ConversationMessageResponse(turn.conversationId(), reply);
    }

    /**
     * Streams the reply via {@code onDelta} (called once per text fragment) instead of returning it
     * all at once. Requires an existing conversation — the first message of a conversation still
     * goes through {@link #sendMessage} to establish the conversation id.
     */
    public void streamMessage(
            Long userId, Long conversationId, String message, Consumer<String> onDelta) {
        Turn turn =
                tx.execute(status ->
                        beginTurn(
                                userId, findConversationOrThrow(userId, conversationId), message));
        StringBuilder fullReply = new StringBuilder();
        aiProvider.streamConversation(
                turn.request(message),
                delta -> {
                    fullReply.append(delta);
                    onDelta.accept(delta);
                },
                () -> saveAssistantMessage(turn.conversationId(), fullReply.toString()));
    }

    public ConversationSummaryResponse endConversation(Long userId, Long conversationId) {
        record Pending(
                ConversationSummaryResponse ended,
                String language,
                List<ConversationTurn> history) {}
        Pending pending =
                tx.execute(status -> {
                    AIConversation conversation = findConversationOrThrow(userId, conversationId);
                    if (conversation.getEndedAt() != null) {
                        return new Pending(
                                ConversationSummaryResponse.alreadyEnded(conversation), null, null);
                    }
                    usageService.consume(userId, AiFeature.CONVERSATION_SUMMARY);
                    return new Pending(null, languageOf(conversation), historyOf(conversation));
                });
        if (pending.ended() != null) {
            return pending.ended();
        }

        ConversationSummary summary =
                aiProvider.summarizeConversation(
                        new ConversationSummaryRequest(pending.language(), pending.history()));

        Instant endedAt =
                tx.execute(status -> {
                    AIConversation conversation = findConversationOrThrow(userId, conversationId);
                    conversation.setSummary(renderSummaryText(summary));
                    conversation.setEndedAt(Instant.now(clock));
                    return conversation.getEndedAt();
                });

        List<SuggestedVocabularyResponse> suggestedVocabulary =
                summary.newVocabulary().stream()
                        .map(v -> new SuggestedVocabularyResponse(v.word(), v.meaningVietnamese()))
                        .toList();

        return new ConversationSummaryResponse(
                conversationId,
                summary.overview(),
                summary.mistakes(),
                suggestedVocabulary,
                summary.betterExpressions(),
                summary.grammarProblems(),
                endedAt);
    }

    /**
     * What the AI call needs, captured inside the transaction so nothing lazy is touched after it.
     */
    private record Turn(
            Long conversationId,
            String language,
            String scenario,
            List<ConversationTurn> history,
            String level) {

        ConversationRequest request(String message) {
            return new ConversationRequest(language, scenario, level, history, message);
        }
    }

    /** Charges the quota first, so a rejected turn (429) rolls back the user's message too. */
    private Turn beginTurn(Long userId, AIConversation conversation, String message) {
        usageService.consume(userId, AiFeature.CONVERSATION);
        appendUserMessage(conversation, message);
        String language = languageOf(conversation);
        return new Turn(
                conversation.getId(),
                language,
                conversation.getScenario(),
                historyOf(conversation),
                contextBuilder.build(userId, language).currentLevel());
    }

    private void saveAssistantMessage(Long conversationId, String reply) {
        tx.executeWithoutResult(status ->
                messageRepository.save(
                        new AIMessage(
                                entityManager.getReference(AIConversation.class, conversationId),
                                "ASSISTANT",
                                reply,
                                Instant.now(clock))));
    }

    @Transactional(readOnly = true)
    public List<ConversationListItemResponse> listConversations(Long userId) {
        return conversationRepository.findAllByUser_IdOrderByStartedAtDesc(userId).stream()
                .map(ConversationListItemResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ConversationDetailResponse getConversation(Long userId, Long conversationId) {
        AIConversation conversation = findConversationOrThrow(userId, conversationId);
        List<ConversationMessageItem> messages =
                messageRepository.findByConversation_IdOrderByCreatedAtAsc(conversationId).stream()
                        .map(ConversationMessageItem::from)
                        .toList();
        return ConversationDetailResponse.from(conversation, messages);
    }

    @Transactional(readOnly = true)
    public List<ScenarioResponse> scenarios(String languageCode) {
        return ScenarioCatalog.forLanguage(languageCode);
    }

    /** Throws 404 unless the conversation exists and belongs to the user. */
    public void requireOwnConversation(Long userId, Long id) {
        findConversationOrThrow(userId, id);
    }

    AIConversation findConversationOrThrow(Long userId, Long id) {
        return conversationRepository
                .findByIdAndUser_Id(id, userId)
                .orElseThrow(() -> new NotFoundException("Conversation not found: " + id));
    }

    private AIConversation startConversation(Long userId, String languageCode, String scenario) {
        Language language = languageService.getByCode(languageCode);
        User userRef = entityManager.getReference(User.class, userId);
        AIConversation conversation =
                new AIConversation(
                        userRef, language, CONVERSATION_MODE, scenario, Instant.now(clock));
        return conversationRepository.save(conversation);
    }

    private void appendUserMessage(AIConversation conversation, String message) {
        messageRepository.save(new AIMessage(conversation, "USER", message, Instant.now(clock)));
    }

    private List<ConversationTurn> historyOf(AIConversation conversation) {
        return messageRepository
                .findByConversation_IdOrderByCreatedAtAsc(conversation.getId())
                .stream()
                .map(m ->
                        new ConversationTurn(m.getRole().toLowerCase(Locale.ROOT), m.getContent()))
                .toList();
    }

    private String renderSummaryText(ConversationSummary summary) {
        StringBuilder text = new StringBuilder(summary.overview());
        if (!summary.mistakes().isEmpty()) {
            text.append("\n\nMistakes:\n");
            summary.mistakes()
                    .forEach(m ->
                            text.append(
                                    "- %s: %s -> %s (%s)\n"
                                            .formatted(
                                                    m.topic(),
                                                    m.original(),
                                                    m.corrected(),
                                                    m.explanation())));
        }
        if (!summary.newVocabulary().isEmpty()) {
            text.append("\nNew vocabulary: ")
                    .append(
                            summary.newVocabulary().stream()
                                    .map(v -> "%s (%s)".formatted(v.word(), v.meaningVietnamese()))
                                    .reduce((a, b) -> a + ", " + b)
                                    .orElse(""));
        }
        if (!summary.betterExpressions().isEmpty()) {
            text.append("\n\nBetter expressions: ")
                    .append(String.join(", ", summary.betterExpressions()));
        }
        if (!summary.grammarProblems().isEmpty()) {
            text.append("\n\nGrammar to review: ")
                    .append(String.join(", ", summary.grammarProblems()));
        }
        return text.toString();
    }

    private String languageOf(AIConversation conversation) {
        return conversation.getLanguage() == null ? null : conversation.getLanguage().getCode();
    }
}
