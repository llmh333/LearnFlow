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
    private Word word;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "han_character_id")
    private HanCharacter hanCharacter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grammar_point_id")
    private GrammarPoint grammarPoint;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sentence_id")
    private ExampleSentence sentence;

    /**
     * @param target a {@link Kana}, {@link Word}, {@link HanCharacter}, {@link GrammarPoint} or
     *     {@link ExampleSentence}
     */
    public static LessonItem of(Object target) {
        LessonItem item = new LessonItem();
        switch (target) {
            case Kana k -> item.kana = k;
            case Word w -> item.word = w;
            case HanCharacter h -> item.hanCharacter = h;
            case GrammarPoint g -> item.grammarPoint = g;
            case ExampleSentence s -> item.sentence = s;
            default -> throw new IllegalArgumentException("Not a lesson item: " + target);
        }
        return item;
    }
}
