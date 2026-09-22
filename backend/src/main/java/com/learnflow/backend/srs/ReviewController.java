package com.learnflow.backend.srs;

import com.learnflow.backend.srs.dto.DueVocabularyResponse;
import com.learnflow.backend.srs.dto.ReviewHistoryResponse;
import com.learnflow.backend.srs.dto.ReviewSubmitRequest;
import com.learnflow.backend.srs.dto.ReviewSubmitResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/due")
    public List<DueVocabularyResponse> due(
            @RequestParam(required = false) String language,
            @RequestParam(defaultValue = "20") int limit) {
        return reviewService.findDue(language, limit);
    }

    @PostMapping("/{vocabularyId}/submit")
    public ReviewSubmitResponse submit(
            @PathVariable Long vocabularyId, @Valid @RequestBody ReviewSubmitRequest request) {
        return reviewService.submit(
                vocabularyId, request.rating(), request.responseTimeMs(), request.studySessionId());
    }

    @GetMapping("/history/{vocabularyId}")
    public List<ReviewHistoryResponse> history(@PathVariable Long vocabularyId) {
        return reviewService.historyOf(vocabularyId);
    }
}
