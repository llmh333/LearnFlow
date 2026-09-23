package com.learnflow.backend.ai;

import com.learnflow.backend.ai.context.AIContextBuilder;
import com.learnflow.backend.ai.context.LearnerContext;
import com.learnflow.backend.ai.domain.AIConversation;
import com.learnflow.backend.ai.domain.AIMessage;
import com.learnflow.backend.ai.dto.ConversationDetailResponse;
import com.learnflow.backend.ai.dto.ConversationListItemResponse;
import com.learnflow.backend.ai.dto.ConversationMessageItem;
import com.learnflow.backend.ai.dto.ConversationMessageResponse;
import com.learnflow.backend.ai.dto.ConversationSummaryResponse;
import com.learnflow.backend.ai.dto.ScenarioResponse;
import com.learnflow.backend.ai.dto.SentenceCorrectionApiResponse;
import com.learnflow.backend.ai.dto.SuggestedVocabularyResponse;
import com.learnflow.backend.ai.provider.AIProvider;
import com.learnflow.backend.ai.provider.ConversationMistake;
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
import com.learnflow.backend.common.error.NotFoundException;
import com.learnflow.backend.language.LanguageService;
import com.learnflow.backend.language.domain.Language;
import com.learnflow.backend.mistake.MistakeService;
import com.learnflow.backend.mistake.dto.CreateMistakeRequest;
import com.learnflow.backend.mistake.dto.MistakeResponse;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.function.Consumer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Orchestrates AI Tutor requests: builds a bounded {@link LearnerContext}, calls {@link
 * AIProvider}, and persists conversation turns. Never touches {@code srs} beyond what {@link
 * AIContextBuilder} already reads — this service itself has no SRS dependency at all, so it
 * structurally cannot write a review schedule.
 */
@Service
@Transactional
public class AiTutorService {

    private static final String CONVERSATION_MODE = "CONVERSATION";

    private final AIProvider aiProvider;
    private final AIContextBuilder contextBuilder;
    private final LanguageService languageService;
    private final MistakeService mistakeService;
    private final AIConversationRepository conversationRepository;
    private final AIMessageRepository messageRepository;
    private final Clock clock;

    public AiTutorService(
            AIProvider aiProvider,
            AIContextBuilder contextBuilder,
            LanguageService languageService,
            MistakeService mistakeService,
            AIConversationRepository conversationRepository,
            AIMessageRepository messageRepository,
            Clock clock) {
        this.aiProvider = aiProvider;
        this.contextBuilder = contextBuilder;
        this.languageService = languageService;
        this.mistakeService = mistakeService;
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.clock = clock;
    }

    public String explainGrammar(String languageCode, String question) {
        LearnerContext context = contextBuilder.build(languageCode);
        return aiProvider.explainGrammar(
                new GrammarExplainRequest(languageCode, question, context.currentLevel()));
    }

    public List<String> generateExamples(String languageCode, String word) {
        LearnerContext context = contextBuilder.build(languageCode);
        return aiProvider.generateExamples(
                new ExampleGenerationRequest(languageCode, word, context.currentLevel()));
    }

    public SentenceCorrectionApiResponse correctSentence(String languageCode, String text) {
        LearnerContext context = contextBuilder.build(languageCode);
        SentenceCorrection correction =
                aiProvider.correctSentence(
                        new SentenceCorrectionRequest(languageCode, text, context.currentLevel()));

        String suggestedCategory = null;
        String suggestedTopic = null;
        if (!correction.corrected().trim().equalsIgnoreCase(text.trim())) {
            MistakeAnalysis analysis =
                    aiProvider.analyzeMistake(
                            new MistakeAnalysisRequest(
                                    languageCode, text, correction.corrected(), correction.explanation()));
            suggestedCategory = analysis.category();
            suggestedTopic = analysis.topic();
        }

        return new SentenceCorrectionApiResponse(
                correction.corrected(), correction.explanation(), suggestedCategory, suggestedTopic);
    }

    public ConversationMessageResponse sendMessage(
            Long conversationId, String languageCode, String scenario, String message) {
        AIConversation conversation =
                conversationId != null
                        ? findConversationOrThrow(conversationId)
                        : startConversation(languageCode, scenario);

        appendUserMessage(conversation, message);
        List<ConversationTurn> history = historyOf(conversation);
        LearnerContext context = contextBuilder.build(languageOf(conversation));
        String reply =
                aiProvider.continueConversation(
                        new ConversationRequest(
                                languageOf(conversation),
                                conversation.getScenario(),
                                context.currentLevel(),
                                history,
                                message));
        messageRepository.save(new AIMessage(conversation, "ASSISTANT", reply, Instant.now(clock)));

        return new ConversationMessageResponse(conversation.getId(), reply);
    }

    /**
     * Streams the reply via {@code onDelta} (called once per text fragment) instead of returning
     * it all at once. Requires an existing conversation — the first message of a conversation still
     * goes through {@link #sendMessage} to establish the conversation id.
     */
    public void streamMessage(Long conversationId, String message, Consumer<String> onDelta) {
        AIConversation conversation = findConversationOrThrow(conversationId);
        appendUserMessage(conversation, message);
        List<ConversationTurn> history = historyOf(conversation);
        LearnerContext context = contextBuilder.build(languageOf(conversation));

        StringBuilder fullReply = new StringBuilder();
        aiProvider.streamConversation(
                new ConversationRequest(
                        languageOf(conversation), conversation.getScenario(), context.currentLevel(), history, message),
                delta -> {
                    fullReply.append(delta);
                    onDelta.accept(delta);
                },
                () ->
                        messageRepository.save(
                                new AIMessage(conversation, "ASSISTANT", fullReply.toString(), Instant.now(clock))));
    }

    public ConversationSummaryResponse endConversation(Long conversationId) {
        AIConversation conversation = findConversationOrThrow(conversationId);
        if (conversation.getEndedAt() != null) {
            return ConversationSummaryResponse.alreadyEnded(conversation);
        }

        ConversationSummary summary =
                aiProvider.summarizeConversation(
                        new ConversationSummaryRequest(languageOf(conversation), historyOf(conversation)));

        List<MistakeResponse> pushedMistakes = pushMistakes(conversation, summary.mistakes());

        conversation.setSummary(renderSummaryText(summary));
        conversation.setEndedAt(Instant.now(clock));

        List<SuggestedVocabularyResponse> suggestedVocabulary =
                summary.newVocabulary().stream()
                        .map(v -> new SuggestedVocabularyResponse(v.word(), v.meaningVietnamese()))
                        .toList();

        return new ConversationSummaryResponse(
                conversation.getId(),
                summary.overview(),
                pushedMistakes,
                suggestedVocabulary,
                summary.betterExpressions(),
                summary.grammarProblems(),
                conversation.getEndedAt());
    }

    @Transactional(readOnly = true)
    public List<ConversationListItemResponse> listConversations() {
        return conversationRepository.findAllByOrderByStartedAtDesc().stream()
                .map(ConversationListItemResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ConversationDetailResponse getConversation(Long conversationId) {
        AIConversation conversation = findConversationOrThrow(conversationId);
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

    /** Package-visible so a controller-level integration test can seed a conversation directly if needed. */
    AIConversation findConversationOrThrow(Long id) {
        return conversationRepository
                .findById(id)
                .orElseThrow(() -> new NotFoundException("Conversation not found: " + id));
    }

    private AIConversation startConversation(String languageCode, String scenario) {
        Language language = languageService.getByCode(languageCode);
        AIConversation conversation =
                new AIConversation(language, CONVERSATION_MODE, scenario, Instant.now(clock));
        return conversationRepository.save(conversation);
    }

    private void appendUserMessage(AIConversation conversation, String message) {
        messageRepository.save(new AIMessage(conversation, "USER", message, Instant.now(clock)));
    }

    private List<ConversationTurn> historyOf(AIConversation conversation) {
        return messageRepository.findByConversation_IdOrderByCreatedAtAsc(conversation.getId()).stream()
                .map(m -> new ConversationTurn(m.getRole().toLowerCase(Locale.ROOT), m.getContent()))
                .toList();
    }

    private List<MistakeResponse> pushMistakes(AIConversation conversation, List<ConversationMistake> mistakes) {
        String languageCode = languageOf(conversation);
        return mistakes.stream()
                .map(
                        m ->
                                mistakeService.createOrIncrement(
                                        new CreateMistakeRequest(
                                                languageCode,
                                                null,
                                                m.category(),
                                                m.topic(),
                                                m.original(),
                                                m.corrected(),
                                                m.explanation())))
                .toList();
    }

    private String renderSummaryText(ConversationSummary summary) {
        StringBuilder text = new StringBuilder(summary.overview());
        if (!summary.mistakes().isEmpty()) {
            text.append("\n\nMistakes:\n");
            summary
                    .mistakes()
                    .forEach(
                            m ->
                                    text.append("- %s: %s -> %s (%s)\n"
                                            .formatted(m.topic(), m.original(), m.corrected(), m.explanation())));
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
            text.append("\n\nBetter expressions: ").append(String.join(", ", summary.betterExpressions()));
        }
        if (!summary.grammarProblems().isEmpty()) {
            text.append("\n\nGrammar to review: ").append(String.join(", ", summary.grammarProblems()));
        }
        return text.toString();
    }

    private String languageOf(AIConversation conversation) {
        return conversation.getLanguage() == null ? null : conversation.getLanguage().getCode();
    }
}
