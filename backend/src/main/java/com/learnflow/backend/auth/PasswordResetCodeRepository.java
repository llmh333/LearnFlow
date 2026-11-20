package com.learnflow.backend.auth;

import com.learnflow.backend.auth.domain.PasswordResetCode;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface PasswordResetCodeRepository extends JpaRepository<PasswordResetCode, Long> {

    /** The live code, row-locked so parallel guesses cannot skip the attempt counter. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<PasswordResetCode> findFirstByUser_IdAndConsumedAtIsNullOrderByCreatedAtDesc(
            Long userId);

    Optional<PasswordResetCode> findFirstByUser_IdOrderByCreatedAtDesc(Long userId);

    long countByUser_IdAndCreatedAtAfter(Long userId, Instant since);

    @Modifying
    @Query(
            "update PasswordResetCode c set c.consumedAt = :now"
                    + " where c.user.id = :userId and c.consumedAt is null")
    int consumeAllForUser(Long userId, Instant now);

    @Modifying
    @Query("delete from PasswordResetCode c where c.user.id = :userId and c.createdAt < :before")
    int deleteOlderThan(Long userId, Instant before);
}
