package com.learnflow.backend.curriculum.domain;

import com.learnflow.backend.language.domain.Language;
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
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "han_character")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class HanCharacter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "content_key", nullable = false, unique = true)
    private String contentKey;

    @Column(nullable = false)
    private String character;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "meanings_vi", nullable = false, columnDefinition = "text[]")
    private List<String> meaningsVi = new ArrayList<>();

    /** Sino-Vietnamese readings in upper case, e.g. HỌC for 学. */
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "han_viet", nullable = false, columnDefinition = "text[]")
    private List<String> hanViet = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "meanings_en", nullable = false, columnDefinition = "text[]")
    private List<String> meaningsEn = new ArrayList<>();

    @ElementCollection
    @CollectionTable(
            name = "han_character_reading",
            joinColumns = @JoinColumn(name = "han_character_id"))
    @OrderColumn(name = "position")
    private List<HanCharacterReading> readings = new ArrayList<>();

    @Column(name = "stroke_count")
    private Short strokeCount;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "language_id")
    private Language language;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "level_id")
    private ProficiencyLevel level;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContentStatus status;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "source_id")
    private ContentSource source;

    @Column(name = "source_ref")
    private String sourceRef;

    public HanCharacter(String contentKey) {
        this.contentKey = contentKey;
    }
}
