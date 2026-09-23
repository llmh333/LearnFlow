package com.learnflow.backend.srs.engine;

/**
 * The SRS state of a single word, independent of persistence. {@code intervalDays} is the gap
 * until the next review, expressed in days (a fraction for the sub-day relearning step after an
 * {@code AGAIN}). {@code memoryStrength} is a 0-100 display value derived from the success rate —
 * it never feeds back into scheduling.
 */
public record SrsState(
        double intervalDays,
        double easeFactor,
        int reviewCount,
        int successCount,
        int failureCount,
        double memoryStrength) {

    public static SrsState initial() {
        return new SrsState(0, 2.5, 0, 0, 0, 0);
    }
}
