package com.learnflow.backend.curriculum;

import com.learnflow.backend.curriculum.domain.GrammarPoint;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GrammarPointRepository extends JpaRepository<GrammarPoint, Long> {}
