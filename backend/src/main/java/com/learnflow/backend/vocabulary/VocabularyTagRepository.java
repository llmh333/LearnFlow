package com.learnflow.backend.vocabulary;

import com.learnflow.backend.vocabulary.domain.VocabularyTag;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VocabularyTagRepository extends JpaRepository<VocabularyTag, Integer> {

    Optional<VocabularyTag> findByName(String name);

    List<VocabularyTag> findAllByOrderByNameAsc();
}
