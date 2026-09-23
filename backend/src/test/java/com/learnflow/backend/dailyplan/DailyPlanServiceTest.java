package com.learnflow.backend.dailyplan;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.learnflow.backend.ai.provider.AIProvider;
import com.learnflow.backend.ai.provider.AIProviderException;
import com.learnflow.backend.auth.domain.User;
import com.learnflow.backend.common.error.NotFoundException;
import com.learnflow.backend.dailyplan.domain.DailyPlan;
import com.learnflow.backend.dailyplan.dto.DailyPlanResponse;
import com.learnflow.backend.dailyplan.engine.PlanningEngine;
import com.learnflow.backend.language.LanguageService;
import com.learnflow.backend.language.dto.LanguageResponse;
import com.learnflow.backend.mistake.MistakeService;
import com.learnflow.backend.mistake.dto.MistakeResponse;
import com.learnflow.backend.srs.ReviewService;
import jakarta.persistence.EntityManager;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Uses the real {@link PlanningEngine} (it's pure — no need to mock it) with mocked data sources,
 * so this mainly proves the AI intro failure path never breaks plan generation — the exact
 * numbers are already covered by {@code PlanningEngineTest}.
 */
@ExtendWith(MockitoExtension.class)
class DailyPlanServiceTest {

    private static final Instant NOW = Instant.parse("2026-01-01T00:00:00Z");
    private static final Clock FIXED_CLOCK = Clock.fixed(NOW, ZoneOffset.UTC);
    private static final Long USER_ID = 1L;

    @Mock private LanguageService languageService;
    @Mock private ReviewService reviewService;
    @Mock private MistakeService mistakeService;
    @Mock private AIProvider aiProvider;
    @Mock private DailyPlanRepository planRepository;
    @Mock private DailyPlanItemRepository itemRepository;
    @Mock private EntityManager entityManager;

    private DailyPlanService service;

    @BeforeEach
    void setUp() {
        service =
                new DailyPlanService(
                        new PlanningEngine(),
                        languageService,
                        reviewService,
                        mistakeService,
                        aiProvider,
                        planRepository,
                        itemRepository,
                        entityManager,
                        FIXED_CLOCK);
    }

    @Test
    void generate_aiProviderFails_stillReturnsAPlanWithoutIntro() {
        LanguageResponse english = new LanguageResponse((short) 1, "en", "English");
        when(languageService.listAll()).thenReturn(List.of(english));
        when(reviewService.countDue(USER_ID, "en")).thenReturn(10L);
        when(mistakeService.recurring(USER_ID, "en", 1)).thenReturn(List.of());
        when(aiProvider.generateDailyPlan(any())).thenThrow(new AIProviderException("boom"));
        when(planRepository.findByUser_IdAndPlanDate(USER_ID, LocalDate.now(FIXED_CLOCK)))
                .thenReturn(Optional.empty());
        when(planRepository.save(any(DailyPlan.class))).thenAnswer(inv -> inv.getArgument(0));
        when(entityManager.getReference(com.learnflow.backend.language.domain.Language.class, (short) 1))
                .thenReturn(null);
        when(entityManager.getReference(User.class, USER_ID)).thenReturn(null);

        DailyPlanResponse response = service.generate(USER_ID, 45);

        assertThat(response).isNotNull();
        assertThat(response.intro()).isNull();
        assertThat(response.items()).isNotEmpty();
        assertThat(response.availableMinutes()).isEqualTo(45);
    }

    @Test
    void generate_usesTopRecurringMistakeAsWeakTopicForGrammarExercise() {
        LanguageResponse english = new LanguageResponse((short) 1, "en", "English");
        when(languageService.listAll()).thenReturn(List.of(english));
        when(reviewService.countDue(USER_ID, "en")).thenReturn(0L);
        when(mistakeService.recurring(USER_ID, "en", 1))
                .thenReturn(
                        List.of(
                                new MistakeResponse(
                                        1L, null, null, "Grammar", "Past tense", "orig", "fixed", "why", 5, NOW)));
        when(aiProvider.generateDailyPlan(any())).thenReturn("You've got this!");
        when(planRepository.findByUser_IdAndPlanDate(USER_ID, LocalDate.now(FIXED_CLOCK)))
                .thenReturn(Optional.empty());
        when(planRepository.save(any(DailyPlan.class))).thenAnswer(inv -> inv.getArgument(0));
        when(entityManager.getReference(com.learnflow.backend.language.domain.Language.class, (short) 1))
                .thenReturn(null);
        when(entityManager.getReference(User.class, USER_ID)).thenReturn(null);

        DailyPlanResponse response = service.generate(USER_ID, 30);

        assertThat(response.intro()).isEqualTo("You've got this!");
        assertThat(response.items())
                .anySatisfy(
                        item -> {
                            if ("GRAMMAR_EXERCISE".equals(item.kind())) {
                                assertThat(item.description()).contains("Past tense");
                            }
                        });
    }

    @Test
    void today_noPlanForToday_throwsNotFound() {
        when(planRepository.findByUser_IdAndPlanDate(USER_ID, LocalDate.now(FIXED_CLOCK)))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.today(USER_ID)).isInstanceOf(NotFoundException.class);
    }
}
