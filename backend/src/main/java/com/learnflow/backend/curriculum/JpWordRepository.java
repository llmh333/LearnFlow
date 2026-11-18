package com.learnflow.backend.curriculum;

import com.learnflow.backend.curriculum.domain.JpWord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JpWordRepository extends JpaRepository<JpWord, Long> {}
