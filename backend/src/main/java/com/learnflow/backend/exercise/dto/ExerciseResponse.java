package com.learnflow.backend.exercise.dto;

import com.learnflow.backend.exercise.domain.Exercise;
import com.learnflow.backend.exercise.domain.ExerciseType;
import java.util.List;
import java.util.Map;

/**
 * What the client sees before answering — deliberately omits the answer key
 * ({@code correctTokens}/{@code correctOptionIndex}), which lives only in {@link Exercise#getPayload()}
 * server-side and is revealed only via {@link ExerciseAnswerResponse} after submission.
 */
public record ExerciseResponse(
        Long id,
        String languageCode,
        ExerciseType type,
        String source,
        List<String> shuffledTokens,
        String question,
        List<String> options,
        boolean completed,
        Boolean correct) {

    @SuppressWarnings("unchecked")
    public static ExerciseResponse from(Exercise exercise) {
        Map<String, Object> payload = exercise.getPayload();
        List<String> shuffledTokens =
                exercise.getType() == ExerciseType.SENTENCE_SCRAMBLE
                        ? (List<String>) payload.get("shuffledTokens")
                        : null;
        String question =
                exercise.getType() == ExerciseType.MULTIPLE_CHOICE ? (String) payload.get("question") : null;
        List<String> options =
                exercise.getType() == ExerciseType.MULTIPLE_CHOICE
                        ? (List<String>) payload.get("options")
                        : null;

        return new ExerciseResponse(
                exercise.getId(),
                exercise.getLanguage().getCode(),
                exercise.getType(),
                exercise.getSource().name(),
                shuffledTokens,
                question,
                options,
                exercise.isCompleted(),
                exercise.getCorrect());
    }
}
