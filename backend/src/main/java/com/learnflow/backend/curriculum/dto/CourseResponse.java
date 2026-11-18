package com.learnflow.backend.curriculum.dto;

import com.learnflow.backend.curriculum.domain.ContentStatus;
import com.learnflow.backend.curriculum.domain.Course;
import com.learnflow.backend.curriculum.domain.CourseLevel;
import com.learnflow.backend.curriculum.domain.Lesson;
import com.learnflow.backend.curriculum.domain.Unit;
import java.util.List;

/** Course tree: course → units → lessons (without lesson items). */
public record CourseResponse(
        Long id,
        String key,
        String language,
        CourseLevel level,
        String title,
        String description,
        ContentStatus status,
        List<UnitResponse> units) {

    public record UnitResponse(
            Long id,
            String key,
            int position,
            String title,
            String description,
            ContentStatus status,
            List<LessonSummaryResponse> lessons) {

        static UnitResponse from(Unit u) {
            return new UnitResponse(
                    u.getId(),
                    u.getContentKey(),
                    u.getPosition(),
                    u.getTitle(),
                    u.getDescription(),
                    u.getStatus(),
                    u.getLessons().stream().map(LessonSummaryResponse::from).toList());
        }
    }

    public record LessonSummaryResponse(
            Long id, String key, int position, String title, ContentStatus status, int itemCount) {

        static LessonSummaryResponse from(Lesson l) {
            return new LessonSummaryResponse(
                    l.getId(),
                    l.getContentKey(),
                    l.getPosition(),
                    l.getTitle(),
                    l.getStatus(),
                    l.getItems().size());
        }
    }

    public static CourseResponse from(Course c) {
        return new CourseResponse(
                c.getId(),
                c.getContentKey(),
                c.getLanguage().getCode(),
                c.getLevel(),
                c.getTitle(),
                c.getDescription(),
                c.getStatus(),
                c.getUnits().stream().map(UnitResponse::from).toList());
    }
}
