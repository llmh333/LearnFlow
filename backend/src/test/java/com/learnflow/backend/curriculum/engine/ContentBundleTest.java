package com.learnflow.backend.curriculum.engine;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.learnflow.backend.curriculum.engine.ContentBundle.ContentFile;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

class ContentBundleTest {

    private static final String SOURCES =
            """
            sources:
              - key: ai
                name: AI
                license: Apache-2.0
            """;

    private static final String COURSE =
            """
            courses:
              - key: c
                language: ja
                level: n5
                title: N5
                position: 1
                status: reviewed
            """;

    private static ContentFile file(String yaml) {
        return new ContentFile("test.yaml", yaml);
    }

    private static String word(String key, String status) {
        return """
          - key: %s
            status: %s
            source: ai
            reading: たべる
            meaningsVi: [ăn]
        """
                .formatted(key, status);
    }

    private static String unit(String status, String lessonStatus, String... itemKeys) {
        return """
        units:
          - key: u
            course: c
            position: 1
            title: U
            status: %s
            lessons:
              - key: l
                title: L
                status: %s
                items: [%s]
        """
                .formatted(status, lessonStatus, String.join(", ", itemKeys));
    }

    @Test
    void mergesFilesAndResolvesReferencesAcrossThem() {
        ContentBundle bundle =
                ContentBundle.load(
                        List.of(
                                file(SOURCES),
                                file(COURSE),
                                file(unit("reviewed", "reviewed", "ja.w")),
                                file("words:\n" + word("ja.w", "reviewed"))),
                        false);

        assertThat(bundle.words()).hasSize(1);
        assertThat(ContentBundle.lessonsOf(bundle.units().getFirst()))
                .singleElement()
                .satisfies(l -> assertThat(l.items()).containsExactly("ja.w"));
    }

    @Test
    void withoutDrafts_dropsDraftEntries() {
        ContentBundle bundle =
                ContentBundle.load(
                        List.of(
                                file(SOURCES),
                                file(COURSE),
                                file(unit("reviewed", "draft", "ja.d")),
                                file(
                                        "words:\n"
                                                + word("ja.w", "reviewed")
                                                + word("ja.d", "draft"))),
                        false);

        assertThat(bundle.words()).extracting(ContentDocument.WordDef::key).containsExactly("ja.w");
        assertThat(ContentBundle.lessonsOf(bundle.units().getFirst())).isEmpty();
    }

    @Test
    void withDrafts_keepsDraftEntries() {
        ContentBundle bundle =
                ContentBundle.load(
                        List.of(
                                file(SOURCES),
                                file(COURSE),
                                file(unit("draft", "draft", "ja.d")),
                                file("words:\n" + word("ja.d", "draft"))),
                        true);

        assertThat(bundle.words()).hasSize(1);
        assertThat(ContentBundle.lessonsOf(bundle.units().getFirst())).hasSize(1);
    }

    @Test
    void reviewedLessonReferencingDraftItem_isAnErrorWithoutDrafts() {
        List<ContentFile> files =
                List.of(
                        file(SOURCES),
                        file(COURSE),
                        file(unit("reviewed", "reviewed", "ja.d")),
                        file("words:\n" + word("ja.d", "draft")));

        assertThatThrownBy(() -> ContentBundle.load(files, false))
                .isInstanceOf(ContentValidationException.class)
                .hasMessageContaining("lesson l: unknown or draft item ja.d");
    }

    @Test
    void unquotedNo_isReadAsTheRomajiString() {
        String kana =
                """
                kana:
                  - key: ja.k
                    character: の
                    script: hiragana
                    romaji: no
                    group: basic
                    row: na
                    position: 25
                    status: draft
                    source: ai
                """;

        ContentBundle bundle = ContentBundle.load(List.of(file(SOURCES), file(kana)), true);

        assertThat(bundle.kana().getFirst().romaji()).isEqualTo("no");
    }

    @Test
    void reportsEveryProblemAtOnce() {
        String bad =
                """
                kana:
                  - key: ja.k
                    character: ア
                    script: hiragana
                    romaji: A
                    group: basic
                    row: a
                    position: 1
                    status: draft
                    source: nowhere
                words:
                  - key: ja.k
                    status: draft
                    source: ai
                    reading: 食べる
                    meaningsVi: []
                    examples: [missing]
                characters:
                  - key: ja.kj
                    character: あ
                    meaningsVi: [x]
                    status: draft
                    source: ai
                """;

        assertThatThrownBy(() -> ContentBundle.load(List.of(file(SOURCES), file(bad)), true))
                .isInstanceOfSatisfying(
                        ContentValidationException.class,
                        e ->
                                assertThat(e.getErrors())
                                        .contains(
                                                "duplicate item key ja.k",
                                                "item ja.k: romaji must be lower-case latin"
                                                        + " letters",
                                                "item ja.k: character must be 1–2 HIRAGANA"
                                                        + " characters",
                                                "item ja.k: reading must be kana only",
                                                "item ja.k: meaningsVi must have at least one"
                                                        + " entry",
                                                "item ja.kj: character must be a single han"
                                                        + " character"));
    }

    @Test
    void danglingReferences_areErrors() {
        String words =
                """
                words:
                  - key: ja.w
                    status: draft
                    source: nowhere
                    reading: たべる
                    meaningsVi: [ăn]
                    examples: [missing]
                """;

        assertThatThrownBy(() -> ContentBundle.load(List.of(file(SOURCES), file(words)), true))
                .isInstanceOfSatisfying(
                        ContentValidationException.class,
                        e ->
                                assertThat(e.getErrors())
                                        .contains(
                                                "item ja.w: unknown source nowhere",
                                                "item ja.w: unknown example sentence missing"));
    }

    @Test
    void languageRules_checkKeyPrefixLevelAndReadingKinds() {
        String bad =
                """
                words:
                  - key: xx.word.a
                    status: draft
                    source: ai
                    reading: a
                    meaningsVi: [a]
                  - key: ja.word.b
                    status: draft
                    source: ai
                    reading: たべる
                    meaningsVi: [ăn]
                    level: hsk1
                characters:
                  - key: ja.kanji.c
                    character: 学
                    meaningsVi: [học]
                    readings: {on: [ガク], pinyin: [xué]}
                    status: draft
                    source: ai
                courses:
                  - key: c
                    language: xx
                    title: X
                    position: 1
                    status: draft
                """;

        assertThatThrownBy(() -> ContentBundle.load(List.of(file(SOURCES), file(bad)), true))
                .isInstanceOfSatisfying(
                        ContentValidationException.class,
                        e ->
                                assertThat(e.getErrors())
                                        .contains(
                                                "item xx.word.a: key must start with a known"
                                                        + " language code (ja.…)",
                                                "item ja.word.b: level must be one of [N5, N4, N3,"
                                                        + " N2, N1] for ja",
                                                "item ja.kanji.c: ja has no PINYIN readings",
                                                "course c: unknown language xx"));
    }

    @Test
    void characterReadings_keepTheirKindAndOrder() {
        String yaml =
                """
                characters:
                  - key: ja.kanji.gaku
                    character: 学
                    meaningsVi: [học]
                    readings: {on: [ガク], kun: ["まな(ぶ)"]}
                    level: n5
                    status: draft
                    source: ai
                """;

        ContentDocument.CharacterDef c =
                ContentBundle.load(List.of(file(SOURCES), file(yaml)), true)
                        .characters()
                        .getFirst();

        assertThat(c.readings())
                .containsExactly(
                        java.util.Map.entry(
                                com.learnflow.backend.curriculum.domain.ReadingKind.ON,
                                List.of("ガク")),
                        java.util.Map.entry(
                                com.learnflow.backend.curriculum.domain.ReadingKind.KUN,
                                List.of("まな(ぶ)")));
        assertThat(ContentBundle.levelCode(c.level())).isEqualTo("N5");
    }

    @Test
    void unknownField_isAParseError() {
        assertThatThrownBy(() ->
                        ContentBundle.load(
                                List.of(file("sources:\n  - key: a\n    nmae: typo\n")), true))
                .isInstanceOf(ContentValidationException.class)
                .hasMessageContaining("cannot parse");
    }

    /** CI guard: the real content must import in prod mode (no drafts) as well as in local mode. */
    @Test
    void shippedContent_isValidWithAndWithoutDrafts() throws IOException {
        Resource[] resources =
                new PathMatchingResourcePatternResolver()
                        .getResources("classpath*:content/**/*.yaml");
        List<ContentFile> files = new ArrayList<>();
        for (Resource r : resources) {
            files.add(
                    new ContentFile(
                            r.getDescription(), r.getContentAsString(StandardCharsets.UTF_8)));
        }
        assertThat(files).isNotEmpty();

        ContentBundle bundle = ContentBundle.load(files, true);
        assertThat(bundle.kana()).hasSize(208);
        assertThat(bundle.characters()).hasSize(103);
        ContentBundle.load(files, false);
    }
}
