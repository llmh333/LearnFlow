package com.learnflow.backend.curriculum.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "unit")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Unit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "content_key", nullable = false, unique = true)
    private String contentKey;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id")
    private Course course;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(nullable = false)
    private Integer position;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContentStatus status;

    @OneToMany(mappedBy = "unit")
    @OrderBy("position")
    private List<Lesson> lessons = new ArrayList<>();

    public Unit(String contentKey) {
        this.contentKey = contentKey;
    }

    public void update(
            Course course, String title, String description, int position, ContentStatus status) {
        this.course = course;
        this.title = title;
        this.description = description;
        this.position = position;
        this.status = status;
    }
}
