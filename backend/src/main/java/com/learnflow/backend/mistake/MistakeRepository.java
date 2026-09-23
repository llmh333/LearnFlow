package com.learnflow.backend.mistake;

import com.learnflow.backend.mistake.domain.Mistake;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MistakeRepository extends JpaRepository<Mistake, Long>, JpaSpecificationExecutor<Mistake> {

    @Query(
            """
            SELECT m FROM Mistake m
            WHERE m.language.code = :languageCode AND m.category.id = :categoryId
              AND LOWER(m.topic) = LOWER(:topic)
            """)
    Optional<Mistake> findExisting(
            @Param("languageCode") String languageCode,
            @Param("categoryId") Integer categoryId,
            @Param("topic") String topic);
}
