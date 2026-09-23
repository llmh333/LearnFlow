package com.learnflow.backend.dailyplan;

import com.learnflow.backend.dailyplan.domain.DailyPlanItem;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DailyPlanItemRepository extends JpaRepository<DailyPlanItem, Long> {

    List<DailyPlanItem> findByDailyPlan_IdOrderByDisplayOrderAsc(Long dailyPlanId);

    void deleteAllByDailyPlan_Id(Long dailyPlanId);

    /** Ownership check for {@code PATCH /api/daily-plan/item/{id}} — an item has no direct
     * {@code user_id}, so this traverses to its parent plan's owner. */
    Optional<DailyPlanItem> findByIdAndDailyPlan_User_Id(Long id, Long userId);
}
