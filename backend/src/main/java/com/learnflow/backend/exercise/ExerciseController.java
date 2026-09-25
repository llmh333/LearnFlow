package com.learnflow.backend.exercise;

import com.learnflow.backend.exercise.dto.ExerciseAnswerRequest;
import com.learnflow.backend.exercise.dto.ExerciseAnswerResponse;
import com.learnflow.backend.exercise.dto.ExerciseResponse;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/exercises")
public class ExerciseController {

    private final ExerciseService exerciseService;

    public ExerciseController(ExerciseService exerciseService) {
        this.exerciseService = exerciseService;
    }

    @GetMapping("/today")
    public List<ExerciseResponse> today(
            @AuthenticationPrincipal Long userId, @RequestParam String language) {
        return exerciseService.getToday(userId, language);
    }

    @PatchMapping("/{id}/answer")
    public ExerciseAnswerResponse submitAnswer(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @RequestBody ExerciseAnswerRequest request) {
        return exerciseService.submitAnswer(userId, id, request);
    }
}
