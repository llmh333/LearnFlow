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
import com.learnflow.backend.ai.dto.SentenceCorrectionApiRequest;
import com.learnflow.backend.ai.dto.SentenceCorrectionApiResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiTutorController {

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
