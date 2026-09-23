package com.learnflow.backend.srs;

import com.learnflow.backend.srs.domain.ReviewSchedule;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewScheduleRepository extends JpaRepository<ReviewSchedule, Long> {

    Optional<ReviewSchedule> findByVocabularyIdAndUser_Id(Long vocabularyId, Long userId);

    @Query(
            """
            SELECT rs FROM ReviewSchedule rs
            WHERE rs.user.id = :userId AND rs.nextReview <= :now
            ORDER BY rs.nextReview ASC
            """)
    List<ReviewSchedule> findDueByUserId(
            @Param("userId") Long userId, @Param("now") Instant now, Pageable pageable);

    @Query(
            """
            SELECT rs FROM ReviewSchedule rs
            WHERE rs.user.id = :userId AND rs.vocabulary.language.code = :languageCode
              AND rs.nextReview <= :now
            ORDER BY rs.nextReview ASC
            """)
    List<ReviewSchedule> findDueByUserIdAndLanguageCode(
            @Param("userId") Long userId,
            @Param("languageCode") String languageCode,
            @Param("now") Instant now,
            Pageable pageable);

    long countByUser_IdAndNextReviewLessThanEqual(Long userId, Instant now);

    @Query(
            "SELECT COUNT(rs) FROM ReviewSchedule rs WHERE rs.user.id = :userId AND rs.vocabulary.language.code = :languageCode AND rs.nextReview <= :now")
    long countByUserIdAndLanguageCode(
            @Param("userId") Long userId,
            @Param("languageCode") String languageCode,
            @Param("now") Instant now);

    long countByUser_IdAndReviewCount(Long userId, int reviewCount);

    @Query(
            "SELECT COUNT(rs) FROM ReviewSchedule rs WHERE rs.user.id = :userId AND rs.vocabulary.language.code = :languageCode AND rs.reviewCount = 0")
    long countNewByUserIdAndLanguageCode(
            @Param("userId") Long userId, @Param("languageCode") String languageCode);

    List<ReviewSchedule> findAllByUser_Id(Long userId);

    List<ReviewSchedule> findAllByUser_IdAndVocabulary_Language_Code(Long userId, String languageCode);
}
