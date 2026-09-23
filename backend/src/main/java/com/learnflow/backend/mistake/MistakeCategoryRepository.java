package com.learnflow.backend.mistake;

import com.learnflow.backend.mistake.domain.MistakeCategory;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MistakeCategoryRepository extends JpaRepository<MistakeCategory, Integer> {

    Optional<MistakeCategory> findByNameIgnoreCase(String name);

    List<MistakeCategory> findAllByOrderByNameAsc();
}
