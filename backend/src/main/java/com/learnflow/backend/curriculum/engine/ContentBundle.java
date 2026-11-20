package com.learnflow.backend.curriculum.engine;

import com.learnflow.backend.curriculum.domain.ContentStatus;
import com.learnflow.backend.curriculum.domain.KanaScript;
import com.learnflow.backend.curriculum.engine.ContentDocument.CharacterDef;
import com.learnflow.backend.curriculum.engine.ContentDocument.CourseDef;
import com.learnflow.backend.curriculum.engine.ContentDocument.GrammarDef;
import com.learnflow.backend.curriculum.engine.ContentDocument.ItemDef;
import com.learnflow.backend.curriculum.engine.ContentDocument.KanaDef;
import com.learnflow.backend.curriculum.engine.ContentDocument.LessonDef;
import com.learnflow.backend.curriculum.engine.ContentDocument.SentenceDef;
import com.learnflow.backend.curriculum.engine.ContentDocument.SourceDef;
import com.learnflow.backend.curriculum.engine.ContentDocument.UnitDef;
import com.learnflow.backend.curriculum.engine.ContentDocument.WordDef;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import org.yaml.snakeyaml.DumperOptions;
import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.SafeConstructor;
import org.yaml.snakeyaml.nodes.Tag;
import org.yaml.snakeyaml.representer.Representer;
import org.yaml.snakeyaml.resolver.Resolver;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

/**
 * Parses and validates all content YAML files as one unit, so a reference may point into another
 * file. Pure: no Spring, no DB. Either returns a fully consistent bundle or throws {@link
 * ContentValidationException} listing every problem found. The DB constraints are the last line of
 * defence; this class exists to give authors readable errors first.
 */
public final class ContentBundle {

    public record ContentFile(String name, String yaml) {}

    private static final Pattern ROMAJI = Pattern.compile("[a-z]+");

    private static final ObjectMapper MAPPER =
            JsonMapper.builder().enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES).build();

    private final List<SourceDef> sources;
    private final List<CourseDef> courses;
    private final List<UnitDef> units;
    private final List<KanaDef> kana;
    private final List<WordDef> words;
    private final List<CharacterDef> characters;
    private final List<GrammarDef> grammar;
    private final List<SentenceDef> sentences;

    private ContentBundle(Parts p) {
        this.sources = List.copyOf(p.sources);
        this.courses = List.copyOf(p.courses);
        this.units = List.copyOf(p.units);
        this.kana = List.copyOf(p.kana);
        this.words = List.copyOf(p.words);
        this.characters = List.copyOf(p.characters);
        this.grammar = List.copyOf(p.grammar);
        this.sentences = List.copyOf(p.sentences);
    }

    public List<SourceDef> sources() {
        return sources;
    }

    public List<CourseDef> courses() {
        return courses;
    }

    /** Units with only the lessons that are kept (drafts removed unless included). */
    public List<UnitDef> units() {
        return units;
    }

    public List<KanaDef> kana() {
        return kana;
    }

    public List<WordDef> words() {
        return words;
    }

    public List<CharacterDef> characters() {
        return characters;
    }

    public List<GrammarDef> grammar() {
        return grammar;
    }

    public List<SentenceDef> sentences() {
        return sentences;
    }

    public static List<LessonDef> lessonsOf(UnitDef unit) {
        return orEmpty(unit.lessons());
    }

    public static <T> List<T> orEmpty(List<T> list) {
        return list == null ? List.of() : list;
    }

    /** An item's language is its key's first segment: {@code ja.word.taberu} → {@code ja}. */
    public static String languageOf(String key) {
        int dot = key == null ? -1 : key.indexOf('.');
        return dot < 0 ? null : key.substring(0, dot);
    }

    /** YAML level codes are written in lower case (n5); the DB stores them upper case (N5). */
    public static String levelCode(String level) {
        return level == null || level.isBlank() ? null : level.strip().toUpperCase(Locale.ROOT);
    }

    /** Mutable accumulator while loading. */
    private static final class Parts {
        List<SourceDef> sources = new ArrayList<>();
        List<CourseDef> courses = new ArrayList<>();
        List<UnitDef> units = new ArrayList<>();
        List<KanaDef> kana = new ArrayList<>();
        List<WordDef> words = new ArrayList<>();
        List<CharacterDef> characters = new ArrayList<>();
        List<GrammarDef> grammar = new ArrayList<>();
        List<SentenceDef> sentences = new ArrayList<>();

        Stream<ItemDef> items() {
            return Stream.of(kana, words, characters, grammar, sentences).flatMap(List::stream);
        }
    }

    /**
     * @param includeDrafts when false, every {@code draft} course/unit/lesson/item is dropped, and
     *     anything kept that still references a dropped entry is an error.
     */
    public static ContentBundle load(Collection<ContentFile> files, boolean includeDrafts) {
        List<String> errors = new ArrayList<>();
        Parts p = new Parts();

        Yaml yaml = newYaml();
        for (ContentFile file : files) {
            try {
                Object raw = yaml.load(file.yaml());
                if (raw == null) {
                    continue;
                }
                ContentDocument doc = MAPPER.convertValue(raw, ContentDocument.class);
                p.sources.addAll(orEmpty(doc.sources()));
                p.courses.addAll(orEmpty(doc.courses()));
                p.units.addAll(orEmpty(doc.units()));
                p.kana.addAll(orEmpty(doc.kana()));
                p.words.addAll(orEmpty(doc.words()));
                p.characters.addAll(orEmpty(doc.characters()));
                p.grammar.addAll(orEmpty(doc.grammar()));
                p.sentences.addAll(orEmpty(doc.sentences()));
            } catch (RuntimeException e) {
                errors.add(file.name() + ": cannot parse: " + e.getMessage());
            }
        }

        checkUnique(errors, "source", p.sources, SourceDef::key);
        checkUnique(errors, "course", p.courses, CourseDef::key);
        checkUnique(errors, "unit", p.units, UnitDef::key);
        checkUnique(
                errors,
                "lesson",
                p.units.stream().flatMap(u -> lessonsOf(u).stream()).toList(),
                LessonDef::key);
        // One key space for all items, so a lesson can list a key without saying its type.
        checkUnique(errors, "item", p.items().toList(), ItemDef::key);

        p.sources.forEach(s -> checkSource(errors, s));
        p.courses.forEach(c -> checkCourse(errors, c));
        p.units.forEach(u -> checkUnit(errors, u));
        p.items().forEach(i -> checkItem(errors, i));
        p.kana.forEach(k -> checkKana(errors, k));
        p.words.forEach(w -> checkWord(errors, w));
        p.characters.forEach(c -> checkCharacter(errors, c));
        p.grammar.forEach(g -> checkGrammar(errors, g));
        p.sentences.forEach(s -> checkSentence(errors, s));
        if (!errors.isEmpty()) {
            throw new ContentValidationException(errors);
        }

        if (!includeDrafts) {
            dropDrafts(p);
        }

        checkReferences(errors, p, includeDrafts ? "unknown" : "unknown or draft");
        if (!errors.isEmpty()) {
            throw new ContentValidationException(errors);
        }
        return new ContentBundle(p);
    }

    private static void dropDrafts(Parts p) {
        Predicate<ContentStatus> reviewed = s -> s == ContentStatus.REVIEWED;
        p.courses = p.courses.stream().filter(c -> reviewed.test(c.status())).toList();
        p.kana = p.kana.stream().filter(i -> reviewed.test(i.status())).toList();
        p.words = p.words.stream().filter(i -> reviewed.test(i.status())).toList();
        p.characters = p.characters.stream().filter(i -> reviewed.test(i.status())).toList();
        p.grammar = p.grammar.stream().filter(i -> reviewed.test(i.status())).toList();
        p.sentences = p.sentences.stream().filter(i -> reviewed.test(i.status())).toList();
        p.units =
                p.units.stream()
                        .filter(u -> reviewed.test(u.status()))
                        .map(u ->
                                new UnitDef(
                                        u.key(),
                                        u.course(),
                                        u.position(),
                                        u.title(),
                                        u.description(),
                                        u.status(),
                                        lessonsOf(u).stream()
                                                .filter(l -> reviewed.test(l.status()))
                                                .toList()))
                        .toList();
    }

    private static void checkReferences(List<String> errors, Parts p, String missing) {
        Set<String> sourceKeys = keys(p.sources, SourceDef::key);
        Set<String> courseKeys = keys(p.courses, CourseDef::key);
        Set<String> itemKeys = keys(p.items().toList(), ItemDef::key);
        Set<String> sentenceKeys = keys(p.sentences, SentenceDef::key);

        for (UnitDef unit : p.units) {
            if (!courseKeys.contains(unit.course())) {
                errors.add("unit " + unit.key() + ": " + missing + " course " + unit.course());
            }
            for (LessonDef lesson : lessonsOf(unit)) {
                for (String itemKey : lesson.items()) {
                    if (!itemKeys.contains(itemKey)) {
                        errors.add("lesson " + lesson.key() + ": " + missing + " item " + itemKey);
                    }
                }
            }
        }
        p.items()
                .filter(i -> !sourceKeys.contains(i.source()))
                .forEach(i -> errors.add("item " + i.key() + ": unknown source " + i.source()));
        Stream.concat(
                        p.words.stream().map(w -> new Examples(w.key(), w.examples())),
                        p.grammar.stream().map(g -> new Examples(g.key(), g.examples())))
                .forEach(e ->
                        orEmpty(e.sentences()).stream()
                                .filter(s -> !sentenceKeys.contains(s))
                                .forEach(s ->
                                        errors.add(
                                                "item "
                                                        + e.owner()
                                                        + ": "
                                                        + missing
                                                        + " example sentence "
                                                        + s)));
    }

    private record Examples(String owner, List<String> sentences) {}

    private static void checkSource(List<String> errors, SourceDef s) {
        String where = "source " + s.key();
        require(errors, where, "name", s.name());
        require(errors, where, "license", s.license());
    }

    private static void checkCourse(List<String> errors, CourseDef c) {
        String where = "course " + c.key();
        require(errors, where, "language", c.language());
        LanguageRules.forCode(c.language())
                .ifPresentOrElse(
                        rules -> checkLevel(errors, where, rules, c.level()),
                        () -> errors.add(where + ": unknown language " + c.language()));
        require(errors, where, "title", c.title());
        requirePositive(errors, where, "position", c.position());
        require(errors, where, "status", c.status());
    }

    private static void checkUnit(List<String> errors, UnitDef u) {
        String where = "unit " + u.key();
        require(errors, where, "course", u.course());
        requirePositive(errors, where, "position", u.position());
        require(errors, where, "title", u.title());
        require(errors, where, "status", u.status());
        for (LessonDef l : lessonsOf(u)) {
            String lessonWhere = "lesson " + l.key();
            require(errors, lessonWhere, "title", l.title());
            require(errors, lessonWhere, "status", l.status());
            if (l.items() == null || l.items().isEmpty()) {
                errors.add(lessonWhere + ": items must not be empty");
            } else if (new HashSet<>(l.items()).size() != l.items().size()) {
                errors.add(lessonWhere + ": lists the same item twice");
            }
        }
    }

    private static void checkItem(List<String> errors, ItemDef i) {
        require(errors, "item " + i.key(), "status", i.status());
        require(errors, "item " + i.key(), "source", i.source());
        if (i.key() != null && LanguageRules.forCode(languageOf(i.key())).isEmpty()) {
            errors.add("item " + i.key() + ": key must start with a known language code (ja.…)");
        }
    }

    /** Rules of an item's language; empty when its key has none (checkItem reports that). */
    private static Optional<LanguageRules> rulesOf(ItemDef i) {
        return LanguageRules.forCode(languageOf(i.key()));
    }

    private static void checkLevel(
            List<String> errors, String where, LanguageRules rules, String level) {
        String code = levelCode(level);
        if (code != null && !rules.levels().contains(code)) {
            errors.add(where + ": level must be one of " + rules.levels() + " for " + rules.code());
        }
    }

    private static void checkKana(List<String> errors, KanaDef k) {
        String where = "item " + k.key();
        require(errors, where, "script", k.script());
        require(errors, where, "group", k.group());
        require(errors, where, "row", k.row());
        requirePositive(errors, where, "position", k.position());
        if (k.romaji() == null || !ROMAJI.matcher(k.romaji()).matches()) {
            errors.add(where + ": romaji must be lower-case latin letters");
        }
        String c = k.character();
        if (c == null
                || c.isEmpty()
                || c.codePointCount(0, c.length()) > 2
                || (k.script() != null
                        && !c.codePoints().allMatch(cp -> inScript(cp, k.script())))) {
            errors.add(where + ": character must be 1–2 " + k.script() + " characters");
        }
    }

    private static void checkWord(List<String> errors, WordDef w) {
        String where = "item " + w.key();
        rulesOf(w)
                .ifPresent(rules -> {
                    if (!rules.isValidReading(w.reading())) {
                        errors.add(where + ": reading must be " + rules.readingRule());
                    }
                    checkLevel(errors, where, rules, w.level());
                });
        requireMeanings(errors, where, "meaningsVi", w.meaningsVi());
        checkOptionalStrings(errors, where, "meaningsEn", w.meaningsEn());
        checkOptionalStrings(errors, where, "partOfSpeech", w.partOfSpeech());
        checkOptionalStrings(errors, where, "examples", w.examples());
    }

    private static void checkCharacter(List<String> errors, CharacterDef k) {
        String where = "item " + k.key();
        String c = k.character();
        if (c == null
                || c.codePointCount(0, c.length()) != 1
                || Character.UnicodeScript.of(c.codePointAt(0)) != Character.UnicodeScript.HAN) {
            errors.add(where + ": character must be a single han character");
        }
        rulesOf(k).ifPresent(rules -> checkCharacterRules(errors, where, rules, k));
        requireMeanings(errors, where, "meaningsVi", k.meaningsVi());
        checkOptionalStrings(errors, where, "meaningsEn", k.meaningsEn());
        checkOptionalStrings(errors, where, "hanViet", k.hanViet());
        if (k.strokeCount() != null && k.strokeCount() <= 0) {
            errors.add(where + ": strokeCount must be positive");
        }
    }

    private static void checkCharacterRules(
            List<String> errors, String where, LanguageRules rules, CharacterDef k) {
        checkLevel(errors, where, rules, k.level());
        if (k.readings() == null) {
            return;
        }
        k.readings()
                .forEach((kind, values) -> {
                    if (!rules.characterReadingKinds().contains(kind)) {
                        errors.add(where + ": " + rules.code() + " has no " + kind + " readings");
                    }
                    checkOptionalStrings(errors, where, "readings." + kind, values);
                });
    }

    private static void checkGrammar(List<String> errors, GrammarDef g) {
        String where = "item " + g.key();
        require(errors, where, "pattern", g.pattern());
        require(errors, where, "explanationVi", g.explanationVi());
        rulesOf(g).ifPresent(rules -> checkLevel(errors, where, rules, g.level()));
        checkOptionalStrings(errors, where, "examples", g.examples());
    }

    private static void checkSentence(List<String> errors, SentenceDef s) {
        String where = "item " + s.key();
        require(errors, where, "text", s.text());
        require(errors, where, "translationVi", s.translationVi());
    }

    private static boolean inScript(int cp, KanaScript script) {
        return script == KanaScript.HIRAGANA
                ? JapaneseRules.isHiragana(cp)
                : JapaneseRules.isKatakana(cp);
    }

    private static void require(List<String> errors, String where, String field, Object value) {
        if (value == null || (value instanceof String s && s.isBlank())) {
            errors.add(where + ": " + field + " is required");
        }
    }

    private static void requirePositive(
            List<String> errors, String where, String field, Integer value) {
        if (value == null || value <= 0) {
            errors.add(where + ": " + field + " must be a positive number");
        }
    }

    private static void requireMeanings(
            List<String> errors, String where, String field, List<String> values) {
        if (values == null || values.isEmpty()) {
            errors.add(where + ": " + field + " must have at least one entry");
        } else {
            checkOptionalStrings(errors, where, field, values);
        }
    }

    private static void checkOptionalStrings(
            List<String> errors, String where, String field, List<String> values) {
        if (values != null && values.stream().anyMatch(v -> v == null || v.isBlank())) {
            errors.add(where + ": " + field + " must not contain empty entries");
        }
    }

    private static <T> void checkUnique(
            List<String> errors, String kind, List<T> entries, Function<T, String> key) {
        Set<String> seen = new HashSet<>();
        for (T entry : entries) {
            String k = key.apply(entry);
            if (k == null || k.isBlank()) {
                errors.add(kind + " without key");
            } else if (!seen.add(k)) {
                errors.add("duplicate " + kind + " key " + k);
            }
        }
    }

    private static <T> Set<String> keys(List<T> entries, Function<T, String> key) {
        Set<String> result = new HashSet<>();
        entries.forEach(e -> result.add(key.apply(e)));
        return result;
    }

    /**
     * YAML 1.1 reads {@code no}, {@code on}, {@code off} as booleans, which breaks romaji like
     * {@code no} (の). Content has no booleans, floats or dates, so only resolve ints and nulls.
     */
    private static Yaml newYaml() {
        LoaderOptions loaderOptions = new LoaderOptions();
        DumperOptions dumperOptions = new DumperOptions();
        Resolver resolver =
                new Resolver() {
                    @Override
                    protected void addImplicitResolvers() {
                        addImplicitResolver(Tag.INT, INT, "-+0123456789");
                        addImplicitResolver(Tag.NULL, NULL, "~nN\0");
                        addImplicitResolver(Tag.NULL, EMPTY, null);
                    }
                };
        return new Yaml(
                new SafeConstructor(loaderOptions),
                new Representer(dumperOptions),
                dumperOptions,
                loaderOptions,
                resolver);
    }
}
