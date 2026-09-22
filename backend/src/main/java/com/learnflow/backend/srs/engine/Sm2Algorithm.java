package com.learnflow.backend.srs.engine;

import org.springframework.stereotype.Component;

/**
 * Simplified SM-2, per {@code plan/2026-09-21-mvp-technical-plan.md} §5. Pure and deterministic —
 * no Spring/DB/Clock dependency beyond the {@code @Component} annotation used to wire it as the
 * active {@link SrsAlgorithm} bean.
 *
 * <p>On {@code AGAIN} the interval resets to a short relearning step ({@link
 * #RELEARNING_INTERVAL_DAYS}, ~10 minutes) rather than exactly zero. Zero would multiply to zero
 * forever afterwards ({@code 0 * easeFactor == 0}); a small positive value instead grows back
 * geometrically over a few successful reviews, which is the intended "relearn" behavior.
 */
@Component
public class Sm2Algorithm implements SrsAlgorithm {

    private static final double MIN_EASE_FACTOR = 1.3;
    private static final double RELEARNING_INTERVAL_DAYS = 10.0 / (24 * 60); // 10 minutes
    private static final double FIRST_INTERVAL_DAYS = 1;
    private static final double SECOND_INTERVAL_DAYS = 6;
    private static final double HARD_MULTIPLIER = 1.2;
    private static final double EASY_BONUS = 1.3;

    @Override
    public SrsState apply(SrsState current, SrsRating rating) {
        double newEaseFactor = clampEaseFactor(current.easeFactor() + deltaEaseFactor(rating));
        double newInterval = computeInterval(current, rating, newEaseFactor);

        boolean success = rating != SrsRating.AGAIN;
        int newReviewCount = current.reviewCount() + 1;
        int newSuccessCount = current.successCount() + (success ? 1 : 0);
        int newFailureCount = current.failureCount() + (success ? 0 : 1);
        double newMemoryStrength = computeMemoryStrength(newSuccessCount, newReviewCount);

        return new SrsState(
                round2(newInterval),
                round2(newEaseFactor),
                newReviewCount,
                newSuccessCount,
                newFailureCount,
                round2(newMemoryStrength));
    }

    private double deltaEaseFactor(SrsRating rating) {
        return switch (rating) {
            case AGAIN -> -0.20;
            case HARD -> -0.15;
            case GOOD -> 0.0;
            case EASY -> 0.15;
        };
    }

    private double clampEaseFactor(double value) {
        return Math.max(MIN_EASE_FACTOR, value);
    }

    private double computeInterval(SrsState current, SrsRating rating, double newEaseFactor) {
        if (rating == SrsRating.AGAIN) {
            return RELEARNING_INTERVAL_DAYS;
        }
        if (current.reviewCount() == 0) {
            return FIRST_INTERVAL_DAYS;
        }
        if (current.reviewCount() == 1) {
            return SECOND_INTERVAL_DAYS;
        }
        if (rating == SrsRating.HARD) {
            return current.intervalDays() * HARD_MULTIPLIER;
        }
        if (rating == SrsRating.EASY) {
            return current.intervalDays() * newEaseFactor * EASY_BONUS;
        }
        return current.intervalDays() * newEaseFactor;
    }

    private double computeMemoryStrength(int successCount, int reviewCount) {
        if (reviewCount == 0) {
            return 0;
        }
        return 100.0 * successCount / reviewCount;
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
