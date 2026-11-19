package com.learnflow.backend.curriculum.api.v1;

import com.learnflow.backend.common.web.ApiPaths;
import com.learnflow.backend.curriculum.CurriculumService;
import com.learnflow.backend.curriculum.dto.CourseResponse;
import com.learnflow.backend.curriculum.dto.SourceResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiPaths.V1.Curriculum.BASE)
public class CurriculumController {

    private final CurriculumService curriculumService;

    public CurriculumController(CurriculumService curriculumService) {
        this.curriculumService = curriculumService;
    }

    @GetMapping(ApiPaths.V1.Curriculum.COURSES)
    public List<CourseResponse> listCourses() {
        return curriculumService.listCourses();
    }

    /**
     * Public: backs the "data sources & licences" page, which the licences require to be visible.
     */
    @GetMapping(ApiPaths.V1.Curriculum.SOURCES)
    public List<SourceResponse> listSources() {
        return curriculumService.listSources();
    }
}
