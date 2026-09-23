package com.learnflow.backend.progress;

import java.math.BigDecimal;

/**
 * A word is "mastered" once its review interval and ease factor are both comfortably high — per
 * decision log in {@code plan/phases/00-overview.md}: {@code intervalDays >= 21 && easeFactor >=
 * 2.5}. Pure and deterministic on purpose, same spirit as {@code srs.engine}: it only reads
 * numbers, no persistence.
 */
public final class MasteryPolicy {

    private static final BigDecimal MIN_INTERVAL_DAYS = BigDecimal.valueOf(21);
    private static final BigDecimal MIN_EASE_FACTOR = BigDecimal.valueOf(2.5);

    private MasteryPolicy() {}

    public static boolean isMastered(BigDecimal intervalDays, BigDecimal easeFactor) {
        return intervalDays.compareTo(MIN_INTERVAL_DAYS) >= 0
                && easeFactor.compareTo(MIN_EASE_FACTOR) >= 0;
    }
}
