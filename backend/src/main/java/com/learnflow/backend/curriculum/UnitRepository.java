package com.learnflow.backend.curriculum;

import com.learnflow.backend.curriculum.domain.Unit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UnitRepository extends JpaRepository<Unit, Long> {}
