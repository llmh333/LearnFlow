package com.learnflow.backend.curriculum;

import com.learnflow.backend.curriculum.domain.Course;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseRepository extends JpaRepository<Course, Long> {

    List<Course> findAllByOrderByPositionAsc();
}
