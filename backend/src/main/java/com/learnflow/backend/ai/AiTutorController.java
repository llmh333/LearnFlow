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
    public GrammarExplainResponse explainGrammar(@Valid @RequestBody GrammarExplainApiRequest request) {
        return new GrammarExplainResponse(
                aiTutorService.explainGrammar(request.languageCode(), request.question()));
    }

    @PostMapping("/examples/generate")
    public ExamplesResponse generateExamples(@Valid @RequestBody ExampleGenerationApiRequest request) {
        return new ExamplesResponse(aiTutorService.generateExamples(request.languageCode(), request.word()));
    }

    @PostMapping("/sentence/correct")
    public SentenceCorrectionApiResponse correctSentence(
            @Valid @RequestBody SentenceCorrectionApiRequest request) {
        return aiTutorService.correctSentence(request.languageCode(), request.text());
    }

    @GetMapping("/scenarios")
    public List<ScenarioResponse> scenarios(@RequestParam String language) {
        return aiTutorService.scenarios(language);
    }

    @PostMapping("/conversation/message")
    public ConversationMessageResponse startConversation(
            @Valid @RequestBody ConversationMessageRequest request) {
        return aiTutorService.sendMessage(
                null, request.languageCode(), request.scenario(), request.message());
    }

    @PostMapping("/conversation/{id}/message")
    public ConversationMessageResponse continueConversation(
            @PathVariable Long id, @Valid @RequestBody ConversationMessageRequest request) {
        return aiTutorService.sendMessage(id, request.languageCode(), request.scenario(), request.message());
    }

    /**
     * Streams an existing conversation's reply as SSE. Requires an already-started conversation
     * (use {@link #continueConversation} for the first message) — the frontend can't set an
     * Authorization header on a native EventSource, so it consumes this via fetch()+ReadableStream
     * instead, which still works with a GET + Bearer header.
     *
     * <p>Validates the conversation exists <em>synchronously</em>, on the normal request thread,
     * before starting the async SSE task. An exception thrown from inside the background task
     * instead (e.g. during an async error dispatch) bypasses Spring Security's normal
     * authenticated context and surfaces as a misleading 401 rather than 404 — checking up front
     * avoids that path entirely for the common "unknown id" case.
     */
    @GetMapping(value = "/conversation/{id}/stream", produces = "text/event-stream")
    public SseEmitter streamMessage(@PathVariable Long id, @RequestParam String message) {
        aiTutorService.findConversationOrThrow(id);

        SseEmitter emitter = new SseEmitter(65_000L);
        streamingExecutor.execute(
                () -> {
                    try {
                        aiTutorService.streamMessage(
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
    public ConversationSummaryResponse endConversation(@PathVariable Long id) {
        return aiTutorService.endConversation(id);
    }

    @GetMapping("/conversations")
    public List<ConversationListItemResponse> conversations() {
        return aiTutorService.listConversations();
    }

    @GetMapping("/conversations/{id}")
    public ConversationDetailResponse conversation(@PathVariable Long id) {
        return aiTutorService.getConversation(id);
    }
}
