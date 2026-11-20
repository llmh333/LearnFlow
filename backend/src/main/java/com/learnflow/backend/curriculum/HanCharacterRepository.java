package com.learnflow.backend.curriculum;

import com.learnflow.backend.curriculum.domain.HanCharacter;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HanCharacterRepository extends JpaRepository<HanCharacter, Long> {}
