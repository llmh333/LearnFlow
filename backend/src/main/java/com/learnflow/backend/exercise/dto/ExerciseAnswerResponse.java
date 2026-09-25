package com.learnflow.backend.exercise.dto;

import com.learnflow.backend.exercise.domain.Exercise;
import com.learnflow.backend.exercise.domain.ExerciseType;
import java.util.List;
import java.util.Map;

/** Returned only after the learner submits an answer — this is the one response allowed to
 * reveal the answer key, for feedback display. */
public record ExerciseAnswerResponse(
        Long id, boolean correct, List<String> correctTokens, Integer correctOptionIndex) {

    @SuppressWarnings("unchecked")
    public static ExerciseAnswerResponse from(Exercise exercise, boolean correct) {
        Map<String, Object> payload = exercise.getPayload();
        List<String> correctTokens =
                exercise.getType() == ExerciseType.SENTENCE_SCRAMBLE
                        ? (List<String>) payload.get("correctTokens")
                        : null;
        Integer correctOptionIndex =
                exercise.getType() == ExerciseType.MULTIPLE_CHOICE
                        ? ((Number) payload.get("correctOptionIndex")).intValue()
                        : null;
        return new ExerciseAnswerResponse(exercise.getId(), correct, correctTokens, correctOptionIndex);
    }
}
