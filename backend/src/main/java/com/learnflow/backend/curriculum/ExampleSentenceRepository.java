package com.learnflow.backend.curriculum;

import com.learnflow.backend.curriculum.domain.ExampleSentence;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExampleSentenceRepository extends JpaRepository<ExampleSentence, Long> {}
