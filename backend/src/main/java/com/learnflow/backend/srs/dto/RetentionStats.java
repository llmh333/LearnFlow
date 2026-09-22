package com.learnflow.backend.srs.dto;

/** {@code successCount / totalCount} over the requested window, per {@code PROJECT.md} §4.6. */
public record RetentionStats(long successCount, long totalCount) {

    public double rate() {
        return totalCount == 0 ? 0.0 : (double) successCount / totalCount;
    }
}
