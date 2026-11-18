package com.learnflow.backend.curriculum.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "lesson")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Lesson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "content_key", nullable = false, unique = true)
    private String contentKey;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "unit_id")
    private Unit unit;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private Integer position;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContentStatus status;

    @ElementCollection
    @CollectionTable(name = "lesson_item", joinColumns = @JoinColumn(name = "lesson_id"))
    @OrderColumn(name = "position")
    private List<LessonItem> items = new ArrayList<>();

    public Lesson(String contentKey) {
        this.contentKey = contentKey;
    }

    public void update(
            Unit unit, String title, int position, ContentStatus status, List<LessonItem> items) {
        this.unit = unit;
        this.title = title;
        this.position = position;
        this.status = status;
        if (!this.items.equals(items)) {
            this.items.clear();
            this.items.addAll(items);
        }
    }
}
