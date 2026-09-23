package com.learnflow.backend.study;

import com.learnflow.backend.auth.domain.User;
import com.learnflow.backend.common.error.NotFoundException;
import com.learnflow.backend.language.LanguageService;
import com.learnflow.backend.language.domain.Language;
import com.learnflow.backend.srs.ReviewService;
import com.learnflow.backend.srs.dto.SessionSummary;
import com.learnflow.backend.study.domain.StudySession;
import com.learnflow.backend.study.dto.StudySessionResponse;
import jakarta.persistence.EntityManager;
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
    private final EntityManager entityManager;
    private final Clock clock;

    public StudySessionService(
            StudySessionRepository repository,
            LanguageService languageService,
            ReviewService reviewService,
            EntityManager entityManager,
            Clock clock) {
        this.repository = repository;
        this.languageService = languageService;
        this.reviewService = reviewService;
        this.entityManager = entityManager;
        this.clock = clock;
    }

    public StudySessionResponse start(Long userId, String languageCode) {
        Language language =
                (languageCode == null || languageCode.isBlank())
                        ? null
                        : languageService.getByCode(languageCode);
        User userRef = entityManager.getReference(User.class, userId);
        StudySession session = new StudySession(userRef, language, Instant.now(clock));
        return StudySessionResponse.from(repository.save(session));
    }

    public StudySessionResponse end(Long userId, Long id) {
        StudySession session =
                repository
                        .findByIdAndUser_Id(id, userId)
                        .orElseThrow(() -> new NotFoundException("Study session not found: " + id));

        if (session.getEndedAt() == null) {
            SessionSummary summary = reviewService.summarizeSession(userId, id);
            session.setWordsReviewed(summary.wordsReviewed());
            session.setWordsLearned(summary.wordsLearned());
            session.setMistakesCount(summary.mistakesCount());
            session.setEndedAt(Instant.now(clock));
        }
        return StudySessionResponse.from(session);
    }

    @Transactional(readOnly = true)
    public List<StudySessionResponse> listBetween(
            Long userId, String languageCode, Instant from, Instant to) {
        return repository.findBetween(userId, languageCode, from, to).stream()
                .map(StudySessionResponse::from)
                .toList();
    }
}
