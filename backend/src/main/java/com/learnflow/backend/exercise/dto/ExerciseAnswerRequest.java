package com.learnflow.backend.exercise.dto;

import java.util.List;

/** Only the field matching the exercise's type is expected to be set. */
public record ExerciseAnswerRequest(List<String> submittedTokens, Integer selectedOptionIndex) {}
