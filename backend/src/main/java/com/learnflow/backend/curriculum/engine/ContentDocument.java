package com.learnflow.backend.curriculum.engine;

import com.learnflow.backend.curriculum.domain.ContentStatus;
import com.learnflow.backend.curriculum.domain.KanaGroup;
import com.learnflow.backend.curriculum.domain.KanaScript;
import com.learnflow.backend.curriculum.domain.ReadingKind;
import java.util.List;
import java.util.Map;

/** Shape of one content YAML file. Every section is optional; format: .claude/rules/content.md. */
public record ContentDocument(
        List<SourceDef> sources,
        List<CourseDef> courses,
        List<UnitDef> units,
        List<KanaDef> kana,
        List<WordDef> words,
        List<CharacterDef> characters,
        List<GrammarDef> grammar,
        List<SentenceDef> sentences) {

    /**
     * Fields every learnable item (kana, word, character, grammar, sentence) has. Its language is
     * the key's first segment ({@code ja.word.taberu} → {@code ja}).
     */
    public sealed interface ItemDef
            permits KanaDef, WordDef, CharacterDef, GrammarDef, SentenceDef {
        String key();

        ContentStatus status();

        String source();
    }

    public record SourceDef(
            String key,
            String name,
            String url,
            String license,
            String licenseUrl,
            String attribution) {}

    public record CourseDef(
            String key,
            String language,
            /** Level code, e.g. n5; empty for courses outside a framework (Kana). */
            String level,
            String title,
            String description,
            Integer position,
            ContentStatus status) {}

    public record UnitDef(
            String key,
            String course,
            Integer position,
            String title,
            String description,
            ContentStatus status,
            List<LessonDef> lessons) {}

    /** A lesson's position is its index in the unit's list, starting at 1. */
    public record LessonDef(String key, String title, ContentStatus status, List<String> items) {}

    public record KanaDef(
            String key,
            String character,
            KanaScript script,
            String romaji,
            KanaGroup group,
            String row,
            Integer position,
            ContentStatus status,
            String source)
            implements ItemDef {}

    public record WordDef(
            String key,
            String written,
            String reading,
            List<String> meaningsVi,
            List<String> meaningsEn,
            List<String> partOfSpeech,
            String level,
            String note,
            List<String> examples,
            ContentStatus status,
            String source,
            String sourceRef)
            implements ItemDef {}

    /** A han character: kanji (ja), hanzi (zh). */
    public record CharacterDef(
            String key,
            String character,
            List<String> hanViet,
            List<String> meaningsVi,
            List<String> meaningsEn,
            /** e.g. {on: [ガク], kun: [まな(ぶ)]}; allowed kinds depend on the language. */
            Map<ReadingKind, List<String>> readings,
            Integer strokeCount,
            String level,
            ContentStatus status,
            String source,
            String sourceRef)
            implements ItemDef {}

    public record GrammarDef(
            String key,
            String pattern,
            String meaningVi,
            String explanationVi,
            String level,
            List<String> examples,
            ContentStatus status,
            String source)
            implements ItemDef {}

    public record SentenceDef(
            String key,
            String text,
            String reading,
            String translationVi,
            String translationEn,
            ContentStatus status,
            String source,
            String sourceRef,
            String sourceAuthor)
            implements ItemDef {}
}
