package com.learnflow.backend.srs;

import com.learnflow.backend.srs.domain.ReviewSchedule;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewScheduleRepository extends JpaRepository<ReviewSchedule, Long> {

    @Query(
            "SELECT rs FROM ReviewSchedule rs WHERE rs.nextReview <= :now ORDER BY rs.nextReview ASC")
    List<ReviewSchedule> findDue(@Param("now") Instant now, Pageable pageable);

    @Query(
            """
            SELECT rs FROM ReviewSchedule rs
            WHERE rs.vocabulary.language.code = :languageCode AND rs.nextReview <= :now
            ORDER BY rs.nextReview ASC
            """)
    List<ReviewSchedule> findDueByLanguageCode(
            @Param("languageCode") String languageCode, @Param("now") Instant now, Pageable pageable);
}
