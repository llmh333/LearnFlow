package com.learnflow.backend.study;

import com.learnflow.backend.study.dto.StartStudySessionRequest;
import com.learnflow.backend.study.dto.StudySessionResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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
}
