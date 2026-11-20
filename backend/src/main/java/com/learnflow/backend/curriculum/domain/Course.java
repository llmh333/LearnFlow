package com.learnflow.backend.curriculum.domain;

import com.learnflow.backend.language.domain.Language;
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
@Table(name = "course")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "content_key", nullable = false, unique = true)
    private String contentKey;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "language_id")
    private Language language;

    /** NULL for courses outside a level framework, e.g. Kana. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "level_id")
    private ProficiencyLevel level;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(nullable = false)
    private Integer position;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContentStatus status;

    @OneToMany(mappedBy = "course")
    @OrderBy("position")
    private List<Unit> units = new ArrayList<>();

    public Course(String contentKey) {
        this.contentKey = contentKey;
    }

    public void update(
            Language language,
            ProficiencyLevel level,
            String title,
            String description,
            int position,
            ContentStatus status) {
        this.language = language;
        this.level = level;
        this.title = title;
        this.description = description;
        this.position = position;
        this.status = status;
    }
}
