package com.learnflow.backend.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
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
import com.learnflow.backend.ai.provider.MistakeAnalysis;
import com.learnflow.backend.ai.provider.SentenceCorrection;
import com.learnflow.backend.common.error.NotFoundException;
import com.learnflow.backend.language.LanguageService;
import com.learnflow.backend.language.domain.Language;
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

    @Mock private AIProvider aiProvider;
    @Mock private AIContextBuilder contextBuilder;
    @Mock private LanguageService languageService;
    @Mock private AIConversationRepository conversationRepository;
    @Mock private AIMessageRepository messageRepository;

    private AiTutorService service;

    @BeforeEach
    void setUp() {
        service =
                new AiTutorService(
                        aiProvider,
                        contextBuilder,
                        languageService,
                        conversationRepository,
                        messageRepository,
                        FIXED_CLOCK);
    }

    @Test
    void explainGrammar_passesInferredLevelToProvider() {
        when(contextBuilder.build("en")).thenReturn(new LearnerContext("en", "B1", List.of()));
        when(aiProvider.explainGrammar(any())).thenReturn("Present perfect explanation");

        String explanation = service.explainGrammar("en", "present perfect vs past simple");

        assertThat(explanation).isEqualTo("Present perfect explanation");
        var captor = org.mockito.ArgumentCaptor.forClass(com.learnflow.backend.ai.provider.GrammarExplainRequest.class);
        verify(aiProvider).explainGrammar(captor.capture());
        assertThat(captor.getValue().currentLevel()).isEqualTo("B1");
        assertThat(captor.getValue().question()).isEqualTo("present perfect vs past simple");
    }

    @Test
    void correctSentence_whenTextChanges_alsoSuggestsCategoryAndTopic() {
        when(contextBuilder.build("en")).thenReturn(new LearnerContext("en", "A2", List.of()));
        when(aiProvider.correctSentence(any()))
                .thenReturn(new SentenceCorrection("I went home.", "Past tense needed."));
        when(aiProvider.analyzeMistake(any())).thenReturn(new MistakeAnalysis("Grammar", "Past tense"));

        SentenceCorrectionApiResponse result = service.correctSentence("en", "I go home yesterday.");

        assertThat(result.corrected()).isEqualTo("I went home.");
        assertThat(result.explanation()).isEqualTo("Past tense needed.");
        assertThat(result.suggestedCategory()).isEqualTo("Grammar");
        assertThat(result.suggestedTopic()).isEqualTo("Past tense");
    }

    @Test
    void correctSentence_whenTextUnchanged_doesNotSuggestAMistake() {
        when(contextBuilder.build("en")).thenReturn(new LearnerContext("en", "A2", List.of()));
        when(aiProvider.correctSentence(any()))
                .thenReturn(new SentenceCorrection("I am fine.", "Already correct."));

        SentenceCorrectionApiResponse result = service.correctSentence("en", "I am fine.");

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
        when(contextBuilder.build("en")).thenReturn(new LearnerContext("en", "A1", List.of()));
        when(aiProvider.continueConversation(any())).thenReturn("Hello! How can I help you practice today?");

        ConversationMessageResponse response = service.sendMessage(null, "en", "daily chat", "Hi!");

        assertThat(response.reply()).isEqualTo("Hello! How can I help you practice today?");
        verify(conversationRepository).save(any(AIConversation.class));
        verify(messageRepository, org.mockito.Mockito.times(2)).save(any(AIMessage.class));
    }

    @Test
    void sendMessage_unknownConversationId_throwsNotFound() {
        when(conversationRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.sendMessage(99L, "en", null, "hi"))
                .isInstanceOf(NotFoundException.class);
        verify(aiProvider, never()).continueConversation(any());
    }

    @Test
    void endConversation_summarizesOnlyOnce() {
        Language english = newLanguage("en", "English");
        AIConversation conversation = new AIConversation(english, "CONVERSATION", null, NOW);
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(conversation));
        when(messageRepository.findByConversation_IdOrderByCreatedAtAsc(1L)).thenReturn(List.of());
        when(aiProvider.summarizeConversation(any())).thenReturn("Great practice session!");

        ConversationSummaryResponse first = service.endConversation(1L);
        assertThat(first.summary()).isEqualTo("Great practice session!");
        assertThat(conversation.getEndedAt()).isNotNull();

        // Ending an already-ended conversation should not call the AI provider again.
        ConversationSummaryResponse second = service.endConversation(1L);
        assertThat(second.summary()).isEqualTo("Great practice session!");
        verify(aiProvider, org.mockito.Mockito.times(1)).summarizeConversation(any());
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
