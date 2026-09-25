package com.learnflow.backend.ai.provider;

import java.util.List;
import java.util.function.Consumer;

/**
 * Abstraction over the AI backend (PROJECT.md §7): business logic never depends on a specific
 * vendor. {@code ClaudeAIProvider} is the only implementation for now; OpenAI/Gemini can be added
 * later behind this same interface.
 */
public interface AIProvider {

    String explainGrammar(GrammarExplainRequest request);

    List<String> generateExamples(ExampleGenerationRequest request);

    SentenceCorrection correctSentence(SentenceCorrectionRequest request);

    MistakeAnalysis analyzeMistake(MistakeAnalysisRequest request);

    String continueConversation(ConversationRequest request);

    /**
     * Same as {@link #continueConversation} but delivers the reply incrementally: {@code onDelta}
     * is called once per text fragment as it arrives, then {@code onComplete} once the reply is
     * fully received. Lets the AI Tutor chat show text appearing progressively (Phase 8) instead of
     * waiting for the whole response.
     */
    void streamConversation(ConversationRequest request, Consumer<String> onDelta, Runnable onComplete);

    ConversationSummary summarizeConversation(ConversationSummaryRequest request);

    String generateDailyPlan(DailyPlanContext context);

    /** Generates {@code request.count()} practice exercises (a mix of sentence-scramble and
     * multiple-choice) themed around the learner's context. Used by
     * {@code exercise.scheduler.ExerciseGenerationScheduler} to pre-generate upcoming days' AI
     * exercises ahead of time. */
    List<GeneratedExercise> generateExercises(ExerciseGenerationRequest request);
}
