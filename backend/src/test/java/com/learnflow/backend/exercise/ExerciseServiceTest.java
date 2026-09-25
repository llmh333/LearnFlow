package com.learnflow.backend.exercise;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.learnflow.backend.ai.context.AIContextBuilder;
import com.learnflow.backend.ai.context.LearnerContext;
import com.learnflow.backend.ai.provider.AIProvider;
import com.learnflow.backend.auth.domain.User;
import com.learnflow.backend.common.error.NotFoundException;
import com.learnflow.backend.exercise.domain.Exercise;
import com.learnflow.backend.exercise.domain.ExerciseSource;
import com.learnflow.backend.exercise.domain.ExerciseType;
import com.learnflow.backend.exercise.dto.ExerciseAnswerRequest;
import com.learnflow.backend.exercise.dto.ExerciseAnswerResponse;
import com.learnflow.backend.exercise.dto.ExerciseResponse;
import com.learnflow.backend.exercise.engine.MultipleChoiceGenerator;
import com.learnflow.backend.exercise.engine.SentenceScrambleGenerator;
import com.learnflow.backend.language.LanguageService;
import com.learnflow.backend.language.domain.Language;
import com.learnflow.backend.progress.ProgressService;
import com.learnflow.backend.vocabulary.VocabularyService;
import com.learnflow.backend.vocabulary.domain.Vocabulary;
import com.learnflow.backend.vocabulary.dto.VocabularyResponse;
import jakarta.persistence.EntityManager;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Random;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;

@ExtendWith(MockitoExtension.class)
class ExerciseServiceTest {

    private static final Clock FIXED_CLOCK =
            Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);
    private static final Long USER_ID = 1L;

    @Mock private ExerciseRepository exerciseRepository;
    @Mock private ProgressService progressService;
    @Mock private VocabularyService vocabularyService;
    @Mock private LanguageService languageService;
    @Mock private AIContextBuilder aiContextBuilder;
    @Mock private AIProvider aiProvider;
    @Mock private EntityManager entityManager;

    private ExerciseService exerciseService;
    private ExerciseProperties properties;

    @BeforeEach
    void setUp() {
        properties = new ExerciseProperties(5, 3, 3);
        exerciseService =
                new ExerciseService(
                        exerciseRepository,
                        progressService,
                        vocabularyService,
                        languageService,
                        aiContextBuilder,
                        aiProvider,
                        new SentenceScrambleGenerator(),
                        new MultipleChoiceGenerator(),
                        properties,
                        entityManager,
                        new Random(42),
                        FIXED_CLOCK);
        Mockito.lenient()
                .when(entityManager.getReference(eq(User.class), any()))
                .thenReturn(newUser(USER_ID));
        Mockito.lenient()
                .when(entityManager.getReference(eq(Vocabulary.class), any()))
                .thenReturn(Mockito.mock(Vocabulary.class));
        Mockito.lenient()
                .when(languageService.getByCode("en"))
                .thenReturn(newLanguage((short) 1, "en", "English"));
        Mockito.lenient()
                .when(exerciseRepository.saveAll(any()))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void getToday_newUserWithNoReviewHistory_fillsExercisesFromRandomPool() {
        // weakAreas empty, exactly like a brand-new user who has never reviewed anything.
        when(progressService.weakAreas(USER_ID, "en", 5)).thenReturn(List.of());
        when(exerciseRepository.findByUser_IdAndLanguage_CodeAndExerciseDateOrderByDisplayOrderAsc(
                        USER_ID, "en", LocalDate.now(FIXED_CLOCK)))
                .thenReturn(List.of());

        List<VocabularyResponse> pool =
                List.of(
                        vocab(1L, "achieve", "đạt được", "I want to achieve my goals."),
                        vocab(2L, "banana", "quả chuối", null),
                        vocab(3L, "cactus", "xương rồng", "There is a cactus on my desk."),
                        vocab(4L, "desk", "cái bàn", null),
                        vocab(5L, "eager", "háo hức", "She is eager to learn."),
                        vocab(6L, "fruit", "trái cây", null));
        Page<VocabularyResponse> page = new PageImpl<>(pool);
        when(vocabularyService.list(eq(USER_ID), eq("en"), isNull(), isNull(), any()))
                .thenReturn(page);

        List<ExerciseResponse> result = exerciseService.getToday(USER_ID, "en");

        assertThat(result).hasSize(5);
        verify(exerciseRepository).saveAll(any());
        // Answer key must never leak in the "today" response.
        result.forEach(
                r -> {
                    if (r.type() == ExerciseType.SENTENCE_SCRAMBLE) {
                        assertThat(r.shuffledTokens()).isNotEmpty();
                    } else {
                        assertThat(r.options()).isNotEmpty();
                    }
                });
    }

    @Test
    void getToday_deterministicExercisesAlreadyGeneratedToday_doesNotRegenerate() {
        Exercise existing = sentenceScrambleExercise();
        when(exerciseRepository.findByUser_IdAndLanguage_CodeAndExerciseDateOrderByDisplayOrderAsc(
                        USER_ID, "en", LocalDate.now(FIXED_CLOCK)))
                .thenReturn(List.of(existing));

        List<ExerciseResponse> result = exerciseService.getToday(USER_ID, "en");

        assertThat(result).hasSize(1);
        verify(exerciseRepository, never()).saveAll(any());
        verify(progressService, never()).weakAreas(any(), any(), anyInt());
    }

    @Test
    void submitAnswer_sentenceScramble_correctOrder_isGradedCorrect() {
        Exercise exercise = sentenceScrambleExercise();
        when(exerciseRepository.findByIdAndUser_Id(10L, USER_ID)).thenReturn(java.util.Optional.of(exercise));

        ExerciseAnswerResponse response =
                exerciseService.submitAnswer(
                        USER_ID, 10L, new ExerciseAnswerRequest(List.of("I", "want", "to", "learn."), null));

        assertThat(response.correct()).isTrue();
        assertThat(exercise.isCompleted()).isTrue();
        assertThat(exercise.getCorrect()).isTrue();
    }

    @Test
    void submitAnswer_sentenceScramble_wrongOrder_isGradedIncorrect() {
        Exercise exercise = sentenceScrambleExercise();
        when(exerciseRepository.findByIdAndUser_Id(10L, USER_ID)).thenReturn(java.util.Optional.of(exercise));

        ExerciseAnswerResponse response =
                exerciseService.submitAnswer(
                        USER_ID, 10L, new ExerciseAnswerRequest(List.of("want", "I", "to", "learn."), null));

        assertThat(response.correct()).isFalse();
        assertThat(response.correctTokens()).containsExactly("I", "want", "to", "learn.");
    }

    @Test
    void submitAnswer_multipleChoice_correctIndex_isGradedCorrect() {
        Exercise exercise = multipleChoiceExercise();
        when(exerciseRepository.findByIdAndUser_Id(20L, USER_ID)).thenReturn(java.util.Optional.of(exercise));

        ExerciseAnswerResponse response =
                exerciseService.submitAnswer(USER_ID, 20L, new ExerciseAnswerRequest(null, 2));

        assertThat(response.correct()).isTrue();
        assertThat(response.correctOptionIndex()).isEqualTo(2);
    }

    @Test
    void submitAnswer_missingExercise_throwsNotFound() {
        when(exerciseRepository.findByIdAndUser_Id(99L, USER_ID)).thenReturn(java.util.Optional.empty());

        assertThatThrownBy(
                        () -> exerciseService.submitAnswer(USER_ID, 99L, new ExerciseAnswerRequest(null, 0)))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void topUpAiExercisesFor_bufferAlreadyFull_doesNotCallAiProvider() {
        Language english = newLanguage((short) 1, "en", "English");
        when(languageService.getByCode("en")).thenReturn(english);
        when(exerciseRepository.findMaxExerciseDate(USER_ID, (short) 1, ExerciseSource.AI))
                .thenReturn(java.util.Optional.of(LocalDate.now(FIXED_CLOCK).plusDays(2)));

        exerciseService.topUpAiExercisesFor(USER_ID, "en", LocalDate.now(FIXED_CLOCK).plusDays(2));

        verify(aiProvider, never()).generateExercises(any());
    }

    @Test
    void topUpAiExercisesFor_bufferLow_generatesMissingDaysOnly() {
        Language english = newLanguage((short) 1, "en", "English");
        when(languageService.getByCode("en")).thenReturn(english);
        LocalDate today = LocalDate.now(FIXED_CLOCK);
        // Buffer only covers today — missing today+1 and today+2.
        when(exerciseRepository.findMaxExerciseDate(USER_ID, (short) 1, ExerciseSource.AI))
                .thenReturn(java.util.Optional.of(today));
        when(exerciseRepository.findByUser_IdAndLanguage_IdAndExerciseDateOrderByDisplayOrderAsc(
                        eq(USER_ID), eq((short) 1), any()))
                .thenReturn(List.of());
        when(aiContextBuilder.build(USER_ID, "en"))
                .thenReturn(new LearnerContext("en", "A1", List.of()));
        when(aiProvider.generateExercises(any())).thenReturn(List.of());

        exerciseService.topUpAiExercisesFor(USER_ID, "en", today.plusDays(2));

        verify(aiProvider, Mockito.times(2)).generateExercises(any());
    }

    private Exercise sentenceScrambleExercise() {
        Map<String, Object> payload =
                Map.of(
                        "correctTokens", List.of("I", "want", "to", "learn."),
                        "shuffledTokens", List.of("learn.", "I", "to", "want"));
        return new Exercise(
                newUser(USER_ID),
                newLanguage((short) 1, "en", "English"),
                null,
                LocalDate.now(FIXED_CLOCK),
                ExerciseType.SENTENCE_SCRAMBLE,
                ExerciseSource.DETERMINISTIC,
                payload,
                0,
                Instant.now(FIXED_CLOCK));
    }

    private Exercise multipleChoiceExercise() {
        Map<String, Object> payload =
                Map.of(
                        "question", "What does \"achieve\" mean?",
                        "options", List.of("quả chuối", "học tập", "đạt được", "làm việc"),
                        "correctOptionIndex", 2);
        return new Exercise(
                newUser(USER_ID),
                newLanguage((short) 1, "en", "English"),
                null,
                LocalDate.now(FIXED_CLOCK),
                ExerciseType.MULTIPLE_CHOICE,
                ExerciseSource.DETERMINISTIC,
                payload,
                0,
                Instant.now(FIXED_CLOCK));
    }

    private static VocabularyResponse vocab(Long id, String word, String meaning, String example) {
        return new VocabularyResponse(
                id,
                new com.learnflow.backend.language.dto.LanguageResponse((short) 1, "en", "English"),
                word,
                meaning,
                example,
                (short) 1,
                List.of(),
                Map.of(),
                Instant.now(FIXED_CLOCK),
                Instant.now(FIXED_CLOCK));
    }

    private static Language newLanguage(short id, String code, String name) {
        Language language = new Language(code, name);
        setField(language, Language.class, "id", id);
        return language;
    }

    private static User newUser(Long id) {
        User user = new User("user" + id + "@example.com", "hash", "User", Instant.now(FIXED_CLOCK));
        setField(user, User.class, "id", id);
        return user;
    }

    private static void setField(Object target, Class<?> type, String fieldName, Object value) {
        try {
            var field = type.getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException(e);
        }
    }
}
