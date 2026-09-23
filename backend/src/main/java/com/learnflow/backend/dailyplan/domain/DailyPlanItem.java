package com.learnflow.backend.dailyplan.domain;

import com.learnflow.backend.dailyplan.engine.PlanItemKind;
import com.learnflow.backend.language.domain.Language;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "daily_plan_item")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DailyPlanItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "daily_plan_id", nullable = false)
    private DailyPlan dailyPlan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "language_id")
    private Language language;

    @Column(nullable = false)
    private int minutes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PlanItemKind kind;

    @Column(nullable = false, columnDefinition = "text")
    private String description;

    /** Reserved for linking to a specific vocabulary/mistake later — unused for now. */
    @Column(name = "target_ref")
    private Long targetRef;

    @Setter
    @Column(nullable = false)
    private boolean completed;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    public DailyPlanItem(
            DailyPlan dailyPlan,
            Language language,
            int minutes,
            PlanItemKind kind,
            String description,
            int displayOrder) {
        this.dailyPlan = dailyPlan;
        this.language = language;
        this.minutes = minutes;
        this.kind = kind;
        this.description = description;
        this.completed = false;
        this.displayOrder = displayOrder;
    }
}
