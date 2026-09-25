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
 * Calls Groq's OpenAI-compatible Chat Completions API directly via {@link RestClient} (no SDK
 * dependency) — same integration style as {@link ClaudeAIProvider}/{@link GeminiAIProvider}, so
 * any of the three can be selected at deploy time via {@code app.ai.provider} with no other code
 * changes (see {@code AiTutorService}, which only depends on the {@link AIProvider} interface).
 * Structured results use OpenAI-style {@code response_format: json_schema} in strict mode.
 */
@Component
@ConditionalOnProperty(prefix = "app.ai", name = "provider", havingValue = "groq")
public class GroqAIProvider implements AIProvider {

    private static final Logger log = LoggerFactory.getLogger(GroqAIProvider.class);
    private static final String API_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String DEFAULT_MODEL = "openai/gpt-oss-20b";
    private static final int MAX_ATTEMPTS = 2; // 1 retry, same policy as the other providers

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String model;

    public GroqAIProvider(AIProperties properties, ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.model = properties.model() == null || properties.model().isBlank() ? DEFAULT_MODEL : properties.model();

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(10));
        requestFactory.setReadTimeout(Duration.ofSeconds(properties.timeoutSeconds()));

        this.restClient =
                RestClient.builder()
                        .requestFactory(requestFactory)
                        .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + properties.groqApiKey())
                        .defaultHeader(HttpHeaders.CONTENT_TYPE, "application/json")
                        .build();
    }

    @Override
    public String explainGrammar(GrammarExplainRequest request) {
        String system = AIPrompts.grammarExplain(request.languageCode(), request.currentLevel());
        return extractText(post(baseBody(system, List.of(userMessage(request.question())))));
    }

    @Override
    public List<String> generateExamples(ExampleGenerationRequest request) {
        String system =
                AIPrompts.generateExamples(request.word(), request.languageCode(), request.currentLevel());
        Map<String, Object> schema =
                Map.of(
                        "type", "object",
                        "properties",
                                Map.of("examples", Map.of("type", "array", "items", Map.of("type", "string"))),
                        "required", List.of("examples"),
                        "additionalProperties", false);
        Map<String, Object> result =
                callStructured(system, "Generate examples for: " + request.word(), "generate_examples", schema);
        Object examples = result.get("examples");
        return examples instanceof List<?> list ? list.stream().map(String::valueOf).toList() : List.of();
    }

    @Override
    public SentenceCorrection correctSentence(SentenceCorrectionRequest request) {
        String system = AIPrompts.correctSentence(request.languageCode(), request.currentLevel());
        Map<String, Object> schema =
                Map.of(
                        "type", "object",
                        "properties",
                                Map.of(
                                        "corrected", Map.of("type", "string"),
                                        "explanation", Map.of("type", "string")),
                        "required", List.of("corrected", "explanation"),
                        "additionalProperties", false);
        Map<String, Object> result = callStructured(system, request.text(), "correct_sentence", schema);
        return new SentenceCorrection(String.valueOf(result.get("corrected")), String.valueOf(result.get("explanation")));
    }

    @Override
    public MistakeAnalysis analyzeMistake(MistakeAnalysisRequest request) {
        String system = AIPrompts.analyzeMistake(request.languageCode());
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
                                                "type",
                                                "string",
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
                        "required", List.of("category", "topic"),
                        "additionalProperties", false);
        Map<String, Object> result = callStructured(system, userMessage, "analyze_mistake", schema);
        return new MistakeAnalysis(String.valueOf(result.get("category")), String.valueOf(result.get("topic")));
    }

    @Override
    public String continueConversation(ConversationRequest request) {
        return extractText(post(conversationBody(request)));
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
        String system = AIPrompts.conversation(request.languageCode(), request.currentLevel(), scenario);
        List<Map<String, Object>> messages = toMessages(request.history());
        messages.add(userMessage(request.userMessage()));
        return baseBody(system, messages);
    }

    @Override
    public ConversationSummary summarizeConversation(ConversationSummaryRequest request) {
        String system = AIPrompts.summarizeConversation(request.languageCode());
        Map<String, Object> mistakeItemSchema =
                Map.of(
                        "type", "object",
                        "properties",
                                Map.of(
                                        "category",
                                        Map.of(
                                                "type",
                                                "string",
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
                        "required", List.of("category", "topic", "original", "corrected", "explanation"),
                        "additionalProperties", false);
        Map<String, Object> vocabItemSchema =
                Map.of(
                        "type", "object",
                        "properties",
                                Map.of(
                                        "word", Map.of("type", "string"),
                                        "meaningVietnamese", Map.of("type", "string")),
                        "required", List.of("word", "meaningVietnamese"),
                        "additionalProperties", false);
        Map<String, Object> schema =
                Map.of(
                        "type", "object",
                        "properties",
                                Map.of(
                                        "overview", Map.of("type", "string"),
                                        "mistakes", Map.of("type", "array", "items", mistakeItemSchema),
                                        "newVocabulary", Map.of("type", "array", "items", vocabItemSchema),
                                        "betterExpressions", Map.of("type", "array", "items", Map.of("type", "string")),
                                        "grammarProblems", Map.of("type", "array", "items", Map.of("type", "string"))),
                        "required",
                                List.of(
                                        "overview",
                                        "mistakes",
                                        "newVocabulary",
                                        "betterExpressions",
                                        "grammarProblems"),
                        "additionalProperties", false);

        List<Map<String, Object>> messages = toMessages(request.history());
        messages.add(userMessage("Please summarize this conversation for me."));
        Map<String, Object> result = callStructured(system, messages, "summarize_conversation", schema);
        return toConversationSummary(result);
    }

    @SuppressWarnings("unchecked")
    private ConversationSummary toConversationSummary(Map<String, Object> result) {
        List<Map<String, Object>> mistakesRaw = (List<Map<String, Object>>) result.getOrDefault("mistakes", List.of());
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
                (List<Map<String, Object>>) result.getOrDefault("newVocabulary", List.of());
        List<SuggestedVocabulary> newVocabulary =
                vocabRaw.stream()
                        .map(
                                v ->
                                        new SuggestedVocabulary(
                                                String.valueOf(v.get("word")), String.valueOf(v.get("meaningVietnamese"))))
                        .toList();

        List<String> betterExpressions =
                ((List<?>) result.getOrDefault("betterExpressions", List.of())).stream().map(String::valueOf).toList();
        List<String> grammarProblems =
                ((List<?>) result.getOrDefault("grammarProblems", List.of())).stream().map(String::valueOf).toList();

        return new ConversationSummary(
                String.valueOf(result.get("overview")), mistakes, newVocabulary, betterExpressions, grammarProblems);
    }

    @Override
    public List<GeneratedExercise> generateExercises(ExerciseGenerationRequest request) {
        String system = AIPrompts.exerciseGeneration(request.context(), request.count());
        // OpenAI-style strict mode requires every key in "properties" to also be listed in
        // "required" — fields that only apply to one exercise type are made nullable instead
        // (["string", "null"]) rather than actually optional.
        Map<String, Object> exerciseItemSchema =
                Map.of(
                        "type", "object",
                        "properties",
                                Map.of(
                                        "type",
                                        Map.of(
                                                "type", "string",
                                                "enum", List.of("SENTENCE_SCRAMBLE", "MULTIPLE_CHOICE")),
                                        "word", Map.of("type", List.of("string", "null")),
                                        "correctSentence", Map.of("type", List.of("string", "null")),
                                        "question", Map.of("type", List.of("string", "null")),
                                        "options",
                                                Map.of(
                                                        "type", List.of("array", "null"),
                                                        "items", Map.of("type", "string")),
                                        "correctOptionIndex", Map.of("type", List.of("integer", "null"))),
                        "required",
                                List.of(
                                        "type",
                                        "word",
                                        "correctSentence",
                                        "question",
                                        "options",
                                        "correctOptionIndex"),
                        "additionalProperties", false);
        Map<String, Object> schema =
                Map.of(
                        "type", "object",
                        "properties", Map.of("exercises", Map.of("type", "array", "items", exerciseItemSchema)),
                        "required", List.of("exercises"),
                        "additionalProperties", false);
        Map<String, Object> result =
                callStructured(
                        system, "Generate %d exercises.".formatted(request.count()), "generate_exercises", schema);
        return toGeneratedExercises(result);
    }

    @SuppressWarnings("unchecked")
    private List<GeneratedExercise> toGeneratedExercises(Map<String, Object> input) {
        Object raw = input.get("exercises");
        if (!(raw instanceof List<?> list)) {
            return List.of();
        }
        List<GeneratedExercise> result = new ArrayList<>();
        for (Object item : list) {
            if (!(item instanceof Map<?, ?> rawMap)) {
                continue;
            }
            Map<String, Object> m = (Map<String, Object>) rawMap;
            Object options = m.get("options");
            Object correctOptionIndex = m.get("correctOptionIndex");
            result.add(
                    new GeneratedExercise(
                            String.valueOf(m.get("type")),
                            m.get("word") == null ? null : String.valueOf(m.get("word")),
                            m.get("correctSentence") == null ? null : String.valueOf(m.get("correctSentence")),
                            null,
                            m.get("question") == null ? null : String.valueOf(m.get("question")),
                            options instanceof List<?> ol ? ol.stream().map(String::valueOf).toList() : null,
                            correctOptionIndex instanceof Number n ? n.intValue() : null));
        }
        return result;
    }

    @Override
    public String generateDailyPlan(DailyPlanContext context) {
        String userMessage =
                "Total time: %d minutes.\n%s"
                        .formatted(context.totalMinutes(), String.join("\n", context.languageSummaries()));
        return extractText(post(baseBody(AIPrompts.DAILY_PLAN, List.of(userMessage(userMessage)))));
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

    private Map<String, Object> callStructured(
            String system, String userMessage, String schemaName, Map<String, Object> schema) {
        return callStructured(system, List.of(userMessage(userMessage)), schemaName, schema);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callStructured(
            String system, List<Map<String, Object>> messages, String schemaName, Map<String, Object> schema) {
        Map<String, Object> body = baseBody(system, messages);
        body.put(
                "response_format",
                Map.of(
                        "type",
                        "json_schema",
                        "json_schema",
                        Map.of("name", schemaName, "strict", true, "schema", schema)));
        String json = extractText(post(body));
        return objectMapper.readValue(json, Map.class);
    }

    private Map<String, Object> baseBody(String system, List<Map<String, Object>> messages) {
        List<Map<String, Object>> allMessages = new ArrayList<>();
        allMessages.add(Map.of("role", "system", "content", system));
        allMessages.addAll(messages);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("messages", allMessages);
        return body;
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map<String, Object> response) {
        List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
        if (choices == null || choices.isEmpty()) {
            throw new AIProviderException("AI response had no choices");
        }
        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
        Object content = message == null ? null : message.get("content");
        if (content == null) {
            throw new AIProviderException("AI response did not include text content");
        }
        return String.valueOf(content);
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
                log.warn("Groq API call failed (attempt {}/{}): {}", attempt, MAX_ATTEMPTS, e.getMessage());
            }
        }
        throw new AIProviderException("Failed to call Groq API", lastError);
    }

    /**
     * Streams the response body as OpenAI-compatible SSE, calling {@code onDelta} for each text
     * fragment. Retries once on failure, same as {@link #post}.
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
                log.warn("Groq API streaming call failed (attempt {}/{}): {}", attempt, MAX_ATTEMPTS, e.getMessage());
            }
        }
        throw new AIProviderException("Failed to stream from Groq API", lastError);
    }

    private void readSseStream(java.io.InputStream body, Consumer<String> onDelta) {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(body, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (!line.startsWith("data:")) {
                    continue;
                }
                String json = line.substring(5).trim();
                if (json.isEmpty() || "[DONE]".equals(json)) {
                    continue;
                }
                JsonNode event = objectMapper.readTree(json);
                String text = event.path("choices").path(0).path("delta").path("content").asString("");
                if (!text.isEmpty()) {
                    onDelta.accept(text);
                }
            }
        } catch (IOException e) {
            throw new AIProviderException("Failed to read Groq streaming response", e);
        }
    }

    private void logUsage(Map<String, Object> response) {
        Object usage = response.get("usage");
        if (usage instanceof Map<?, ?> usageMap) {
            log.info(
                    "Groq usage - prompt_tokens={}, completion_tokens={}",
                    usageMap.get("prompt_tokens"),
                    usageMap.get("completion_tokens"));
        }
    }
}
