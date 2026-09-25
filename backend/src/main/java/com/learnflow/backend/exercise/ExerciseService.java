package com.learnflow.backend.exercise;

import com.learnflow.backend.ai.context.AIContextBuilder;
import com.learnflow.backend.ai.context.LearnerContext;
import com.learnflow.backend.ai.provider.AIProvider;
import com.learnflow.backend.ai.provider.AIProviderException;
import com.learnflow.backend.ai.provider.ExerciseGenerationRequest;
import com.learnflow.backend.ai.provider.GeneratedExercise;
import com.learnflow.backend.auth.domain.User;
import com.learnflow.backend.common.error.NotFoundException;
import com.learnflow.backend.exercise.domain.Exercise;
import com.learnflow.backend.exercise.domain.ExerciseSource;
import com.learnflow.backend.exercise.domain.ExerciseType;
import com.learnflow.backend.exercise.dto.ExerciseAnswerRequest;
import com.learnflow.backend.exercise.dto.ExerciseAnswerResponse;
import com.learnflow.backend.exercise.dto.ExerciseResponse;
import com.learnflow.backend.exercise.engine.ChoiceContent;
import com.learnflow.backend.exercise.engine.MultipleChoiceGenerator;
import com.learnflow.backend.exercise.engine.ScrambleContent;
import com.learnflow.backend.exercise.engine.SentenceScrambleGenerator;
import com.learnflow.backend.language.LanguageService;
import com.learnflow.backend.language.domain.Language;
import com.learnflow.backend.progress.ProgressService;
import com.learnflow.backend.progress.dto.WeakAreaResponse;
import com.learnflow.backend.vocabulary.VocabularyService;
import com.learnflow.backend.vocabulary.domain.Vocabulary;
import com.learnflow.backend.vocabulary.dto.VocabularyResponse;
import jakarta.persistence.EntityManager;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Orchestrates daily practice exercises generated 2 ways: {@link
 * com.learnflow.backend.exercise.domain.ExerciseSource#DETERMINISTIC} ones built from the user's
 * own vocabulary on first request each day (see {@link SentenceScrambleGenerator}/{@link
 * MultipleChoiceGenerator}, pure and free), and {@link
 * com.learnflow.backend.exercise.domain.ExerciseSource#AI} ones pre-generated ahead of time by
 * {@link com.learnflow.backend.exercise.scheduler.ExerciseGenerationScheduler}.
 */
@Service
@Transactional
public class ExerciseService {

    private static final Logger log = LoggerFactory.getLogger(ExerciseService.class);

    /** How many candidate words to pull from the random fallback pool, per vocabulary page fetch. */
    private static final int CANDIDATE_POOL_SIZE = 200;

    private final ExerciseRepository exerciseRepository;
    private final ProgressService progressService;
    private final VocabularyService vocabularyService;
    private final LanguageService languageService;
    private final AIContextBuilder aiContextBuilder;
    private final AIProvider aiProvider;
    private final SentenceScrambleGenerator scrambleGenerator;
    private final MultipleChoiceGenerator choiceGenerator;
    private final ExerciseProperties properties;
    private final EntityManager entityManager;
    private final Random random;
    private final Clock clock;

    public ExerciseService(
            ExerciseRepository exerciseRepository,
            ProgressService progressService,
            VocabularyService vocabularyService,
            LanguageService languageService,
            AIContextBuilder aiContextBuilder,
            AIProvider aiProvider,
            SentenceScrambleGenerator scrambleGenerator,
            MultipleChoiceGenerator choiceGenerator,
            ExerciseProperties properties,
            EntityManager entityManager,
            Random random,
            Clock clock) {
        this.exerciseRepository = exerciseRepository;
        this.progressService = progressService;
        this.vocabularyService = vocabularyService;
        this.languageService = languageService;
        this.aiContextBuilder = aiContextBuilder;
        this.aiProvider = aiProvider;
        this.scrambleGenerator = scrambleGenerator;
        this.choiceGenerator = choiceGenerator;
        this.properties = properties;
        this.entityManager = entityManager;
        this.random = random;
        this.clock = clock;
    }

    public List<ExerciseResponse> getToday(Long userId, String languageCode) {
        LocalDate today = LocalDate.now(clock);
        List<Exercise> existing =
                exerciseRepository.findByUser_IdAndLanguage_CodeAndExerciseDateOrderByDisplayOrderAsc(
                        userId, languageCode, today);
        boolean hasDeterministic =
                existing.stream().anyMatch(e -> e.getSource() == ExerciseSource.DETERMINISTIC);

        List<Exercise> all = existing;
        if (!hasDeterministic) {
            List<Exercise> generated =
                    generateDeterministicExercises(userId, languageCode, today, existing.size());
            all = new ArrayList<>(existing);
            all.addAll(generated);
        }
        return all.stream().map(ExerciseResponse::from).toList();
    }

    public ExerciseAnswerResponse submitAnswer(Long userId, Long exerciseId, ExerciseAnswerRequest request) {
        Exercise exercise =
                exerciseRepository
                        .findByIdAndUser_Id(exerciseId, userId)
                        .orElseThrow(() -> new NotFoundException("Exercise not found: " + exerciseId));

        boolean correct = grade(exercise, request);
        exercise.setCompleted(true);
        exercise.setCorrect(correct);
        exercise.setAnsweredAt(Instant.now(clock));

        return ExerciseAnswerResponse.from(exercise, correct);
    }

    /** Called by {@code ExerciseGenerationScheduler} to keep the AI buffer topped up to {@code
     * targetHorizon} for one user/language. No-op if the buffer already reaches that far. */
    public void topUpAiExercisesFor(Long userId, String languageCode, LocalDate targetHorizon) {
        Language language = languageService.getByCode(languageCode);
        LocalDate today = LocalDate.now(clock);
        LocalDate currentHorizon =
                exerciseRepository.findMaxExerciseDate(userId, language.getId(), ExerciseSource.AI).orElse(null);
        if (currentHorizon != null && !currentHorizon.isBefore(targetHorizon)) {
            return;
        }

        LocalDate startDate = currentHorizon == null ? today : currentHorizon.plusDays(1);
        for (LocalDate date = startDate; !date.isAfter(targetHorizon); date = date.plusDays(1)) {
            List<Exercise> existingForDate =
                    exerciseRepository.findByUser_IdAndLanguage_IdAndExerciseDateOrderByDisplayOrderAsc(
                            userId, language.getId(), date);
            generateAiExercisesForDate(
                    userId, language, date, properties.aiCountPerDay(), existingForDate.size());
        }
    }

    // ---- deterministic generation ----

    private List<Exercise> generateDeterministicExercises(
            Long userId, String languageCode, LocalDate date, int startOrder) {
        List<CandidateWord> candidates =
                selectCandidateWords(userId, languageCode, properties.deterministicCountPerDay());
        if (candidates.isEmpty()) {
            return List.of();
        }

        Language language = languageService.getByCode(languageCode);
        User userRef = entityManager.getReference(User.class, userId);
        List<String> meaningPool = candidates.stream().map(CandidateWord::meaning).toList();

        List<Exercise> exercises = new ArrayList<>();
        int order = startOrder;
        for (CandidateWord candidate : candidates) {
            var vocabularyRef =
                    entityManager.getReference(
                            Vocabulary.class, candidate.vocabularyId());

            if (candidate.example() != null && !candidate.example().isBlank()) {
                scrambleGenerator.generate(candidate.example(), languageCode, random).ifPresent(
                        content ->
                                exercises.add(
                                        toExercise(
                                                userRef,
                                                language,
                                                vocabularyRef,
                                                date,
                                                ExerciseType.SENTENCE_SCRAMBLE,
                                                ExerciseSource.DETERMINISTIC,
                                                scramblePayload(content))));
            } else {
                choiceGenerator.generate(candidate.word(), candidate.meaning(), meaningPool, random).ifPresent(
                        content ->
                                exercises.add(
                                        toExercise(
                                                userRef,
                                                language,
                                                vocabularyRef,
                                                date,
                                                ExerciseType.MULTIPLE_CHOICE,
                                                ExerciseSource.DETERMINISTIC,
                                                choicePayload(content))));
            }
        }
        // Fix display order now that we know the final list (some candidates may have been skipped).
        List<Exercise> ordered = new ArrayList<>();
        int nextOrder = startOrder;
        for (Exercise draft : exercises) {
            ordered.add(withOrder(draft, nextOrder++));
        }
        return exerciseRepository.saveAll(ordered);
    }

    /** Two-tier word selection: weak words first (most useful once the learner has review
     * history), topped up with a random sample from their full vocabulary so a brand-new account
     * — with zero review history, hence an empty weak-areas result — still gets a full set of
     * exercises from day one. */
    private List<CandidateWord> selectCandidateWords(Long userId, String languageCode, int limit) {
        LinkedHashMap<Long, CandidateWord> byId = new LinkedHashMap<>();

        for (WeakAreaResponse weak : progressService.weakAreas(userId, languageCode, limit)) {
            VocabularyResponse detail = vocabularyService.get(userId, weak.vocabularyId());
            byId.put(detail.id(), CandidateWord.from(detail));
        }

        if (byId.size() < limit) {
            var pool =
                    vocabularyService
                            .list(userId, languageCode, null, null, PageRequest.of(0, CANDIDATE_POOL_SIZE))
                            .getContent();
            List<VocabularyResponse> shuffled = new ArrayList<>(pool);
            Collections.shuffle(shuffled, random);
            for (VocabularyResponse candidate : shuffled) {
                if (byId.size() >= limit) {
                    break;
                }
                byId.putIfAbsent(candidate.id(), CandidateWord.from(candidate));
            }
        }

        return new ArrayList<>(byId.values()).stream().limit(limit).toList();
    }

    // ---- AI generation ----

    private void generateAiExercisesForDate(
            Long userId, Language language, LocalDate date, int count, int startOrder) {
        LearnerContext context = aiContextBuilder.build(userId, language.getCode());
        List<GeneratedExercise> generated;
        try {
            generated = aiProvider.generateExercises(new ExerciseGenerationRequest(context, count));
        } catch (AIProviderException e) {
            log.warn(
                    "AI exercise generation failed for user {} language {} date {}, skipping: {}",
                    userId,
                    language.getCode(),
                    date,
                    e.getMessage());
            return;
        }

        User userRef = entityManager.getReference(User.class, userId);
        List<Exercise> exercises = new ArrayList<>();
        int order = startOrder;
        for (GeneratedExercise g : generated) {
            Exercise exercise = toAiExercise(userRef, language, date, g, order);
            if (exercise != null) {
                exercises.add(exercise);
                order++;
            }
        }
        exerciseRepository.saveAll(exercises);
    }

    private Exercise toAiExercise(User userRef, Language language, LocalDate date, GeneratedExercise g, int order) {
        if ("SENTENCE_SCRAMBLE".equals(g.type())) {
            if (g.correctSentence() == null || g.correctSentence().isBlank()) {
                return null;
            }
            return scrambleGenerator
                    .generate(g.correctSentence(), language.getCode(), random)
                    .map(
                            content ->
                                    toExercise(
                                            userRef,
                                            language,
                                            null,
                                            date,
                                            ExerciseType.SENTENCE_SCRAMBLE,
                                            ExerciseSource.AI,
                                            scramblePayload(content)))
                    .map(e -> withOrder(e, order))
                    .orElse(null);
        }
        if ("MULTIPLE_CHOICE".equals(g.type())) {
            if (g.question() == null || g.options() == null || g.options().size() < 2
                    || g.correctOptionIndex() == null
                    || g.correctOptionIndex() < 0
                    || g.correctOptionIndex() >= g.options().size()) {
                return null;
            }
            Map<String, Object> payload =
                    Map.of(
                            "question", g.question(),
                            "options", g.options(),
                            "correctOptionIndex", g.correctOptionIndex());
            return withOrder(
                    toExercise(userRef, language, null, date, ExerciseType.MULTIPLE_CHOICE, ExerciseSource.AI, payload),
                    order);
        }
        return null;
    }

    // ---- grading ----

    @SuppressWarnings("unchecked")
    private boolean grade(Exercise exercise, ExerciseAnswerRequest request) {
        Map<String, Object> payload = exercise.getPayload();
        return switch (exercise.getType()) {
            case SENTENCE_SCRAMBLE -> {
                List<String> correctTokens = (List<String>) payload.get("correctTokens");
                yield correctTokens.equals(request.submittedTokens());
            }
            case MULTIPLE_CHOICE -> {
                int correctIndex = ((Number) payload.get("correctOptionIndex")).intValue();
                yield request.selectedOptionIndex() != null && request.selectedOptionIndex() == correctIndex;
            }
        };
    }

    // ---- helpers ----

    private Exercise toExercise(
            User userRef,
            Language language,
            Vocabulary vocabularyRef,
            LocalDate date,
            ExerciseType type,
            ExerciseSource source,
            Map<String, Object> payload) {
        return new Exercise(userRef, language, vocabularyRef, date, type, source, payload, 0, Instant.now(clock));
    }

    /** {@link Exercise#getDisplayOrder()} has no setter (it is fixed at construction) — rebuild
     * with the final order once the exercise list is known. */
    private Exercise withOrder(Exercise exercise, int order) {
        return new Exercise(
                exercise.getUser(),
                exercise.getLanguage(),
                exercise.getVocabulary(),
                exercise.getExerciseDate(),
                exercise.getType(),
                exercise.getSource(),
                exercise.getPayload(),
                order,
                exercise.getCreatedAt());
    }

    private Map<String, Object> scramblePayload(ScrambleContent content) {
        return Map.of("correctTokens", content.correctTokens(), "shuffledTokens", content.shuffledTokens());
    }

    private Map<String, Object> choicePayload(ChoiceContent content) {
        return Map.of(
                "question", content.question(),
                "options", content.options(),
                "correctOptionIndex", content.correctOptionIndex());
    }

    private record CandidateWord(Long vocabularyId, String word, String meaning, String example) {
        static CandidateWord from(VocabularyResponse response) {
            return new CandidateWord(response.id(), response.word(), response.meaning(), response.example());
        }
    }
}
