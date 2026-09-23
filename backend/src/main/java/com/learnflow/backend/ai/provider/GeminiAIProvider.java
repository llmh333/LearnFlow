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
 * Calls Google's Generative Language API (Gemini, e.g. a Google AI Studio key) directly via {@link
 * RestClient} (no SDK dependency) — the same integration style as {@link ClaudeAIProvider}, so
 * either can be selected at deploy time via {@code app.ai.provider} with no other code changes
 * (see {@code AiTutorService}, which only depends on the {@link AIProvider} interface). Structured
 * results use Gemini's native controlled-generation JSON mode ({@code responseSchema}) instead of
 * emulating tool-calling.
 */
@Component
@ConditionalOnProperty(prefix = "app.ai", name = "provider", havingValue = "gemini")
public class GeminiAIProvider implements AIProvider {

    private static final Logger log = LoggerFactory.getLogger(GeminiAIProvider.class);
    private static final String API_BASE = "https://generativelanguage.googleapis.com/v1beta/models/";
    private static final String DEFAULT_MODEL = "gemini-2.5-flash";
    private static final int MAX_ATTEMPTS = 2; // 1 retry, same policy as ClaudeAIProvider

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String model;

    public GeminiAIProvider(AIProperties properties, ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.model = properties.model() == null || properties.model().isBlank() ? DEFAULT_MODEL : properties.model();

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(10));
        requestFactory.setReadTimeout(Duration.ofSeconds(properties.timeoutSeconds()));

        this.restClient =
                RestClient.builder()
                        .requestFactory(requestFactory)
                        .defaultHeader("x-goog-api-key", properties.geminiApiKey())
                        .defaultHeader(HttpHeaders.CONTENT_TYPE, "application/json")
                        .build();
    }

    @Override
    public String explainGrammar(GrammarExplainRequest request) {
        String system = AIPrompts.grammarExplain(request.languageCode(), request.currentLevel());
        return extractText(post(baseBody(system, List.of(userContent(request.question())))));
    }

    @Override
    public List<String> generateExamples(ExampleGenerationRequest request) {
        String system =
                AIPrompts.generateExamples(request.word(), request.languageCode(), request.currentLevel());
        Map<String, Object> schema =
                Map.of(
                        "type", "OBJECT",
                        "properties", Map.of("examples", Map.of("type", "ARRAY", "items", Map.of("type", "STRING"))),
                        "required", List.of("examples"));
        Map<String, Object> result = callStructured(system, "Generate examples for: " + request.word(), schema);
        Object examples = result.get("examples");
        return examples instanceof List<?> list ? list.stream().map(String::valueOf).toList() : List.of();
    }

    @Override
    public SentenceCorrection correctSentence(SentenceCorrectionRequest request) {
        String system = AIPrompts.correctSentence(request.languageCode(), request.currentLevel());
        Map<String, Object> schema =
                Map.of(
                        "type", "OBJECT",
                        "properties",
                                Map.of(
                                        "corrected", Map.of("type", "STRING"),
                                        "explanation", Map.of("type", "STRING")),
                        "required", List.of("corrected", "explanation"));
        Map<String, Object> result = callStructured(system, request.text(), schema);
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
                        "type", "OBJECT",
                        "properties",
                                Map.of(
                                        "category",
                                        Map.of(
                                                "type",
                                                "STRING",
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
                                        "topic", Map.of("type", "STRING", "description", "Short label, 2-4 words")),
                        "required", List.of("category", "topic"));
        Map<String, Object> result = callStructured(system, userMessage, schema);
        return new MistakeAnalysis(String.valueOf(result.get("category")), String.valueOf(result.get("topic")));
    }

    @Override
    public String continueConversation(ConversationRequest request) {
        return extractText(post(conversationBody(request)));
    }

    @Override
    public void streamConversation(ConversationRequest request, Consumer<String> onDelta, Runnable onComplete) {
        streamPost(conversationBody(request), onDelta);
        onComplete.run();
    }

    private Map<String, Object> conversationBody(ConversationRequest request) {
        String scenario =
                request.scenario() == null || request.scenario().isBlank()
                        ? "daily conversation"
                        : request.scenario();
        String system = AIPrompts.conversation(request.languageCode(), request.currentLevel(), scenario);
        List<Map<String, Object>> contents = toContents(request.history());
        contents.add(userContent(request.userMessage()));
        return baseBody(system, contents);
    }

    @Override
    public ConversationSummary summarizeConversation(ConversationSummaryRequest request) {
        String system = AIPrompts.summarizeConversation(request.languageCode());
        Map<String, Object> mistakeItemSchema =
                Map.of(
                        "type", "OBJECT",
                        "properties",
                                Map.of(
                                        "category",
                                        Map.of(
                                                "type",
                                                "STRING",
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
                                        "topic", Map.of("type", "STRING"),
                                        "original", Map.of("type", "STRING"),
                                        "corrected", Map.of("type", "STRING"),
                                        "explanation", Map.of("type", "STRING")),
                        "required", List.of("category", "topic", "original", "corrected", "explanation"));
        Map<String, Object> vocabItemSchema =
                Map.of(
                        "type", "OBJECT",
                        "properties",
                                Map.of(
                                        "word", Map.of("type", "STRING"),
                                        "meaningVietnamese", Map.of("type", "STRING")),
                        "required", List.of("word", "meaningVietnamese"));
        Map<String, Object> schema =
                Map.of(
                        "type", "OBJECT",
                        "properties",
                                Map.of(
                                        "overview", Map.of("type", "STRING"),
                                        "mistakes", Map.of("type", "ARRAY", "items", mistakeItemSchema),
                                        "newVocabulary", Map.of("type", "ARRAY", "items", vocabItemSchema),
                                        "betterExpressions", Map.of("type", "ARRAY", "items", Map.of("type", "STRING")),
                                        "grammarProblems", Map.of("type", "ARRAY", "items", Map.of("type", "STRING"))),
                        "required",
                                List.of(
                                        "overview",
                                        "mistakes",
                                        "newVocabulary",
                                        "betterExpressions",
                                        "grammarProblems"));

        List<Map<String, Object>> contents = toContents(request.history());
        contents.add(userContent("Please summarize this conversation for me."));
        Map<String, Object> result = callStructured(system, contents, schema);
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
    public String generateDailyPlan(DailyPlanContext context) {
        String userMessage =
                "Total time: %d minutes.\n%s"
                        .formatted(context.totalMinutes(), String.join("\n", context.languageSummaries()));
        return extractText(post(baseBody(AIPrompts.DAILY_PLAN, List.of(userContent(userMessage)))));
    }

    private List<Map<String, Object>> toContents(List<ConversationTurn> history) {
        List<Map<String, Object>> contents = new ArrayList<>();
        for (ConversationTurn turn : history) {
            String role = "assistant".equals(turn.role()) ? "model" : "user";
            contents.add(Map.of("role", role, "parts", List.of(Map.of("text", turn.content()))));
        }
        return contents;
    }

    private Map<String, Object> userContent(String text) {
        return Map.of("role", "user", "parts", List.of(Map.of("text", text)));
    }

    private Map<String, Object> callStructured(String system, String userMessage, Map<String, Object> schema) {
        return callStructured(system, List.of(userContent(userMessage)), schema);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callStructured(
            String system, List<Map<String, Object>> contents, Map<String, Object> schema) {
        Map<String, Object> body = baseBody(system, contents);
        body.put("generationConfig", Map.of("responseMimeType", "application/json", "responseSchema", schema));
        String json = extractText(post(body));
        return objectMapper.readValue(json, Map.class);
    }

    private Map<String, Object> baseBody(String system, List<Map<String, Object>> contents) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("systemInstruction", Map.of("parts", List.of(Map.of("text", system))));
        body.put("contents", contents);
        return body;
    }

    private String extractText(Map<String, Object> response) {
        Map<String, Object> part = firstPart(response);
        if (part != null && part.get("text") != null) {
            return String.valueOf(part.get("text"));
        }
        throw new AIProviderException("AI response did not include text content");
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> firstPart(Map<String, Object> response) {
        Object candidates = response.get("candidates");
        if (!(candidates instanceof List<?> candidateList) || candidateList.isEmpty()) {
            throw new AIProviderException("AI response had no candidates");
        }
        Map<String, Object> firstCandidate = (Map<String, Object>) candidateList.get(0);
        Object content = firstCandidate.get("content");
        if (!(content instanceof Map<?, ?> contentMap)) {
            return null;
        }
        Object parts = contentMap.get("parts");
        if (!(parts instanceof List<?> partList) || partList.isEmpty()) {
            return null;
        }
        return (Map<String, Object>) partList.get(0);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> post(Map<String, Object> body) {
        String uri = API_BASE + model + ":generateContent";
        RuntimeException lastError = null;
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                Map<String, Object> response = restClient.post().uri(uri).body(body).retrieve().body(Map.class);
                if (response == null) {
                    throw new AIProviderException("AI response body was empty");
                }
                logUsage(response);
                return response;
            } catch (RestClientException e) {
                lastError = e;
                log.warn("Gemini API call failed (attempt {}/{}): {}", attempt, MAX_ATTEMPTS, e.getMessage());
            }
        }
        throw new AIProviderException("Failed to call Gemini API", lastError);
    }

    /**
     * Streams the response body as Gemini's SSE format, calling {@code onDelta} for each text
     * fragment. Retries once on failure, same as {@link #post}.
     */
    private void streamPost(Map<String, Object> body, Consumer<String> onDelta) {
        String uri = API_BASE + model + ":streamGenerateContent?alt=sse";
        RuntimeException lastError = null;
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                restClient
                        .post()
                        .uri(uri)
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
                        "Gemini API streaming call failed (attempt {}/{}): {}",
                        attempt,
                        MAX_ATTEMPTS,
                        e.getMessage());
            }
        }
        throw new AIProviderException("Failed to stream from Gemini API", lastError);
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
                String text = event.path("candidates").path(0).path("content").path("parts").path(0).path("text").asString("");
                if (!text.isEmpty()) {
                    onDelta.accept(text);
                }
            }
        } catch (IOException e) {
            throw new AIProviderException("Failed to read Gemini streaming response", e);
        }
    }

    private void logUsage(Map<String, Object> response) {
        Object usage = response.get("usageMetadata");
        if (usage instanceof Map<?, ?> usageMap) {
            log.info(
                    "Gemini usage - promptTokenCount={}, candidatesTokenCount={}",
                    usageMap.get("promptTokenCount"),
                    usageMap.get("candidatesTokenCount"));
        }
    }
}
