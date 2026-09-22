package com.learnflow.backend.study.dto;

import com.learnflow.backend.language.dto.LanguageResponse;
import com.learnflow.backend.study.domain.StudySession;
import java.time.Instant;

public record StudySessionResponse(
        Long id,
        LanguageResponse language,
        Instant startedAt,
        Instant endedAt,
        int wordsReviewed,
        int wordsLearned,
        int mistakesCount) {

    public static StudySessionResponse from(StudySession session) {
        return new StudySessionResponse(
                session.getId(),
                session.getLanguage() == null ? null : LanguageResponse.from(session.getLanguage()),
                session.getStartedAt(),
                session.getEndedAt(),
                session.getWordsReviewed(),
                session.getWordsLearned(),
                session.getMistakesCount());
    }
}
