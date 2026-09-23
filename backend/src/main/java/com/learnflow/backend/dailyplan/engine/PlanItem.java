package com.learnflow.backend.dailyplan.engine;

/** {@code wordCount} is only meaningful for {@code REVIEW_DUE}/{@code LEARN_NEW} (0 otherwise). */
public record PlanItem(PlanItemKind kind, String description, int minutes, int wordCount) {}
