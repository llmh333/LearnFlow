package com.learnflow.backend.study;

import com.learnflow.backend.study.domain.StudySession;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StudySessionRepository extends JpaRepository<StudySession, Long> {

    Optional<StudySession> findByIdAndUser_Id(Long id, Long userId);

    @Query(
            """
            SELECT s FROM StudySession s
            WHERE s.user.id = :userId AND s.startedAt >= :from AND s.startedAt <= :to
              AND (:languageCode IS NULL OR s.language.code = :languageCode)
            ORDER BY s.startedAt DESC
            """)
    List<StudySession> findBetween(
            @Param("userId") Long userId,
            @Param("languageCode") String languageCode,
            @Param("from") Instant from,
            @Param("to") Instant to);

    /**
     * The most recent not-yet-ended session for this user, scoped to the same language a new
     * session would be scoped to (a null languageCode only matches a session that was itself
     * started with no language, mirroring {@code StudySessionService.start}'s null-language
     * behavior — it must not match a *different* specific language's open session).
     */
    @Query(
            """
            SELECT s FROM StudySession s
            WHERE s.user.id = :userId AND s.endedAt IS NULL
              AND (:languageCode IS NULL OR s.language.code = :languageCode)
              AND (:languageCode IS NOT NULL OR s.language IS NULL)
            ORDER BY s.startedAt DESC
            """)
    List<StudySession> findActive(
            @Param("userId") Long userId, @Param("languageCode") String languageCode, Pageable pageable);
}
