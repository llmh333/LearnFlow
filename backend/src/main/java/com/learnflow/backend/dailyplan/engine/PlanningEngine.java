package com.learnflow.backend.dailyplan.engine;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.IntStream;
import org.springframework.stereotype.Component;

/**
 * Deterministic, AI-free (PROJECT.md §4.7): given the learner's available minutes and each
 * language's due-word count, decides exactly how the time splits — including how many new words
 * to introduce today, answering the open question "cố định / Settings / engine tự tính" with
 * "engine tự tính theo thời gian rảnh" (decision, see plan/phases/00-overview.md §5).
 *
 * <p>Per language: 1) review as many overdue words as fit in {@link #REVIEW_TIME_SHARE} of the
 * language's minutes, 2) spend {@link #NEW_WORD_TIME_SHARE} of what's left on new words, 3) split
 * anything left over between a grammar exercise (targeting the weakest Mistake Book topic, if any)
 * and free AI conversation practice. Steps below {@link #MIN_ITEM_MINUTES} are skipped entirely
 * rather than creating a token 1-minute item.
 */
@Component
public class PlanningEngine {

    private static final double MINUTES_PER_DUE_WORD = 0.5;
    private static final double MINUTES_PER_NEW_WORD = 1.0;
    private static final double REVIEW_TIME_SHARE = 0.4;
    private static final double NEW_WORD_TIME_SHARE = 0.4;
    private static final int MIN_ITEM_MINUTES = 3;

    public DailyPlanDraft plan(int availableMinutes, List<LanguageDemand> demands) {
        if (availableMinutes <= 0 || demands.isEmpty()) {
            return new DailyPlanDraft(0, List.of());
        }

        List<Integer> allocation = allocateMinutes(availableMinutes, demands);
        List<LanguagePlan> languagePlans = new ArrayList<>();
        for (int i = 0; i < demands.size(); i++) {
            languagePlans.add(planForLanguage(demands.get(i), allocation.get(i)));
        }

        int totalUsed = languagePlans.stream().mapToInt(LanguagePlan::minutes).sum();
        return new DailyPlanDraft(totalUsed, languagePlans);
    }

    /** Splits {@code availableMinutes} across languages proportionally to due count (even split if none are due), summing to exactly {@code availableMinutes} via largest-remainder rounding. */
    private List<Integer> allocateMinutes(int availableMinutes, List<LanguageDemand> demands) {
        int n = demands.size();
        long totalDue = demands.stream().mapToLong(LanguageDemand::dueCount).sum();

        double[] raw = new double[n];
        if (totalDue == 0) {
            Arrays.fill(raw, (double) availableMinutes / n);
        } else {
            for (int i = 0; i < n; i++) {
                raw[i] = availableMinutes * (double) demands.get(i).dueCount() / totalDue;
            }
        }

        int[] floors = new int[n];
        int flooredSum = 0;
        for (int i = 0; i < n; i++) {
            floors[i] = (int) Math.floor(raw[i]);
            flooredSum += floors[i];
        }

        int remainder = availableMinutes - flooredSum;
        List<Integer> byLargestFraction =
                IntStream.range(0, n)
                        .boxed()
                        .sorted(
                                (a, b) -> {
                                    double fa = raw[a] - floors[a];
                                    double fb = raw[b] - floors[b];
                                    int cmp = Double.compare(fb, fa);
                                    return cmp != 0 ? cmp : Integer.compare(a, b);
                                })
                        .toList();
        for (int i = 0; i < remainder; i++) {
            floors[byLargestFraction.get(i)]++;
        }

        List<Integer> result = new ArrayList<>(n);
        for (int f : floors) {
            result.add(f);
        }
        return result;
    }

    private LanguagePlan planForLanguage(LanguageDemand demand, int minutes) {
        List<PlanItem> items = new ArrayList<>();
        int remaining = minutes;

        int reviewBudget = (int) Math.floor(minutes * REVIEW_TIME_SHARE);
        int maxReviewableMinutes = (int) Math.floor(demand.dueCount() * MINUTES_PER_DUE_WORD);
        int reviewMinutes = Math.min(reviewBudget, maxReviewableMinutes);
        if (reviewMinutes >= MIN_ITEM_MINUTES) {
            int words = (int) Math.round(reviewMinutes / MINUTES_PER_DUE_WORD);
            items.add(
                    new PlanItem(
                            PlanItemKind.REVIEW_DUE, "Review " + words + " overdue words", reviewMinutes, words));
            remaining -= reviewMinutes;
        }

        int newWordBudget = (int) Math.floor(remaining * NEW_WORD_TIME_SHARE);
        if (newWordBudget >= MIN_ITEM_MINUTES) {
            int words = (int) Math.floor(newWordBudget / MINUTES_PER_NEW_WORD);
            if (words > 0) {
                int newWordMinutes = (int) Math.round(words * MINUTES_PER_NEW_WORD);
                items.add(
                        new PlanItem(
                                PlanItemKind.LEARN_NEW, "Learn " + words + " new words", newWordMinutes, words));
                remaining -= newWordMinutes;
            }
        }

        if (remaining >= MIN_ITEM_MINUTES * 2) {
            int half = remaining / 2;
            String grammarDescription =
                    demand.weakTopic() != null && !demand.weakTopic().isBlank()
                            ? "Grammar exercise: " + demand.weakTopic()
                            : "Grammar exercise";
            items.add(new PlanItem(PlanItemKind.GRAMMAR_EXERCISE, grammarDescription, half, 0));
            items.add(
                    new PlanItem(PlanItemKind.CONVERSATION, "AI conversation practice", remaining - half, 0));
            remaining = 0;
        } else if (remaining >= MIN_ITEM_MINUTES) {
            items.add(new PlanItem(PlanItemKind.CONVERSATION, "AI conversation practice", remaining, 0));
            remaining = 0;
        }

        int usedMinutes = minutes - remaining;
        return new LanguagePlan(demand.languageCode(), demand.languageName(), usedMinutes, items);
    }
}
