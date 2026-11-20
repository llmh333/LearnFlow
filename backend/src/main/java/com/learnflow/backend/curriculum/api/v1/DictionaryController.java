package com.learnflow.backend.curriculum.api.v1;

import com.learnflow.backend.common.web.ApiPaths;
import com.learnflow.backend.common.web.PageResponse;
import com.learnflow.backend.curriculum.DictionaryService;
import com.learnflow.backend.curriculum.dto.response.LevelCountResponse;
import com.learnflow.backend.curriculum.dto.response.WordDetailResponse;
import com.learnflow.backend.curriculum.dto.response.WordSummaryResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiPaths.V1.Dictionary.BASE)
public class DictionaryController {

    private final DictionaryService dictionaryService;

    public DictionaryController(DictionaryService dictionaryService) {
        this.dictionaryService = dictionaryService;
    }

    /** {@code ?q=&level=N5&page=0&size=20}; every parameter is optional. */
    @GetMapping(ApiPaths.V1.Dictionary.WORDS)
    public PageResponse<WordSummaryResponse> searchWords(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String level,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return dictionaryService.search(q, level, page, size);
    }

    @GetMapping(ApiPaths.V1.Dictionary.WORD)
    public WordDetailResponse getWord(@PathVariable Long id) {
        return dictionaryService.getWord(id);
    }

    @GetMapping(ApiPaths.V1.Dictionary.LEVELS)
    public List<LevelCountResponse> countByLevel() {
        return dictionaryService.countByLevel();
    }
}
