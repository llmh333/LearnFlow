package com.learnflow.backend.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.learnflow.backend.ai.context.AIContextBuilder;
import com.learnflow.backend.ai.context.LearnerContext;
import com.learnflow.backend.ai.domain.AIConversation;
import com.learnflow.backend.ai.domain.AIMessage;
import com.learnflow.backend.ai.dto.ConversationMessageResponse;
import com.learnflow.backend.ai.dto.ConversationSummaryResponse;
import com.learnflow.backend.ai.dto.SentenceCorrectionApiResponse;
import com.learnflow.backend.ai.provider.AIProvider;
import com.learnflow.backend.ai.provider.ConversationMistake;
import com.learnflow.backend.ai.provider.ConversationSummary;
import com.learnflow.backend.ai.provider.MistakeAnalysis;
import com.learnflow.backend.ai.provider.SentenceCorrection;
import com.learnflow.backend.ai.provider.SuggestedVocabulary;
import com.learnflow.backend.common.error.NotFoundException;
import com.learnflow.backend.language.LanguageService;
import com.learnflow.backend.language.domain.Language;
import com.learnflow.backend.mistake.MistakeService;
import com.learnflow.backend.mistake.dto.CreateMistakeRequest;
import com.learnflow.backend.mistake.dto.MistakeResponse;
import jakarta.persistence.EntityManager;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AiTutorServiceTest {

    private static final Instant NOW = Instant.parse("2026-01-01T00:00:00Z");
    private static final Clock FIXED_CLOCK = Clock.fixed(NOW, ZoneOffset.UTC);
    private static final Long USER_ID = 1L;

    @Mock private AIProvider aiProvider;
    @Mock private AIContextBuilder contextBuilder;
    @Mock private LanguageService languageService;
    @Mock private MistakeService mistakeService;
    @Mock private AIConversationRepository conversationRepository;
    @Mock private AIMessageRepository messageRepository;
    @Mock private EntityManager entityManager;

    private AiTutorService service;

    @BeforeEach
    void setUp() {
        service =
                new AiTutorService(
                        aiProvider,
                        contextBuilder,
                        languageService,
                        mistakeService,
                        conversationRepository,
                        messageRepository,
                        entityManager,
                        FIXED_CLOCK);
    }

    @Test
    void explainGrammar_passesInferredLevelToProvider() {
        when(contextBuilder.build(USER_ID, "en")).thenReturn(new LearnerContext("en", "B1", List.of()));
        when(aiProvider.explainGrammar(any())).thenReturn("Present perfect explanation");

        String explanation = service.explainGrammar(USER_ID, "en", "present perfect vs past simple");

        assertThat(explanation).isEqualTo("Present perfect explanation");
        var captor = org.mockito.ArgumentCaptor.forClass(com.learnflow.backend.ai.provider.GrammarExplainRequest.class);
        verify(aiProvider).explainGrammar(captor.capture());
        assertThat(captor.getValue().currentLevel()).isEqualTo("B1");
        assertThat(captor.getValue().question()).isEqualTo("present perfect vs past simple");
    }

    @Test
    void correctSentence_whenTextChanges_alsoSuggestsCategoryAndTopic() {
        when(contextBuilder.build(USER_ID, "en")).thenReturn(new LearnerContext("en", "A2", List.of()));
        when(aiProvider.correctSentence(any()))
                .thenReturn(new SentenceCorrection("I went home.", "Past tense needed."));
        when(aiProvider.analyzeMistake(any())).thenReturn(new MistakeAnalysis("Grammar", "Past tense"));

        SentenceCorrectionApiResponse result =
                service.correctSentence(USER_ID, "en", "I go home yesterday.");

        assertThat(result.corrected()).isEqualTo("I went home.");
        assertThat(result.explanation()).isEqualTo("Past tense needed.");
        assertThat(result.suggestedCategory()).isEqualTo("Grammar");
        assertThat(result.suggestedTopic()).isEqualTo("Past tense");
    }

    @Test
    void correctSentence_whenTextUnchanged_doesNotSuggestAMistake() {
        when(contextBuilder.build(USER_ID, "en")).thenReturn(new LearnerContext("en", "A2", List.of()));
        when(aiProvider.correctSentence(any()))
                .thenReturn(new SentenceCorrection("I am fine.", "Already correct."));

        SentenceCorrectionApiResponse result = service.correctSentence(USER_ID, "en", "I am fine.");

        assertThat(result.suggestedCategory()).isNull();
        assertThat(result.suggestedTopic()).isNull();
        verify(aiProvider, never()).analyzeMistake(any());
    }

    @Test
    void sendMessage_noConversationId_createsNewConversation() {
        Language english = newLanguage("en", "English");
        when(languageService.getByCode("en")).thenReturn(english);
        when(conversationRepository.save(any(AIConversation.class))).thenAnswer(inv -> inv.getArgument(0));
        when(messageRepository.findByConversation_IdOrderByCreatedAtAsc(any()))
                .thenReturn(List.of());
        when(contextBuilder.build(USER_ID, "en")).thenReturn(new LearnerContext("en", "A1", List.of()));
        when(aiProvider.continueConversation(any())).thenReturn("Hello! How can I help you practice today?");

        ConversationMessageResponse response =
                service.sendMessage(USER_ID, null, "en", "daily chat", "Hi!");

        assertThat(response.reply()).isEqualTo("Hello! How can I help you practice today?");
        verify(conversationRepository).save(any(AIConversation.class));
        verify(messageRepository, org.mockito.Mockito.times(2)).save(any(AIMessage.class));
    }

    @Test
    void sendMessage_unknownConversationId_throwsNotFound() {
        when(conversationRepository.findByIdAndUser_Id(99L, USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.sendMessage(USER_ID, 99L, "en", null, "hi"))
                .isInstanceOf(NotFoundException.class);
        verify(aiProvider, never()).continueConversation(any());
    }

    @Test
    void streamMessage_deliversDeltasAndPersistsFullReplyOnComplete() {
        Language english = newLanguage("en", "English");
        AIConversation conversation = newConversation(english, 1L);
        when(conversationRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.of(conversation));
        when(messageRepository.findByConversation_IdOrderByCreatedAtAsc(1L)).thenReturn(List.of());
        when(contextBuilder.build(USER_ID, "en")).thenReturn(new LearnerContext("en", "A1", List.of()));
        // Simulate the provider delivering "Hello" then " there!" then completing.
        org.mockito.Mockito.doAnswer(
                        invocation -> {
                            java.util.function.Consumer<String> onDelta = invocation.getArgument(1);
                            Runnable onComplete = invocation.getArgument(2);
                            onDelta.accept("Hello");
                            onDelta.accept(" there!");
                            onComplete.run();
                            return null;
                        })
                .when(aiProvider)
                .streamConversation(any(), any(), any());

        StringBuilder received = new StringBuilder();
        service.streamMessage(USER_ID, 1L, "Hi!", received::append);

        assertThat(received.toString()).isEqualTo("Hello there!");
        // 1 save for the user's message + 1 save for the fully-assembled assistant reply.
        verify(messageRepository, org.mockito.Mockito.times(2)).save(any(AIMessage.class));
    }

    @Test
    void endConversation_pushesMistakesToMistakeBookAndSuggestsVocabulary() {
        Language english = newLanguage("en", "English");
        AIConversation conversation = newConversation(english, 1L);
        when(conversationRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.of(conversation));
        when(messageRepository.findByConversation_IdOrderByCreatedAtAsc(1L)).thenReturn(List.of());
        ConversationSummary summary =
                new ConversationSummary(
                        "Great practice session!",
                        List.of(new ConversationMistake("Grammar", "Past tense", "I go yesterday.", "I went yesterday.", "past tense needed")),
                        List.of(new SuggestedVocabulary("achieve", "đạt được")),
                        List.of("could've said 'I'm doing well' instead of 'I good'"),
                        List.of("Past tense"));
        when(aiProvider.summarizeConversation(any())).thenReturn(summary);
        MistakeResponse pushedMistake =
                new MistakeResponse(1L, null, null, "Grammar", "Past tense", "I go yesterday.", "I went yesterday.", "past tense needed", 1, NOW);
        when(mistakeService.createOrIncrement(eq(USER_ID), any(CreateMistakeRequest.class)))
                .thenReturn(pushedMistake);

        ConversationSummaryResponse response = service.endConversation(USER_ID, 1L);

        assertThat(response.overview()).isEqualTo("Great practice session!");
        assertThat(response.pushedMistakes()).containsExactly(pushedMistake);
        assertThat(response.suggestedVocabulary()).hasSize(1);
        assertThat(response.suggestedVocabulary().get(0).word()).isEqualTo("achieve");
        assertThat(conversation.getEndedAt()).isNotNull();
        assertThat(conversation.getSummary()).contains("Great practice session!").contains("Past tense");

        var captor = org.mockito.ArgumentCaptor.forClass(CreateMistakeRequest.class);
        verify(mistakeService).createOrIncrement(eq(USER_ID), captor.capture());
        assertThat(captor.getValue().languageCode()).isEqualTo("en");
        assertThat(captor.getValue().category()).isEqualTo("Grammar");
    }

    @Test
    void endConversation_calledAgain_doesNotRePushMistakes() {
        Language english = newLanguage("en", "English");
        AIConversation conversation = newConversation(english, 1L);
        when(conversationRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.of(conversation));
        when(messageRepository.findByConversation_IdOrderByCreatedAtAsc(1L)).thenReturn(List.of());
        when(aiProvider.summarizeConversation(any()))
                .thenReturn(new ConversationSummary("Nice work!", List.of(), List.of(), List.of(), List.of()));

        service.endConversation(USER_ID, 1L);
        ConversationSummaryResponse second = service.endConversation(USER_ID, 1L);

        assertThat(second.overview()).contains("Nice work!");
        assertThat(second.pushedMistakes()).isEmpty();
        verify(aiProvider, org.mockito.Mockito.times(1)).summarizeConversation(any());
        verify(mistakeService, never()).createOrIncrement(any(), any());
    }

    private static AIConversation newConversation(Language language, long id) {
        AIConversation conversation = new AIConversation(null, language, "CONVERSATION", null, NOW);
        try {
            var field = AIConversation.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(conversation, id);
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException(e);
        }
        return conversation;
    }

    private static Language newLanguage(String code, String name) {
        Language language = new Language(code, name);
        try {
            var field = Language.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(language, (short) 1);
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException(e);
        }
        return language;
    }
}
