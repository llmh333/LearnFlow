package com.learnflow.backend.curriculum.dto.response;

import com.learnflow.backend.curriculum.domain.JlptLevel;

/** How many dictionary words a level has; {@code level} null = words without a JLPT level. */
public record LevelCountResponse(JlptLevel level, long wordCount) {}
