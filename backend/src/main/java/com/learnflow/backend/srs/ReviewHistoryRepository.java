package com.learnflow.backend.srs;

import com.learnflow.backend.srs.domain.ReviewHistory;
import com.learnflow.backend.srs.engine.SrsRating;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewHistoryRepository extends JpaRepository<ReviewHistory, Long> {

    List<ReviewHistory> findByVocabulary_IdOrderByReviewedAtDesc(Long vocabularyId);

    List<ReviewHistory> findByStudySessionId(Long studySessionId);

    long countByReviewedAtGreaterThanEqual(Instant since);

    long countByReviewedAtGreaterThanEqualAndRatingNot(Instant since, SrsRating rating);

    @Query(
            "SELECT COUNT(h) FROM ReviewHistory h WHERE h.reviewedAt >= :since AND h.vocabulary.language.code = :languageCode")
    long countByLanguageCodeAndReviewedAtGreaterThanEqual(
            @Param("languageCode") String languageCode, @Param("since") Instant since);

    @Query(
            """
            SELECT COUNT(h) FROM ReviewHistory h
            WHERE h.reviewedAt >= :since AND h.rating <> :excludedRating
              AND h.vocabulary.language.code = :languageCode
            """)
    long countByLanguageCodeAndReviewedAtGreaterThanEqualAndRatingNot(
            @Param("languageCode") String languageCode,
            @Param("since") Instant since,
            @Param("excludedRating") SrsRating excludedRating);

    @Query("SELECT h.reviewedAt FROM ReviewHistory h WHERE h.reviewedAt >= :since")
    List<Instant> findReviewedTimestampsSince(@Param("since") Instant since);
}
