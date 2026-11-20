package com.learnflow.backend.curriculum;

import com.learnflow.backend.curriculum.dto.response.CourseResponse;
import com.learnflow.backend.curriculum.dto.response.SourceResponse;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Read side of the global curriculum. Content is shared by all users, so no userId here. */
@Service
@Transactional(readOnly = true)
public class CurriculumService {

    private final CourseRepository courseRepository;
    private final ContentSourceRepository sourceRepository;

    public CurriculumService(
            CourseRepository courseRepository, ContentSourceRepository sourceRepository) {
        this.courseRepository = courseRepository;
        this.sourceRepository = sourceRepository;
    }

    // shortcut: lazy-loads units/lessons/items per course (N+1); fine for a few courses, add a
    // fetch
    // join when the tree grows past N5–N3.
    public List<CourseResponse> listCourses() {
        return courseRepository.findAllByOrderByPositionAsc().stream()
                .map(CourseResponse::from)
                .toList();
    }

    public List<SourceResponse> listSources() {
        return sourceRepository.findAllByOrderByNameAsc().stream()
                .map(SourceResponse::from)
                .toList();
    }
}
