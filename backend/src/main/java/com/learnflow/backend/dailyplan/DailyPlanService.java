package com.learnflow.backend.dailyplan;

import com.learnflow.backend.ai.provider.AIProvider;
import com.learnflow.backend.ai.provider.AIProviderException;
import com.learnflow.backend.ai.provider.DailyPlanContext;
import com.learnflow.backend.auth.domain.User;
import com.learnflow.backend.common.error.NotFoundException;
import com.learnflow.backend.dailyplan.domain.DailyPlan;
import com.learnflow.backend.dailyplan.domain.DailyPlanItem;
import com.learnflow.backend.dailyplan.dto.DailyPlanItemResponse;
import com.learnflow.backend.dailyplan.dto.DailyPlanResponse;
import com.learnflow.backend.dailyplan.engine.DailyPlanDraft;
import com.learnflow.backend.dailyplan.engine.LanguageDemand;
import com.learnflow.backend.dailyplan.engine.LanguagePlan;
import com.learnflow.backend.dailyplan.engine.PlanItem;
import com.learnflow.backend.dailyplan.engine.PlanningEngine;
import com.learnflow.backend.language.LanguageService;
import com.learnflow.backend.language.domain.Language;
import com.learnflow.backend.language.dto.LanguageResponse;
import com.learnflow.backend.mistake.MistakeService;
import com.learnflow.backend.mistake.dto.MistakeResponse;
import com.learnflow.backend.srs.ReviewService;
import jakarta.persistence.EntityManager;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Orchestrates "what should I learn today": {@link PlanningEngine} computes every number
 * deterministically first, then {@link AIProvider#generateDailyPlan} only adds a motivating intro
 * sentence on top — never touches minutes or word counts (PROJECT.md §4.7).
 */
@Service
@Transactional
public class DailyPlanService {

    private static final Logger log = LoggerFactory.getLogger(DailyPlanService.class);

    private final PlanningEngine planningEngine;
    private final LanguageService languageService;
    private final ReviewService reviewService;
    private final MistakeService mistakeService;
    private final AIProvider aiProvider;
    private final DailyPlanRepository planRepository;
    private final DailyPlanItemRepository itemRepository;
    private final EntityManager entityManager;
    private final Clock clock;

    public DailyPlanService(
            PlanningEngine planningEngine,
            LanguageService languageService,
            ReviewService reviewService,
            MistakeService mistakeService,
            AIProvider aiProvider,
            DailyPlanRepository planRepository,
            DailyPlanItemRepository itemRepository,
            EntityManager entityManager,
            Clock clock) {
        this.planningEngine = planningEngine;
        this.languageService = languageService;
        this.reviewService = reviewService;
        this.mistakeService = mistakeService;
        this.aiProvider = aiProvider;
        this.planRepository = planRepository;
        this.itemRepository = itemRepository;
        this.entityManager = entityManager;
        this.clock = clock;
    }

    public DailyPlanResponse generate(Long userId, int availableMinutes) {
        List<LanguageResponse> languages = languageService.listAll();
        List<LanguageDemand> demands =
                languages.stream().map(language -> demandFor(userId, language)).toList();

        DailyPlanDraft draft = planningEngine.plan(availableMinutes, demands);
        String intro = tryGenerateIntro(draft);

        LocalDate today = LocalDate.now(clock);
        DailyPlan plan =
                planRepository
                        .findByUser_IdAndPlanDate(userId, today)
                        .map(
                                existing -> {
                                    itemRepository.deleteAllByDailyPlan_Id(existing.getId());
                                    existing.setAvailableMinutes(availableMinutes);
                                    return existing;
                                })
                        .orElseGet(
                                () -> {
                                    User userRef = entityManager.getReference(User.class, userId);
                                    return planRepository.save(
                                            new DailyPlan(userRef, today, availableMinutes, Instant.now(clock)));
                                });
        plan.setIntro(intro);

        Map<String, Short> languageIdByCode =
                languages.stream()
                        .collect(Collectors.toMap(LanguageResponse::code, LanguageResponse::id));

        List<DailyPlanItem> items = new ArrayList<>();
        int order = 0;
        for (LanguagePlan languagePlan : draft.languages()) {
            Language languageRef =
                    entityManager.getReference(
                            Language.class, languageIdByCode.get(languagePlan.languageCode()));
            for (PlanItem item : languagePlan.items()) {
                items.add(
                        new DailyPlanItem(
                                plan, languageRef, item.minutes(), item.kind(), item.description(), order++));
            }
        }
        itemRepository.saveAll(items);

        return DailyPlanResponse.from(plan, items);
    }

    @Transactional(readOnly = true)
    public DailyPlanResponse today(Long userId) {
        LocalDate today = LocalDate.now(clock);
        DailyPlan plan =
                planRepository
                        .findByUser_IdAndPlanDate(userId, today)
                        .orElseThrow(() -> new NotFoundException("No daily plan generated for today yet"));
        List<DailyPlanItem> items = itemRepository.findByDailyPlan_IdOrderByDisplayOrderAsc(plan.getId());
        return DailyPlanResponse.from(plan, items);
    }

    public DailyPlanItemResponse setCompleted(Long userId, Long itemId, boolean completed) {
        DailyPlanItem item =
                itemRepository
                        .findByIdAndDailyPlan_User_Id(itemId, userId)
                        .orElseThrow(() -> new NotFoundException("Daily plan item not found: " + itemId));
        item.setCompleted(completed);
        return DailyPlanItemResponse.from(item);
    }

    private LanguageDemand demandFor(Long userId, LanguageResponse language) {
        long dueCount = reviewService.countDue(userId, language.code());
        String weakTopic = topWeakTopic(userId, language.code());
        return new LanguageDemand(language.code(), language.name(), dueCount, weakTopic);
    }

    private String topWeakTopic(Long userId, String languageCode) {
        List<MistakeResponse> recurring = mistakeService.recurring(userId, languageCode, 1);
        return recurring.isEmpty() ? null : recurring.get(0).topic();
    }

    private String tryGenerateIntro(DailyPlanDraft draft) {
        if (draft.languages().isEmpty()) {
            return null;
        }
        List<String> summaries =
                draft.languages().stream()
                        .map(
                                lp ->
                                        "%s: %d min (%s)"
                                                .formatted(
                                                        lp.languageName(),
                                                        lp.minutes(),
                                                        lp.items().stream()
                                                                .map(PlanItem::description)
                                                                .collect(Collectors.joining(", "))))
                        .toList();
        try {
            return aiProvider.generateDailyPlan(new DailyPlanContext(draft.totalMinutes(), summaries));
        } catch (AIProviderException e) {
            log.warn("Daily plan intro generation failed, continuing without it: {}", e.getMessage());
            return null;
        }
    }
}
