package com.learnflow.backend.mistake;

import com.learnflow.backend.mistake.dto.CreateMistakeRequest;
import com.learnflow.backend.mistake.dto.MistakeResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mistakes")
public class MistakeController {

    private final MistakeService mistakeService;

    public MistakeController(MistakeService mistakeService) {
        this.mistakeService = mistakeService;
    }

    @GetMapping
    public List<MistakeResponse> list(
            @AuthenticationPrincipal Long userId,
            @RequestParam(required = false) String language,
            @RequestParam(required = false) String category) {
        return mistakeService.list(userId, language, category);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MistakeResponse create(
            @AuthenticationPrincipal Long userId, @Valid @RequestBody CreateMistakeRequest request) {
        return mistakeService.createOrIncrement(userId, request);
    }

    @GetMapping("/recurring")
    public List<MistakeResponse> recurring(
            @AuthenticationPrincipal Long userId,
            @RequestParam(required = false) String language,
            @RequestParam(defaultValue = "10") int limit) {
        return mistakeService.recurring(userId, language, limit);
    }

    @GetMapping("/categories")
    public List<String> categories() {
        return mistakeService.listCategoryNames();
    }
}
