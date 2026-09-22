package com.learnflow.backend.ai.context;

import java.util.List;

/**
 * The limited slice of the learner's data an AI prompt actually needs (PROJECT.md §7: "Không gửi
 * toàn bộ database cho AI. Chỉ lấy context liên quan.").
 */
public record LearnerContext(String languageCode, String currentLevel, List<String> weakWords) {}
