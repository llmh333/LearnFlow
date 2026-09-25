package com.learnflow.backend.exercise.engine;

import java.util.List;

public record ChoiceContent(String question, List<String> options, int correctOptionIndex) {}
