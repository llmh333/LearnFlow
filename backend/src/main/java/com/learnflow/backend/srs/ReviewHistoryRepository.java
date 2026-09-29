package com.learnflow.backend.srs;

import com.learnflow.backend.srs.domain.ReviewHistory;
import com.learnflow.backend.srs.engine.SrsRating;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewHistoryRepository extends JpaRepository<ReviewHistory, Long> {

    List<ReviewHistory> findByVocabulary_IdAndUser_IdOrderByReviewedAtDesc(
            Long vocabularyId, Long userId);

    List<ReviewHistory> findByStudySessionIdAndUser_Id(Long studySessionId, Long userId);

    long countByUser_IdAndReviewedAtGreaterThanEqual(Long userId, Instant since);

    long countByUser_IdAndReviewedAtGreaterThanEqualAndRatingNot(
            Long userId, Instant since, SrsRating rating);

    @Query(
            "SELECT COUNT(h) FROM ReviewHistory h WHERE h.user.id = :userId AND h.reviewedAt >= :since AND h.vocabulary.language.code = :languageCode")
    long countByUserIdAndLanguageCodeAndReviewedAtGreaterThanEqual(
            @Param("userId") Long userId,
            @Param("languageCode") String languageCode,
            @Param("since") Instant since);

    @Query(
            """
            SELECT COUNT(h) FROM ReviewHistory h
            WHERE h.user.id = :userId AND h.reviewedAt >= :since AND h.rating <> :excludedRating
              AND h.vocabulary.language.code = :languageCode
            """)
    long countByUserIdAndLanguageCodeAndReviewedAtGreaterThanEqualAndRatingNot(
            @Param("userId") Long userId,
            @Param("languageCode") String languageCode,
            @Param("since") Instant since,
            @Param("excludedRating") SrsRating excludedRating);

    @Query("SELECT h.reviewedAt FROM ReviewHistory h WHERE h.user.id = :userId AND h.reviewedAt >= :since")
    List<Instant> findReviewedTimestampsSince(
            @Param("userId") Long userId, @Param("since") Instant since);

    /** Ids of vocabulary whose very first-ever review (for this user) happened on or after {@code
     * since} — i.e. words newly introduced since then. Deliberately not "reviewCount == 1 today":
     * an "Again" rating can send a brand-new word back into the same day's queue, bumping its
     * reviewCount to 2+ while it's still only 1 "new word learned today". */
    @Query(
            """
            SELECT rh.vocabulary.id FROM ReviewHistory rh
            WHERE rh.user.id = :userId
              AND (:languageCode IS NULL OR rh.vocabulary.language.code = :languageCode)
            GROUP BY rh.vocabulary.id
            HAVING MIN(rh.reviewedAt) >= :since
            """)
    List<Long> findVocabularyIdsFirstReviewedSince(
            @Param("userId") Long userId,
            @Param("languageCode") String languageCode,
            @Param("since") Instant since);
}
