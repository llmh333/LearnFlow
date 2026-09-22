package com.learnflow.backend.srs;

import com.learnflow.backend.srs.domain.ReviewHistory;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewHistoryRepository extends JpaRepository<ReviewHistory, Long> {

    List<ReviewHistory> findByVocabularyIdOrderByReviewedAtDesc(Long vocabularyId);
}
