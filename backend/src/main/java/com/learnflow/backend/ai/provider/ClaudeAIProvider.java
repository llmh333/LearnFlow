package com.learnflow.backend.ai.provider;

import com.learnflow.backend.ai.AIProperties;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Calls the Anthropic Messages API directly via {@link RestClient} (no SDK dependency). Structured
 * results (examples list, sentence correction) use Claude's tool-use forcing instead of parsing
 * free text, per {@code plan/phases/phase-5-ai-tutor.md}.
 */
@Component
@ConditionalOnProperty(prefix = "app.ai", name = "provider", havingValue = "claude", matchIfMissing = true)
public class ClaudeAIProvider implements AIProvider {

    private static final Logger log = LoggerFactory.getLogger(ClaudeAIProvider.class);
    private static final String API_URL = "https://api.anthropic.com/v1/messages";
    private static final String ANTHROPIC_VERSION = "2023-06-01";
    private static final int MAX_TOKENS = 1024;
    private static final int MAX_ATTEMPTS = 2; // 1 retry, per phase-5 checklist

    private final RestClient restClient;
    private final AIProperties properties;

    public ClaudeAIProvider(AIProperties properties) {
        this.properties = properties;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(10));
        requestFactory.setReadTimeout(Duration.ofSeconds(properties.timeoutSeconds()));

        this.restClient =
                RestClient.builder()
                        .requestFactory(requestFactory)
                        .defaultHeader("x-api-key", properties.anthropicApiKey())
                        .defaultHeader("anthropic-version", ANTHROPIC_VERSION)
                        .defaultHeader(HttpHeaders.CONTENT_TYPE, "application/json")
                        .build();
    }

    @Override
    public String explainGrammar(GrammarExplainRequest request) {
        String system =
                """
                You are a friendly, encouraging language tutor helping a learner of %s at level %s.
                Explain grammar clearly and concisely, with a short example. Keep the tone warm and
                supportive, never condescending.
                """
                        .formatted(request.languageCode(), request.currentLevel());
        return extractText(post(baseBody(system, List.of(userMessage(request.question())))));
    }

    @Override
    public List<String> generateExamples(ExampleGenerationRequest request) {
        String system =
                """
                You are a friendly, encouraging language tutor. Generate 3 example sentences using the
                word or phrase "%s" in %s, suitable for a learner at level %s: one simple, one in a work
                context, one conversational. Respond only via the generate_examples tool.
                """
                        .formatted(request.word(), request.languageCode(), request.currentLevel());
        Map<String, Object> schema =
                Map.of(
                        "type", "object",
                        "properties",
                                Map.of(
                                        "examples",
                                        Map.of("type", "array", "items", Map.of("type", "string"))),
                        "required", List.of("examples"));
        Map<String, Object> input =
                callTool(
                        system,
                        "Generate examples for: " + request.word(),
                        toolSpec("generate_examples", "Return example sentences", schema));
        Object examples = input.get("examples");
        return examples instanceof List<?> list ? list.stream().map(String::valueOf).toList() : List.of();
    }

    @Override
    public SentenceCorrection correctSentence(SentenceCorrectionRequest request) {
        String system =
                """
                You are a friendly, encouraging language tutor correcting a %s sentence for a learner at
                level %s. Respond only via the correct_sentence tool, with the corrected sentence and a
                short, encouraging explanation of what changed and why.
                """
                        .formatted(request.languageCode(), request.currentLevel());
        Map<String, Object> schema =
                Map.of(
                        "type", "object",
                        "properties",
                                Map.of(
                                        "corrected", Map.of("type", "string"),
                                        "explanation", Map.of("type", "string")),
                        "required", List.of("corrected", "explanation"));
        Map<String, Object> input =
                callTool(
                        system,
                        request.text(),
                        toolSpec("correct_sentence", "Return the corrected sentence and explanation", schema));
        return new SentenceCorrection(
                String.valueOf(input.get("corrected")), String.valueOf(input.get("explanation")));
    }

    @Override
    public MistakeAnalysis analyzeMistake(MistakeAnalysisRequest request) {
        String system =
                """
                You are a friendly, encouraging language tutor classifying a %s mistake for the
                learner's Mistake Book. Respond only via the analyze_mistake tool.
                """
                        .formatted(request.languageCode());
        String userMessage =
                "Original: %s\nCorrected: %s\nExplanation: %s"
                        .formatted(request.original(), request.corrected(), request.explanation());
        Map<String, Object> schema =
                Map.of(
                        "type", "object",
                        "properties",
                                Map.of(
                                        "category",
                                        Map.of(
                                                "type", "string",
                                                "enum",
                                                        List.of(
                                                                "Vocabulary",
                                                                "Grammar",
                                                                "Word order",
                                                                "Pronunciation",
                                                                "Usage",
                                                                "Spelling",
                                                                "Tone",
                                                                "Other")),
                                        "topic", Map.of("type", "string", "description", "Short label, 2-4 words")),
                        "required", List.of("category", "topic"));
        Map<String, Object> input =
                callTool(
                        system,
                        userMessage,
                        toolSpec("analyze_mistake", "Classify the mistake's category and topic", schema));
        return new MistakeAnalysis(String.valueOf(input.get("category")), String.valueOf(input.get("topic")));
    }

    @Override
    public String continueConversation(ConversationRequest request) {
        String scenario =
                request.scenario() == null || request.scenario().isBlank()
                        ? "daily conversation"
                        : request.scenario();
        String system =
                """
                You are a friendly, encouraging conversation partner practicing %s with a learner at
                level %s. Scenario: %s. Keep the conversation natural and flowing — do not stop to
                correct every mistake, just respond the way a real conversation partner would.
                """
                        .formatted(request.languageCode(), request.currentLevel(), scenario);
        List<Map<String, Object>> messages = toMessages(request.history());
        messages.add(userMessage(request.userMessage()));
        return extractText(post(baseBody(system, messages)));
    }

    @Override
    public String summarizeConversation(ConversationSummaryRequest request) {
        String system =
                """
                You are a friendly, encouraging language tutor. Summarize the practice conversation below
                in %s for the learner: mention any mistakes, new vocabulary, and better expressions they
                could use, in a warm and encouraging tone. Keep it to a few sentences.
                """
                        .formatted(request.languageCode());
        List<Map<String, Object>> messages = toMessages(request.history());
        messages.add(userMessage("Please summarize this conversation for me."));
        return extractText(post(baseBody(system, messages)));
    }

    @Override
    public String generateDailyPlan(DailyPlanContext context) {
        String system =
                """
                You are a friendly, encouraging language tutor writing a short (2-3 sentence) motivating
                intro for the learner's plan for today. The schedule below is already fixed — every
                minute and word count was computed by the app, not you. Do not repeat the numbers back
                mechanically; just set an encouraging tone for the session ahead.
                """;
        String userMessage =
                "Total time: %d minutes.\n%s"
                        .formatted(context.totalMinutes(), String.join("\n", context.languageSummaries()));
        return extractText(post(baseBody(system, List.of(userMessage(userMessage)))));
    }

    private List<Map<String, Object>> toMessages(List<ConversationTurn> history) {
        List<Map<String, Object>> messages = new ArrayList<>();
        for (ConversationTurn turn : history) {
            messages.add(Map.of("role", turn.role(), "content", turn.content()));
        }
        return messages;
    }

    private Map<String, Object> userMessage(String content) {
        return Map.of("role", "user", "content", content);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callTool(String system, String userMessage, Map<String, Object> tool) {
        Map<String, Object> body = baseBody(system, List.of(userMessage(userMessage)));
        body.put("tools", List.of(tool));
        body.put("tool_choice", Map.of("type", "tool", "name", tool.get("name")));

        List<Map<String, Object>> content = extractContent(post(body));
        for (Map<String, Object> block : content) {
            if ("tool_use".equals(block.get("type"))) {
                return (Map<String, Object>) block.get("input");
            }
        }
        throw new AIProviderException("AI response did not include the expected tool call");
    }

    private Map<String, Object> baseBody(String system, List<Map<String, Object>> messages) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", properties.model());
        body.put("max_tokens", MAX_TOKENS);
        body.put("system", system);
        body.put("messages", messages);
        return body;
    }

    private Map<String, Object> toolSpec(String name, String description, Map<String, Object> schema) {
        Map<String, Object> tool = new LinkedHashMap<>();
        tool.put("name", name);
        tool.put("description", description);
        tool.put("input_schema", schema);
        return tool;
    }

    private String extractText(Map<String, Object> response) {
        for (Map<String, Object> block : extractContent(response)) {
            if ("text".equals(block.get("type"))) {
                return String.valueOf(block.get("text"));
            }
        }
        throw new AIProviderException("AI response did not include text content");
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> extractContent(Map<String, Object> response) {
        Object content = response.get("content");
        if (!(content instanceof List<?> list)) {
            throw new AIProviderException("AI response had no content");
        }
        return (List<Map<String, Object>>) list;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> post(Map<String, Object> body) {
        RuntimeException lastError = null;
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                Map<String, Object> response = restClient.post().uri(API_URL).body(body).retrieve().body(Map.class);
                if (response == null) {
                    throw new AIProviderException("AI response body was empty");
                }
                logUsage(response);
                return response;
            } catch (RestClientException e) {
                lastError = e;
                log.warn("Claude API call failed (attempt {}/{}): {}", attempt, MAX_ATTEMPTS, e.getMessage());
            }
        }
        throw new AIProviderException("Failed to call Claude API", lastError);
    }

    private void logUsage(Map<String, Object> response) {
        Object usage = response.get("usage");
        if (usage instanceof Map<?, ?> usageMap) {
            log.info(
                    "Claude usage - input_tokens={}, output_tokens={}",
                    usageMap.get("input_tokens"),
                    usageMap.get("output_tokens"));
        }
    }
}
