package com.learnflow.backend.srs.engine;

/**
 * Decides when a word should come up for review again. Deterministic and independent of AI, per
 * {@code plan/phases/00-overview.md} §3 rule 1 — AI never writes to {@code review_schedule}.
 */
public interface SrsAlgorithm {

    SrsState apply(SrsState current, SrsRating rating);
}
