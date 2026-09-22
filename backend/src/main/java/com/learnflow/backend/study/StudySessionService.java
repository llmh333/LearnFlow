package com.learnflow.backend.study;

import com.learnflow.backend.common.error.NotFoundException;
import com.learnflow.backend.language.LanguageService;
import com.learnflow.backend.language.domain.Language;
import com.learnflow.backend.srs.ReviewService;
import com.learnflow.backend.srs.dto.SessionSummary;
import com.learnflow.backend.study.domain.StudySession;
import com.learnflow.backend.study.dto.StudySessionResponse;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class StudySessionService {

    private final StudySessionRepository repository;
    private final LanguageService languageService;
    private final ReviewService reviewService;
    private final Clock clock;

    public StudySessionService(
            StudySessionRepository repository,
            LanguageService languageService,
            ReviewService reviewService,
            Clock clock) {
        this.repository = repository;
        this.languageService = languageService;
        this.reviewService = reviewService;
        this.clock = clock;
    }

    public StudySessionResponse start(String languageCode) {
        Language language =
                (languageCode == null || languageCode.isBlank())
                        ? null
                        : languageService.getByCode(languageCode);
        StudySession session = new StudySession(language, Instant.now(clock));
        return StudySessionResponse.from(repository.save(session));
    }

    public StudySessionResponse end(Long id) {
        StudySession session =
                repository
                        .findById(id)
                        .orElseThrow(() -> new NotFoundException("Study session not found: " + id));

        if (session.getEndedAt() == null) {
            SessionSummary summary = reviewService.summarizeSession(id);
            session.setWordsReviewed(summary.wordsReviewed());
            session.setWordsLearned(summary.wordsLearned());
            session.setMistakesCount(summary.mistakesCount());
            session.setEndedAt(Instant.now(clock));
        }
        return StudySessionResponse.from(session);
    }

    @Transactional(readOnly = true)
    public List<StudySessionResponse> listBetween(String languageCode, Instant from, Instant to) {
        return repository.findBetween(languageCode, from, to).stream()
                .map(StudySessionResponse::from)
                .toList();
    }
}
