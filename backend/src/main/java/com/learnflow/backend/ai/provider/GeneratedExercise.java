package com.learnflow.backend.ai.provider;

import java.util.List;

/**
 * One exercise as returned by the AI, before {@code exercise.ExerciseService} maps it into an
 * {@code Exercise} entity. Fields irrelevant to {@code type} are null — for
 * {@code SENTENCE_SCRAMBLE} only {@code word}/{@code correctSentence} are used (the backend does
 * its own tokenizing/shuffling via {@code SentenceScrambleGenerator} rather than trusting the AI's
 * shuffle, so {@code shuffledWords} here is informational only and not used for grading); for
 * {@code MULTIPLE_CHOICE}, {@code question}/{@code options}/{@code correctOptionIndex} are used
 * directly since the distractor meanings are the AI's own invention.
 */
public record GeneratedExercise(
        String type,
        String word,
        String correctSentence,
        List<String> shuffledWords,
        String question,
        List<String> options,
        Integer correctOptionIndex) {}
