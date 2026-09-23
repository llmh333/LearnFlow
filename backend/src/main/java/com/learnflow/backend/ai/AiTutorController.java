package com.learnflow.backend.ai;

import com.learnflow.backend.ai.dto.ConversationDetailResponse;
import com.learnflow.backend.ai.dto.ConversationListItemResponse;
import com.learnflow.backend.ai.dto.ConversationMessageRequest;
import com.learnflow.backend.ai.dto.ConversationMessageResponse;
import com.learnflow.backend.ai.dto.ConversationSummaryResponse;
import com.learnflow.backend.ai.dto.ExampleGenerationApiRequest;
import com.learnflow.backend.ai.dto.ExamplesResponse;
import com.learnflow.backend.ai.dto.GrammarExplainApiRequest;
import com.learnflow.backend.ai.dto.GrammarExplainResponse;
import com.learnflow.backend.ai.dto.ScenarioResponse;
import com.learnflow.backend.ai.dto.SentenceCorrectionApiRequest;
import com.learnflow.backend.ai.dto.SentenceCorrectionApiResponse;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/ai")
public class AiTutorController {

    /** Personal single-user app — a handful of concurrent virtual threads is plenty for streaming replies. */
    private final ExecutorService streamingExecutor = Executors.newVirtualThreadPerTaskExecutor();

    private final AiTutorService aiTutorService;

    public AiTutorController(AiTutorService aiTutorService) {
        this.aiTutorService = aiTutorService;
    }

    @PostMapping("/grammar/explain")
    public GrammarExplainResponse explainGrammar(
            @AuthenticationPrincipal Long userId, @Valid @RequestBody GrammarExplainApiRequest request) {
        return new GrammarExplainResponse(
                aiTutorService.explainGrammar(userId, request.languageCode(), request.question()));
    }

    @PostMapping("/examples/generate")
    public ExamplesResponse generateExamples(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody ExampleGenerationApiRequest request) {
        return new ExamplesResponse(
                aiTutorService.generateExamples(userId, request.languageCode(), request.word()));
    }

    @PostMapping("/sentence/correct")
    public SentenceCorrectionApiResponse correctSentence(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody SentenceCorrectionApiRequest request) {
        return aiTutorService.correctSentence(userId, request.languageCode(), request.text());
    }

    @GetMapping("/scenarios")
    public List<ScenarioResponse> scenarios(@RequestParam String language) {
        return aiTutorService.scenarios(language);
    }

    @PostMapping("/conversation/message")
    public ConversationMessageResponse startConversation(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody ConversationMessageRequest request) {
        return aiTutorService.sendMessage(
                userId, null, request.languageCode(), request.scenario(), request.message());
    }

    @PostMapping("/conversation/{id}/message")
    public ConversationMessageResponse continueConversation(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @Valid @RequestBody ConversationMessageRequest request) {
        return aiTutorService.sendMessage(
                userId, id, request.languageCode(), request.scenario(), request.message());
    }

    /**
     * Streams an existing conversation's reply as SSE. Requires an already-started conversation
     * (use {@link #continueConversation} for the first message) — the frontend can't set an
     * Authorization header on a native EventSource, so it consumes this via fetch()+ReadableStream
     * instead, which still works with a GET + Bearer header.
     *
     * <p>Validates the conversation exists (and belongs to {@code userId}) <em>synchronously</em>,
     * on the normal request thread, before starting the async SSE task. An exception thrown from
     * inside the background task instead (e.g. during an async error dispatch) bypasses Spring
     * Security's normal authenticated context and surfaces as a misleading 401 rather than 404 —
     * checking up front avoids that path entirely for the common "unknown/foreign id" case. {@code
     * userId} itself is resolved on this same request thread and just captured by the closure below
     * — the background executor never needs its own security context.
     */
    @GetMapping(value = "/conversation/{id}/stream", produces = "text/event-stream")
    public SseEmitter streamMessage(
            @AuthenticationPrincipal Long userId, @PathVariable Long id, @RequestParam String message) {
        aiTutorService.findConversationOrThrow(userId, id);

        SseEmitter emitter = new SseEmitter(65_000L);
        streamingExecutor.execute(
                () -> {
                    try {
                        aiTutorService.streamMessage(
                                userId,
                                id,
                                message,
                                delta -> {
                                    try {
                                        emitter.send(SseEmitter.event().data(delta));
                                    } catch (IOException e) {
                                        emitter.completeWithError(e);
                                    }
                                });
                        emitter.complete();
                    } catch (Exception e) {
                        emitter.completeWithError(e);
                    }
                });
        return emitter;
    }

    @PostMapping("/conversation/{id}/end")
    public ConversationSummaryResponse endConversation(
            @AuthenticationPrincipal Long userId, @PathVariable Long id) {
        return aiTutorService.endConversation(userId, id);
    }

    @GetMapping("/conversations")
    public List<ConversationListItemResponse> conversations(@AuthenticationPrincipal Long userId) {
        return aiTutorService.listConversations(userId);
    }

    @GetMapping("/conversations/{id}")
    public ConversationDetailResponse conversation(
            @AuthenticationPrincipal Long userId, @PathVariable Long id) {
        return aiTutorService.getConversation(userId, id);
    }
}
