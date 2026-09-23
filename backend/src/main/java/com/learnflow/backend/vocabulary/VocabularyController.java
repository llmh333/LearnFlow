package com.learnflow.backend.vocabulary;

import com.learnflow.backend.common.web.PageResponse;
import com.learnflow.backend.vocabulary.dto.VocabularyRequest;
import com.learnflow.backend.vocabulary.dto.VocabularyResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
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
            @RequestParam(required = false) String language,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String tag,
            @PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.from(vocabularyService.list(language, search, tag, pageable));
    }

    @GetMapping("/tags")
    public List<String> tags() {
        return vocabularyService.listTagNames();
    }

    @GetMapping("/{id}")
    public VocabularyResponse get(@PathVariable Long id) {
        return vocabularyService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VocabularyResponse create(@Valid @RequestBody VocabularyRequest request) {
        return vocabularyService.create(request);
    }

    @PutMapping("/{id}")
    public VocabularyResponse update(
            @PathVariable Long id, @Valid @RequestBody VocabularyRequest request) {
        return vocabularyService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        vocabularyService.delete(id);
    }
}
