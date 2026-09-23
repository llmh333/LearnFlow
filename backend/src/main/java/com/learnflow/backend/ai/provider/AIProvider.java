package com.learnflow.backend.ai.provider;

import java.util.List;

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

    String summarizeConversation(ConversationSummaryRequest request);

    String generateDailyPlan(DailyPlanContext context);
}
