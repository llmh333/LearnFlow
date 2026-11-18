package com.learnflow.backend.curriculum;

import com.learnflow.backend.curriculum.domain.Kana;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KanaRepository extends JpaRepository<Kana, Long> {}
