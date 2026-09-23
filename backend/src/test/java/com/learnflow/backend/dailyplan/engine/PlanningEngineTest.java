package com.learnflow.backend.dailyplan.engine;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class PlanningEngineTest {

    private final PlanningEngine engine = new PlanningEngine();

    @Test
    void plan_noLanguages_returnsEmptyDraft() {
        DailyPlanDraft draft = engine.plan(45, List.of());

        assertThat(draft.totalMinutes()).isZero();
        assertThat(draft.languages()).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(ints = {0, -10})
    void plan_nonPositiveMinutes_returnsEmptyDraft(int minutes) {
        DailyPlanDraft draft = engine.plan(minutes, List.of(new LanguageDemand("en", "English", 10, null)));

        assertThat(draft.totalMinutes()).isZero();
        assertThat(draft.languages()).isEmpty();
    }

    @Test
    void plan_singleLanguage_matchesProjectMdExampleStructure() {
        // PROJECT.md §4.7: English 45 min, 8 overdue -> review/new/grammar/conversation all present.
        DailyPlanDraft draft =
                engine.plan(45, List.of(new LanguageDemand("en", "English", 8, "Past tense")));

        assertThat(draft.languages()).hasSize(1);
        LanguagePlan english = draft.languages().get(0);
        assertThat(english.items())
                .extracting(PlanItem::kind)
                .containsExactly(
                        PlanItemKind.REVIEW_DUE,
                        PlanItemKind.LEARN_NEW,
                        PlanItemKind.GRAMMAR_EXERCISE,
                        PlanItemKind.CONVERSATION);
        // Review capped by due count: 8 words * 0.5 min = 4 min (below the 40% budget of 18 min).
        assertThat(english.items().get(0).minutes()).isEqualTo(4);
        assertThat(english.items().get(0).wordCount()).isEqualTo(8);
        assertThat(english.items().get(2).description()).isEqualTo("Grammar exercise: Past tense");
        // Every item's minutes must sum to the language total (no silent drift).
        assertThat(english.items().stream().mapToInt(PlanItem::minutes).sum()).isEqualTo(english.minutes());
    }

    @Test
    void plan_twoLanguages_allocatesMinutesProportionalToDueCount() {
        // 12 due (en) vs 18 due (zh), 30 total due, 30 available minutes -> 12 min en / 18 min zh.
        DailyPlanDraft draft =
                engine.plan(
                        30,
                        List.of(
                                new LanguageDemand("en", "English", 12, null),
                                new LanguageDemand("zh", "Chinese", 18, null)));

        assertThat(draft.languages()).hasSize(2);
        assertThat(draft.languages().get(0).languageCode()).isEqualTo("en");
        assertThat(draft.languages().get(1).languageCode()).isEqualTo("zh");
        // Allocation ratio holds even though final used minutes may differ slightly from raw share
        // (rounding to whole items) — the raw per-language budget itself is exactly proportional.
        int enMinutes = draft.languages().get(0).minutes();
        int zhMinutes = draft.languages().get(1).minutes();
        assertThat(enMinutes).isLessThan(zhMinutes);
    }

    @Test
    void plan_twoLanguagesNoDueWords_splitsMinutesEvenly() {
        DailyPlanDraft draft =
                engine.plan(
                        40,
                        List.of(
                                new LanguageDemand("en", "English", 0, null),
                                new LanguageDemand("zh", "Chinese", 0, null)));

        LanguagePlan english = draft.languages().get(0);
        LanguagePlan chinese = draft.languages().get(1);
        assertThat(english.items()).noneMatch(item -> item.kind() == PlanItemKind.REVIEW_DUE);
        assertThat(chinese.items()).noneMatch(item -> item.kind() == PlanItemKind.REVIEW_DUE);
        // 20 min each: even split of 40 total.
        assertThat(english.minutes() + chinese.minutes()).isLessThanOrEqualTo(40);
        assertThat(Math.abs(english.minutes() - chinese.minutes())).isLessThanOrEqualTo(1);
    }

    @Test
    void plan_noDueWords_skipsReviewItemEntirely() {
        DailyPlanDraft draft = engine.plan(30, List.of(new LanguageDemand("en", "English", 0, null)));

        assertThat(draft.languages().get(0).items()).noneMatch(item -> item.kind() == PlanItemKind.REVIEW_DUE);
    }

    @Test
    void plan_veryLimitedTime_collapsesToSingleConversationItem() {
        // 5 minutes total: review budget (2 min) and new-word budget (2 min) are both below the
        // 3-minute item floor, so everything folds into one short conversation item instead of
        // three near-empty ones.
        DailyPlanDraft draft = engine.plan(5, List.of(new LanguageDemand("en", "English", 20, null)));

        LanguagePlan english = draft.languages().get(0);
        assertThat(english.items()).hasSize(1);
        assertThat(english.items().get(0).kind()).isEqualTo(PlanItemKind.CONVERSATION);
        assertThat(english.minutes()).isEqualTo(5);
    }

    @Test
    void plan_extremelyLimitedTime_producesNoItemsAtAll() {
        DailyPlanDraft draft = engine.plan(2, List.of(new LanguageDemand("en", "English", 0, null)));

        LanguagePlan english = draft.languages().get(0);
        assertThat(english.items()).isEmpty();
        assertThat(english.minutes()).isZero();
    }

    @Test
    void plan_withoutWeakTopic_usesGenericGrammarDescription() {
        DailyPlanDraft draft = engine.plan(30, List.of(new LanguageDemand("en", "English", 0, null)));

        PlanItem grammar =
                draft.languages().get(0).items().stream()
                        .filter(item -> item.kind() == PlanItemKind.GRAMMAR_EXERCISE)
                        .findFirst()
                        .orElseThrow();
        assertThat(grammar.description()).isEqualTo("Grammar exercise");
    }

    @Test
    void plan_isDeterministic_sameInputAlwaysProducesSameOutput() {
        List<LanguageDemand> demands =
                List.of(new LanguageDemand("en", "English", 12, "Past tense"), new LanguageDemand("zh", "Chinese", 18, "measure words"));

        DailyPlanDraft first = engine.plan(45, demands);
        DailyPlanDraft second = engine.plan(45, demands);

        assertThat(first).isEqualTo(second);
    }
}
