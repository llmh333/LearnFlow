package com.learnflow.backend.ai.provider;

import com.learnflow.backend.ai.context.LearnerContext;

public record ExerciseGenerationRequest(LearnerContext context, int count) {}
