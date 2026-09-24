package com.learnflow.backend.study;

import com.learnflow.backend.study.dto.StartStudySessionRequest;
import com.learnflow.backend.study.dto.StudySessionResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/study-sessions")
public class StudySessionController {

    private final StudySessionService studySessionService;

    public StudySessionController(StudySessionService studySessionService) {
        this.studySessionService = studySessionService;
    }

    @PostMapping("/start")
    public StudySessionResponse start(
            @AuthenticationPrincipal Long userId,
            @RequestBody(required = false) StartStudySessionRequest request) {
        String languageCode = request == null ? null : request.languageCode();
        return studySessionService.start(userId, languageCode);
    }

    @PostMapping("/{id}/end")
    public StudySessionResponse end(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        return studySessionService.end(userId, id);
    }

    /** The caller's most recent not-yet-ended session, if any — 204 if there isn't one. */
    @GetMapping("/active")
    public ResponseEntity<StudySessionResponse> active(
            @AuthenticationPrincipal Long userId, @RequestParam(required = false) String language) {
        return studySessionService
                .findActive(userId, language)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
