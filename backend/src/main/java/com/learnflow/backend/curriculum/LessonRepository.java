package com.learnflow.backend.curriculum;

import com.learnflow.backend.curriculum.domain.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LessonRepository extends JpaRepository<Lesson, Long> {}
