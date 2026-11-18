package com.learnflow.backend.curriculum;

import com.learnflow.backend.curriculum.dto.CourseResponse;
import com.learnflow.backend.curriculum.dto.SourceResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/curriculum")
public class CurriculumController {

    private final CurriculumService curriculumService;

    public CurriculumController(CurriculumService curriculumService) {
        this.curriculumService = curriculumService;
    }

    @GetMapping("/courses")
    public List<CourseResponse> listCourses() {
        return curriculumService.listCourses();
    }

    /**
     * Public: backs the "data sources & licences" page, which the licences require to be visible.
     */
    @GetMapping("/sources")
    public List<SourceResponse> listSources() {
        return curriculumService.listSources();
    }
}
