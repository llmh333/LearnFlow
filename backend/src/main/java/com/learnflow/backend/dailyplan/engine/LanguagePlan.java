package com.learnflow.backend.dailyplan.engine;

import java.util.List;

/** {@code minutes} is the sum of its items — may be a little less than the raw allocation share if leftover minutes were too small to form another item. */
public record LanguagePlan(String languageCode, String languageName, int minutes, List<PlanItem> items) {}
