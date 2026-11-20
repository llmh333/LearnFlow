package com.learnflow.backend.curriculum.domain;

import jakarta.persistence.Embeddable;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AccessLevel;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** One slot of a lesson. Exactly one target is set (the DB enforces it with a CHECK). */
@Embeddable
@Getter
@EqualsAndHashCode
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LessonItem {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kana_id")
    private Kana kana;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "word_id")
    private JpWord word;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kanji_id")
    private JpKanji kanji;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grammar_point_id")
    private GrammarPoint grammarPoint;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sentence_id")
    private ExampleSentence sentence;

    /**
     * @param target a {@link Kana}, {@link JpWord}, {@link JpKanji}, {@link GrammarPoint} or {@link
     *     ExampleSentence}
     */
    public static LessonItem of(Object target) {
        LessonItem item = new LessonItem();
        switch (target) {
            case Kana k -> item.kana = k;
            case JpWord w -> item.word = w;
            case JpKanji k -> item.kanji = k;
            case GrammarPoint g -> item.grammarPoint = g;
            case ExampleSentence s -> item.sentence = s;
            default -> throw new IllegalArgumentException("Not a lesson item: " + target);
        }
        return item;
    }
}
