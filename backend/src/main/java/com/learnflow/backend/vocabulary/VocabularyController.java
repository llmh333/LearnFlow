package com.learnflow.backend.vocabulary;

import com.learnflow.backend.common.web.PageResponse;
import com.learnflow.backend.vocabulary.dto.VocabularyRequest;
import com.learnflow.backend.vocabulary.dto.VocabularyResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vocabulary")
public class VocabularyController {

    private final VocabularyService vocabularyService;

    public VocabularyController(VocabularyService vocabularyService) {
        this.vocabularyService = vocabularyService;
    }

    @GetMapping
    public PageResponse<VocabularyResponse> list(
            @AuthenticationPrincipal Long userId,
            @RequestParam(required = false) String language,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String tag,
            @PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.from(vocabularyService.list(userId, language, search, tag, pageable));
    }

    @GetMapping("/tags")
    public List<String> tags(@AuthenticationPrincipal Long userId) {
        return vocabularyService.listTagNames(userId);
    }

    @GetMapping("/{id}")
    public VocabularyResponse get(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        return vocabularyService.get(userId, id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VocabularyResponse create(
            @AuthenticationPrincipal Long userId, @Valid @RequestBody VocabularyRequest request) {
        return vocabularyService.create(userId, request);
    }

    @PutMapping("/{id}")
    public VocabularyResponse update(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @Valid @RequestBody VocabularyRequest request) {
        return vocabularyService.update(userId, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        vocabularyService.delete(userId, id);
    }
}
