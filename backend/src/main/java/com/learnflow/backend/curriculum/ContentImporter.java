package com.learnflow.backend.curriculum;

import com.learnflow.backend.curriculum.domain.ContentSource;
import com.learnflow.backend.curriculum.domain.Course;
import com.learnflow.backend.curriculum.domain.ExampleSentence;
import com.learnflow.backend.curriculum.domain.GrammarPoint;
import com.learnflow.backend.curriculum.domain.JpKanji;
import com.learnflow.backend.curriculum.domain.JpWord;
import com.learnflow.backend.curriculum.domain.Kana;
import com.learnflow.backend.curriculum.domain.Lesson;
import com.learnflow.backend.curriculum.domain.LessonItem;
import com.learnflow.backend.curriculum.domain.Unit;
import com.learnflow.backend.curriculum.engine.ContentBundle;
import com.learnflow.backend.curriculum.engine.ContentBundle.ContentFile;
import com.learnflow.backend.curriculum.engine.ContentDocument.CourseDef;
import com.learnflow.backend.curriculum.engine.ContentDocument.GrammarDef;
import com.learnflow.backend.curriculum.engine.ContentDocument.KanaDef;
import com.learnflow.backend.curriculum.engine.ContentDocument.KanjiDef;
import com.learnflow.backend.curriculum.engine.ContentDocument.LessonDef;
import com.learnflow.backend.curriculum.engine.ContentDocument.SentenceDef;
import com.learnflow.backend.curriculum.engine.ContentDocument.SourceDef;
import com.learnflow.backend.curriculum.engine.ContentDocument.UnitDef;
import com.learnflow.backend.curriculum.engine.ContentDocument.WordDef;
import com.learnflow.backend.language.LanguageService;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.BiConsumer;
import java.util.function.Function;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Loads the content YAML tree and upserts it by {@code content_key} in one transaction. Idempotent:
 * running it again with unchanged files writes nothing. Invalid content fails the import (and so
 * app startup) before anything is written.
 */
@Service
public class ContentImporter implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ContentImporter.class);

    private final ContentProperties properties;
    private final ResourcePatternResolver resourceResolver;
    private final LanguageService languageService;
    private final ContentSourceRepository sourceRepository;
    private final CourseRepository courseRepository;
    private final UnitRepository unitRepository;
    private final LessonRepository lessonRepository;
    private final KanaRepository kanaRepository;
    private final JpWordRepository wordRepository;
    private final JpKanjiRepository kanjiRepository;
    private final GrammarPointRepository grammarRepository;
    private final ExampleSentenceRepository sentenceRepository;

    public ContentImporter(
            ContentProperties properties,
            ResourcePatternResolver resourceResolver,
            LanguageService languageService,
            ContentSourceRepository sourceRepository,
            CourseRepository courseRepository,
            UnitRepository unitRepository,
            LessonRepository lessonRepository,
            KanaRepository kanaRepository,
            JpWordRepository wordRepository,
            JpKanjiRepository kanjiRepository,
            GrammarPointRepository grammarRepository,
            ExampleSentenceRepository sentenceRepository) {
        this.properties = properties;
        this.resourceResolver = resourceResolver;
        this.languageService = languageService;
        this.sourceRepository = sourceRepository;
        this.courseRepository = courseRepository;
        this.unitRepository = unitRepository;
        this.lessonRepository = lessonRepository;
        this.kanaRepository = kanaRepository;
        this.wordRepository = wordRepository;
        this.kanjiRepository = kanjiRepository;
        this.grammarRepository = grammarRepository;
        this.sentenceRepository = sentenceRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (properties.importOnStartup()) {
            importAll();
        }
    }

    // shortcut: entries removed from YAML stay in the DB (user progress may point at them); add an
    // explicit "retired" status when content actually needs removing.
    @Transactional
    public void importAll() {
        List<ContentFile> files = loadFiles();
        ContentBundle bundle = ContentBundle.load(files, properties.includeDrafts());

        Map<String, ContentSource> sources =
                upsert(
                        bundle.sources(),
                        SourceDef::key,
                        sourceRepository,
                        ContentSource::getContentKey,
                        ContentSource::new,
                        (e, d) ->
                                e.update(
                                        d.name(),
                                        d.url(),
                                        d.license(),
                                        d.licenseUrl(),
                                        d.attribution()));

        Map<String, ExampleSentence> sentences =
                upsert(
                        bundle.sentences(),
                        SentenceDef::key,
                        sentenceRepository,
                        ExampleSentence::getContentKey,
                        ExampleSentence::new,
                        (e, d) -> {
                            e.setText(d.text());
                            e.setReading(d.reading());
                            e.setTranslationVi(d.translationVi());
                            e.setTranslationEn(d.translationEn());
                            e.setStatus(d.status());
                            e.setSource(sources.get(d.source()));
                            e.setSourceRef(d.sourceRef());
                            e.setSourceAuthor(d.sourceAuthor());
                        });

        Map<String, Kana> kana =
                upsert(
                        bundle.kana(),
                        KanaDef::key,
                        kanaRepository,
                        Kana::getContentKey,
                        Kana::new,
                        (e, d) -> {
                            e.setCharacter(d.character());
                            e.setScript(d.script());
                            e.setRomaji(d.romaji());
                            e.setKanaGroup(d.group());
                            e.setRowLabel(d.row());
                            e.setPosition(d.position());
                            e.setStatus(d.status());
                            e.setSource(sources.get(d.source()));
                        });

        Map<String, JpWord> words =
                upsert(
                        bundle.words(),
                        WordDef::key,
                        wordRepository,
                        JpWord::getContentKey,
                        JpWord::new,
                        (e, d) -> {
                            e.setWritten(d.written());
                            e.setReading(d.reading());
                            replace(e.getMeaningsVi(), d.meaningsVi());
                            replace(e.getMeaningsEn(), ContentBundle.orEmpty(d.meaningsEn()));
                            replace(e.getPartOfSpeech(), ContentBundle.orEmpty(d.partOfSpeech()));
                            e.setJlptLevel(d.jlptLevel());
                            e.setNote(d.note());
                            e.setStatus(d.status());
                            e.setSource(sources.get(d.source()));
                            e.setSourceRef(d.sourceRef());
                            replace(e.getExamples(), resolve(d.examples(), sentences));
                        });

        Map<String, JpKanji> kanji =
                upsert(
                        bundle.kanji(),
                        KanjiDef::key,
                        kanjiRepository,
                        JpKanji::getContentKey,
                        JpKanji::new,
                        (e, d) -> {
                            e.setCharacter(d.character());
                            replace(e.getMeaningsVi(), d.meaningsVi());
                            replace(e.getMeaningsEn(), ContentBundle.orEmpty(d.meaningsEn()));
                            replace(e.getOnyomi(), ContentBundle.orEmpty(d.onyomi()));
                            replace(e.getKunyomi(), ContentBundle.orEmpty(d.kunyomi()));
                            e.setStrokeCount(
                                    d.strokeCount() == null ? null : d.strokeCount().shortValue());
                            e.setJlptLevel(d.jlptLevel());
                            e.setStatus(d.status());
                            e.setSource(sources.get(d.source()));
                            e.setSourceRef(d.sourceRef());
                        });

        Map<String, GrammarPoint> grammar =
                upsert(
                        bundle.grammar(),
                        GrammarDef::key,
                        grammarRepository,
                        GrammarPoint::getContentKey,
                        GrammarPoint::new,
                        (e, d) -> {
                            e.setPattern(d.pattern());
                            e.setMeaningVi(d.meaningVi());
                            e.setExplanationVi(d.explanationVi());
                            e.setJlptLevel(d.jlptLevel());
                            e.setStatus(d.status());
                            e.setSource(sources.get(d.source()));
                            replace(e.getExamples(), resolve(d.examples(), sentences));
                        });

        Map<String, Object> items = new HashMap<>();
        items.putAll(kana);
        items.putAll(words);
        items.putAll(kanji);
        items.putAll(grammar);
        items.putAll(sentences);

        Map<String, Course> courses =
                upsert(
                        bundle.courses(),
                        CourseDef::key,
                        courseRepository,
                        Course::getContentKey,
                        Course::new,
                        (e, d) ->
                                e.update(
                                        languageService.getByCode(d.language()),
                                        d.level(),
                                        d.title(),
                                        d.description(),
                                        d.position(),
                                        d.status()));

        Map<String, Unit> units =
                upsert(
                        bundle.units(),
                        UnitDef::key,
                        unitRepository,
                        Unit::getContentKey,
                        Unit::new,
                        (e, d) ->
                                e.update(
                                        courses.get(d.course()),
                                        d.title(),
                                        d.description(),
                                        d.position(),
                                        d.status()));

        Map<String, Lesson> lessons = byKey(lessonRepository.findAll(), Lesson::getContentKey);
        int lessonCount = 0;
        for (UnitDef unitDef : bundle.units()) {
            List<LessonDef> lessonDefs = ContentBundle.lessonsOf(unitDef);
            for (int i = 0; i < lessonDefs.size(); i++) {
                LessonDef def = lessonDefs.get(i);
                Lesson lesson = lessons.computeIfAbsent(def.key(), Lesson::new);
                lesson.update(
                        units.get(unitDef.key()),
                        def.title(),
                        i + 1,
                        def.status(),
                        def.items().stream().map(k -> LessonItem.of(items.get(k))).toList());
                lessonRepository.save(lesson);
                lessonCount++;
            }
        }

        log.info(
                "Content import from {} file(s): {} sources, {} courses, {} units, {} lessons, {}"
                        + " items (drafts {})",
                files.size(),
                sources.size(),
                courses.size(),
                units.size(),
                lessonCount,
                items.size(),
                properties.includeDrafts() ? "included" : "skipped");
    }

    /** Applies each definition to the existing entity with its key (or a new one) and saves it. */
    private static <D, E> Map<String, E> upsert(
            List<D> defs,
            Function<D, String> defKey,
            JpaRepository<E, Long> repository,
            Function<E, String> entityKey,
            Function<String, E> create,
            BiConsumer<E, D> apply) {
        Map<String, E> existing = byKey(repository.findAll(), entityKey);
        Map<String, E> result = new HashMap<>();
        for (D def : defs) {
            E entity = existing.computeIfAbsent(defKey.apply(def), create);
            apply.accept(entity, def);
            result.put(defKey.apply(def), repository.save(entity));
        }
        return result;
    }

    /**
     * Replaces a managed collection's contents only when they differ, so Hibernate writes nothing
     * on a no-op import.
     */
    private static <T> void replace(List<T> target, List<T> values) {
        if (!target.equals(values)) {
            target.clear();
            target.addAll(values);
        }
    }

    private static List<ExampleSentence> resolve(
            List<String> keys, Map<String, ExampleSentence> sentences) {
        return ContentBundle.orEmpty(keys).stream().map(sentences::get).toList();
    }

    private List<ContentFile> loadFiles() {
        try {
            Resource[] resources =
                    resourceResolver.getResources(properties.location() + "**/*.yaml");
            List<ContentFile> files = new ArrayList<>();
            for (Resource resource :
                    Arrays.stream(resources)
                            .sorted(Comparator.comparing(Resource::getDescription))
                            .toList()) {
                files.add(
                        new ContentFile(
                                resource.getDescription(),
                                resource.getContentAsString(StandardCharsets.UTF_8)));
            }
            return files;
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot read content from " + properties.location(), e);
        }
    }

    private static <T> Map<String, T> byKey(List<T> entities, Function<T, String> key) {
        Map<String, T> result = new HashMap<>();
        entities.forEach(e -> result.put(key.apply(e), e));
        return result;
    }
}
