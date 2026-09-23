package com.learnflow.backend.vocabulary;

import com.learnflow.backend.vocabulary.domain.Vocabulary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface VocabularyRepository
        extends JpaRepository<Vocabulary, Long>, JpaSpecificationExecutor<Vocabulary> {}
