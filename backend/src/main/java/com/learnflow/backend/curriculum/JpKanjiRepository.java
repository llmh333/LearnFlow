package com.learnflow.backend.curriculum;

import com.learnflow.backend.curriculum.domain.JpKanji;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JpKanjiRepository extends JpaRepository<JpKanji, Long> {}
