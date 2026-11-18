package com.learnflow.backend.auth;

import com.learnflow.backend.auth.domain.InviteCode;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

public interface InviteCodeRepository extends JpaRepository<InviteCode, Long> {

    /** Row lock so two registrations racing for the last use cannot both succeed. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<InviteCode> findByCode(String code);
}
