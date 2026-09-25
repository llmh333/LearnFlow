package com.learnflow.backend.exercise;

import com.learnflow.backend.exercise.domain.Exercise;
import com.learnflow.backend.exercise.domain.ExerciseSource;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ExerciseRepository extends JpaRepository<Exercise, Long> {

    Optional<Exercise> findByIdAndUser_Id(Long id, Long userId);

    List<Exercise> findByUser_IdAndLanguage_CodeAndExerciseDateOrderByDisplayOrderAsc(
            Long userId, String languageCode, LocalDate exerciseDate);

    List<Exercise> findByUser_IdAndLanguage_IdAndExerciseDateOrderByDisplayOrderAsc(
            Long userId, Short languageId, LocalDate exerciseDate);

    @Query(
            "SELECT MAX(e.exerciseDate) FROM Exercise e "
                    + "WHERE e.user.id = :userId AND e.language.id = :languageId AND e.source = :source")
    Optional<LocalDate> findMaxExerciseDate(
            @Param("userId") Long userId, @Param("languageId") Short languageId, @Param("source") ExerciseSource source);
}
