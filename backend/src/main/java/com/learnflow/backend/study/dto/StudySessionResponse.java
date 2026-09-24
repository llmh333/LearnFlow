package com.learnflow.backend.study.dto;

import com.learnflow.backend.language.dto.LanguageResponse;
import com.learnflow.backend.srs.dto.SessionSummary;
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

    /**
     * For a session that hasn't ended yet, the entity's own wordsReviewed/wordsLearned/
     * mistakesCount are still 0 (only set by {@code StudySessionService.end}). This overload
     * reports live numbers computed from {@code review_history} instead, so a client resuming an
     * in-progress session (e.g. after a page refresh) sees accurate progress.
     */
    public static StudySessionResponse from(StudySession session, SessionSummary summary) {
        return new StudySessionResponse(
                session.getId(),
                session.getLanguage() == null ? null : LanguageResponse.from(session.getLanguage()),
                session.getStartedAt(),
                session.getEndedAt(),
                summary.wordsReviewed(),
                summary.wordsLearned(),
                summary.mistakesCount());
    }
}
