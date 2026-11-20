package com.learnflow.backend.ai;

import com.learnflow.backend.ai.domain.AiUsage;
import java.time.LocalDate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AiUsageRepository extends JpaRepository<AiUsage, AiUsage.Key> {

    /** Serialises quota checks per user until the transaction ends. */
    @Query(value = "SELECT 1 FROM (SELECT pg_advisory_xact_lock(:userId)) AS l", nativeQuery = true)
    Integer lockUser(@Param("userId") long userId);

    @Query(
            value =
                    "SELECT COALESCE(SUM(call_count), 0) FROM ai_usage"
                            + " WHERE user_id = :userId AND local_date = :day",
            nativeQuery = true)
    long totalCalls(@Param("userId") long userId, @Param("day") LocalDate day);

    @Modifying
    @Query(
            value =
                    "INSERT INTO ai_usage (user_id, local_date, feature, call_count)"
                            + " VALUES (:userId, :day, :feature, 1)"
                            + " ON CONFLICT (user_id, local_date, feature)"
                            + " DO UPDATE SET call_count = ai_usage.call_count + 1",
            nativeQuery = true)
    void increment(
            @Param("userId") long userId,
            @Param("day") LocalDate day,
            @Param("feature") String feature);
}
