package com.learnflow.backend.dailyplan;

import com.learnflow.backend.dailyplan.domain.DailyPlanItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DailyPlanItemRepository extends JpaRepository<DailyPlanItem, Long> {

    List<DailyPlanItem> findByDailyPlan_IdOrderByDisplayOrderAsc(Long dailyPlanId);

    void deleteAllByDailyPlan_Id(Long dailyPlanId);
}
