package com.learnflow.backend.vocabulary;

import com.learnflow.backend.vocabulary.domain.Vocabulary;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface VocabularyRepository
        extends JpaRepository<Vocabulary, Long>, JpaSpecificationExecutor<Vocabulary> {

    Optional<Vocabulary> findByIdAndUser_Id(Long id, Long userId);
}
