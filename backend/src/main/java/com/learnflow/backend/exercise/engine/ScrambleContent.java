package com.learnflow.backend.exercise.engine;

import java.util.List;

public record ScrambleContent(List<String> correctTokens, List<String> shuffledTokens) {}
