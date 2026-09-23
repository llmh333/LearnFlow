package com.learnflow.backend.ai.provider;

import com.learnflow.backend.ai.AIProperties;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Calls the Anthropic Messages API directly via {@link RestClient} (no SDK dependency). Structured
 * results (examples list, sentence correction, mistake analysis, conversation summary) use
 * Claude's tool-use forcing instead of parsing free text, per {@code plan/phases/phase-5-ai-tutor.md}.
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
    private final ObjectMapper objectMapper;

    public ClaudeAIProvider(AIProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;

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
        Map<String, Object> body = conversationBody(request);
        return extractText(post(body));
    }

    @Override
    public void streamConversation(ConversationRequest request, Consumer<String> onDelta, Runnable onComplete) {
        Map<String, Object> body = conversationBody(request);
        body.put("stream", true);
        streamPost(body, onDelta);
        onComplete.run();
    }

    private Map<String, Object> conversationBody(ConversationRequest request) {
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
        return baseBody(system, messages);
    }

    @Override
    public ConversationSummary summarizeConversation(ConversationSummaryRequest request) {
        String system =
                """
                You are a friendly, encouraging language tutor. Summarize the practice conversation below
                in %s for the learner, in a warm and encouraging tone. Respond only via the
                summarize_conversation tool. "mistakes" should only include genuinely notable errors (skip
                if there were none). "newVocabulary" meanings must be written in Vietnamese, regardless of
                the language practiced.
                """
                        .formatted(request.languageCode());
        Map<String, Object> mistakeItemSchema =
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
                                        "topic", Map.of("type", "string"),
                                        "original", Map.of("type", "string"),
                                        "corrected", Map.of("type", "string"),
                                        "explanation", Map.of("type", "string")),
                        "required", List.of("category", "topic", "original", "corrected", "explanation"));
        Map<String, Object> vocabItemSchema =
                Map.of(
                        "type", "object",
                        "properties",
                                Map.of(
                                        "word", Map.of("type", "string"),
                                        "meaningVietnamese", Map.of("type", "string")),
                        "required", List.of("word", "meaningVietnamese"));
        Map<String, Object> schema =
                Map.of(
                        "type", "object",
                        "properties",
                                Map.of(
                                        "overview", Map.of("type", "string"),
                                        "mistakes", Map.of("type", "array", "items", mistakeItemSchema),
                                        "newVocabulary", Map.of("type", "array", "items", vocabItemSchema),
                                        "betterExpressions",
                                                Map.of("type", "array", "items", Map.of("type", "string")),
                                        "grammarProblems",
                                                Map.of("type", "array", "items", Map.of("type", "string"))),
                        "required",
                                List.of(
                                        "overview",
                                        "mistakes",
                                        "newVocabulary",
                                        "betterExpressions",
                                        "grammarProblems"));

        List<Map<String, Object>> messages = toMessages(request.history());
        messages.add(userMessage("Please summarize this conversation for me."));
        Map<String, Object> body = baseBody(system, messages);
        body.put("tools", List.of(toolSpec("summarize_conversation", "Return the structured summary", schema)));
        body.put("tool_choice", Map.of("type", "tool", "name", "summarize_conversation"));

        Map<String, Object> input = extractToolInput(post(body), "summarize_conversation");
        return toConversationSummary(input);
    }

    @SuppressWarnings("unchecked")
    private ConversationSummary toConversationSummary(Map<String, Object> input) {
        List<Map<String, Object>> mistakesRaw = (List<Map<String, Object>>) input.getOrDefault("mistakes", List.of());
        List<ConversationMistake> mistakes =
                mistakesRaw.stream()
                        .map(
                                m ->
                                        new ConversationMistake(
                                                String.valueOf(m.get("category")),
                                                String.valueOf(m.get("topic")),
                                                String.valueOf(m.get("original")),
                                                String.valueOf(m.get("corrected")),
                                                String.valueOf(m.get("explanation"))))
                        .toList();

        List<Map<String, Object>> vocabRaw =
                (List<Map<String, Object>>) input.getOrDefault("newVocabulary", List.of());
        List<SuggestedVocabulary> newVocabulary =
                vocabRaw.stream()
                        .map(
                                v ->
                                        new SuggestedVocabulary(
                                                String.valueOf(v.get("word")), String.valueOf(v.get("meaningVietnamese"))))
                        .toList();

        List<String> betterExpressions =
                ((List<?>) input.getOrDefault("betterExpressions", List.of()))
                        .stream().map(String::valueOf).toList();
        List<String> grammarProblems =
                ((List<?>) input.getOrDefault("grammarProblems", List.of())).stream().map(String::valueOf).toList();

        return new ConversationSummary(
                String.valueOf(input.get("overview")), mistakes, newVocabulary, betterExpressions, grammarProblems);
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

    private Map<String, Object> callTool(String system, String userMessage, Map<String, Object> tool) {
        Map<String, Object> body = baseBody(system, List.of(userMessage(userMessage)));
        body.put("tools", List.of(tool));
        body.put("tool_choice", Map.of("type", "tool", "name", tool.get("name")));
        return extractToolInput(post(body), (String) tool.get("name"));
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
    private Map<String, Object> extractToolInput(Map<String, Object> response, String toolName) {
        for (Map<String, Object> block : extractContent(response)) {
            if ("tool_use".equals(block.get("type")) && toolName.equals(block.get("name"))) {
                return (Map<String, Object>) block.get("input");
            }
        }
        throw new AIProviderException("AI response did not include the expected tool call: " + toolName);
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

    /**
     * Streams the response body as Anthropic's SSE format, calling {@code onDelta} for each
     * {@code content_block_delta} text fragment. Retries once on failure, same as {@link #post}.
     */
    private void streamPost(Map<String, Object> body, Consumer<String> onDelta) {
        RuntimeException lastError = null;
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                restClient
                        .post()
                        .uri(API_URL)
                        .body(body)
                        .exchange(
                                (request, response) -> {
                                    readSseStream(response.getBody(), onDelta);
                                    return null;
                                });
                return;
            } catch (RestClientException e) {
                lastError = e;
                log.warn(
                        "Claude API streaming call failed (attempt {}/{}): {}",
                        attempt,
                        MAX_ATTEMPTS,
                        e.getMessage());
            }
        }
        throw new AIProviderException("Failed to stream from Claude API", lastError);
    }

    private void readSseStream(java.io.InputStream body, Consumer<String> onDelta) {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(body, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (!line.startsWith("data:")) {
                    continue;
                }
                String json = line.substring(5).trim();
                if (json.isEmpty()) {
                    continue;
                }
                JsonNode event = objectMapper.readTree(json);
                String type = event.path("type").asString("");
                if ("content_block_delta".equals(type)) {
                    JsonNode delta = event.path("delta");
                    if ("text_delta".equals(delta.path("type").asString(""))) {
                        onDelta.accept(delta.path("text").asString(""));
                    }
                } else if ("message_stop".equals(type)) {
                    return;
                }
            }
        } catch (IOException e) {
            throw new AIProviderException("Failed to read Claude streaming response", e);
        }
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
