package com.learnflow.backend.auth.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Created by an operator with SQL (see README); registration only reads it. */
@Entity
@Table(name = "invite_code")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class InviteCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(name = "max_uses", nullable = false)
    private Integer maxUses;

    @Column(name = "expires_at")
    private Instant expiresAt;

    private String note;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public InviteCode(String code, int maxUses, Instant expiresAt, Instant createdAt) {
        this.code = code;
        this.maxUses = maxUses;
        this.expiresAt = expiresAt;
        this.createdAt = createdAt;
    }
}
