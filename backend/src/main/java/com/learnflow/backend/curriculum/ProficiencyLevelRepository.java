package com.learnflow.backend.curriculum;

import com.learnflow.backend.curriculum.domain.ProficiencyLevel;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProficiencyLevelRepository extends JpaRepository<ProficiencyLevel, Short> {

    List<ProficiencyLevel> findByLanguage_CodeOrderByRankAsc(String languageCode);
}
