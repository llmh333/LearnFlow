package com.learnflow.backend.auth;

import com.learnflow.backend.auth.domain.RefreshToken;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    /** Row lock so two refreshes racing with the same token cannot both rotate it. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query(
            "update RefreshToken t set t.revokedAt = :now"
                    + " where t.familyId = :familyId and t.revokedAt is null")
    int revokeFamily(UUID familyId, Instant now);

    @Modifying
    @Query(
            "update RefreshToken t set t.revokedAt = :now"
                    + " where t.user.id = :userId and t.revokedAt is null")
    int revokeAllForUser(Long userId, Instant now);

    @Modifying
    @Query("delete from RefreshToken t where t.user.id = :userId and t.expiresAt < :now")
    int deleteExpiredForUser(Long userId, Instant now);
}
