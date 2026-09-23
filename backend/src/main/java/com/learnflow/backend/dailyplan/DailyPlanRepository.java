package com.learnflow.backend.dailyplan;

import com.learnflow.backend.dailyplan.domain.DailyPlan;
import java.time.LocalDate;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DailyPlanRepository extends JpaRepository<DailyPlan, Long> {

    Optional<DailyPlan> findByPlanDate(LocalDate planDate);
}
