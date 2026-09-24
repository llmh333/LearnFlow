package com.learnflow.backend.vocabulary;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.learnflow.backend.auth.domain.User;
import com.learnflow.backend.common.error.NotFoundException;
import com.learnflow.backend.language.LanguageService;
import com.learnflow.backend.language.domain.Language;
import com.learnflow.backend.srs.ReviewService;
import com.learnflow.backend.vocabulary.domain.Vocabulary;
import com.learnflow.backend.vocabulary.domain.VocabularyTag;
import com.learnflow.backend.vocabulary.dto.VocabularyRequest;
import com.learnflow.backend.vocabulary.dto.VocabularyResponse;
import jakarta.persistence.EntityManager;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class VocabularyServiceTest {

    private static final Clock FIXED_CLOCK =
            Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);
    private static final Long USER_ID = 1L;

    @Mock private VocabularyRepository vocabularyRepository;
    @Mock private VocabularyTagRepository tagRepository;
    @Mock private LanguageService languageService;
    @Mock private ReviewService reviewService;
    @Mock private EntityManager entityManager;

    private VocabularyService vocabularyService;

    @BeforeEach
    void setUp() {
        vocabularyService =
                new VocabularyService(
                        vocabularyRepository,
                        tagRepository,
                        languageService,
                        new VocabularyAttributesValidator(),
                        reviewService,
                        entityManager,
                        new VocabularyProperties(true),
                        FIXED_CLOCK);
        Mockito.lenient().when(entityManager.getReference(eq(User.class), any())).thenReturn(newUser(USER_ID));
    }

    @Test
    void create_resolvesLanguageAndTagsThenSaves() {
        Language english = newLanguage((short) 1, "en", "English");
        when(languageService.getByCode("en")).thenReturn(english);
        when(tagRepository.findByUser_IdAndName(USER_ID, "work")).thenReturn(Optional.empty());
        when(tagRepository.save(any(VocabularyTag.class))).thenAnswer(inv -> inv.getArgument(0));
        when(vocabularyRepository.save(any(Vocabulary.class))).thenAnswer(inv -> inv.getArgument(0));

        VocabularyRequest request =
                new VocabularyRequest(
                        "en",
                        "achieve",
                        "đạt được",
                        "I want to achieve my goals.",
                        (short) 2,
                        List.of("work"),
                        Map.of("ipa", "/əˈtʃiːv/", "cefrLevel", "B1"));

        VocabularyResponse response = vocabularyService.create(USER_ID, request);

        assertThat(response.word()).isEqualTo("achieve");
        assertThat(response.meaning()).isEqualTo("đạt được");
        assertThat(response.tags()).containsExactly("work");
        assertThat(response.attributes()).containsEntry("cefrLevel", "B1");
        assertThat(response.createdAt()).isEqualTo(Instant.now(FIXED_CLOCK));
    }

    @Test
    void create_reusesExistingTagInsteadOfCreatingDuplicate() {
        Language chinese = newLanguage((short) 2, "zh", "Chinese");
        when(languageService.getByCode("zh")).thenReturn(chinese);
        VocabularyTag existingTag = new VocabularyTag(newUser(USER_ID), "daily");
        when(tagRepository.findByUser_IdAndName(USER_ID, "daily")).thenReturn(Optional.of(existingTag));
        when(vocabularyRepository.save(any(Vocabulary.class))).thenAnswer(inv -> inv.getArgument(0));

        VocabularyRequest request =
                new VocabularyRequest("zh", "学习", "học / học tập", "我每天学习中文。", null, List.of("daily"), Map.of());

        vocabularyService.create(USER_ID, request);

        verify(tagRepository, never()).save(any(VocabularyTag.class));
    }

    @Test
    void get_missingId_throwsNotFound() {
        when(vocabularyRepository.findByIdAndUser_Id(99L, USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> vocabularyService.get(USER_ID, 99L))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void delete_missingId_throwsNotFound() {
        when(vocabularyRepository.findByIdAndUser_Id(99L, USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> vocabularyService.delete(USER_ID, 99L))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void delete_existingId_deletes() {
        Vocabulary vocabulary =
                new Vocabulary(
                        newUser(USER_ID),
                        newLanguage((short) 1, "en", "English"),
                        "word",
                        "meaning",
                        null,
                        (short) 0,
                        Map.of(),
                        Instant.now(FIXED_CLOCK),
                        Instant.now(FIXED_CLOCK));
        when(vocabularyRepository.findByIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.of(vocabulary));

        vocabularyService.delete(USER_ID, 1L);

        verify(vocabularyRepository).delete(vocabulary);
    }

    @Test
    void seedStarterVocabularyFor_clonesTemplateWordsTagsAndSchedules() {
        Long templateUserId = 999L;
        Language english = newLanguage((short) 1, "en", "English");
        VocabularyTag templateTag = new VocabularyTag(newUser(templateUserId), "A1");
        Vocabulary templateWord =
                new Vocabulary(
                        newUser(templateUserId),
                        english,
                        "achieve",
                        "đạt được",
                        "I want to achieve my goals.",
                        (short) 2,
                        Map.of("cefrLevel", "A1"),
                        Instant.now(FIXED_CLOCK),
                        Instant.now(FIXED_CLOCK));
        templateWord.replaceTags(java.util.Set.of(templateTag));
        when(vocabularyRepository.findAllByUser_IdOrderByIdAsc(templateUserId)).thenReturn(List.of(templateWord));
        when(tagRepository.findByUser_IdAndName(USER_ID, "A1")).thenReturn(Optional.empty());
        when(tagRepository.save(any(VocabularyTag.class))).thenAnswer(inv -> inv.getArgument(0));
        when(vocabularyRepository.save(any(Vocabulary.class)))
                .thenAnswer(
                        inv -> {
                            Vocabulary saved = inv.getArgument(0);
                            setField(saved, Vocabulary.class, "id", 42L);
                            return saved;
                        });

        vocabularyService.seedStarterVocabularyFor(USER_ID, templateUserId);

        var vocabularyCaptor = org.mockito.ArgumentCaptor.forClass(Vocabulary.class);
        verify(vocabularyRepository).save(vocabularyCaptor.capture());
        Vocabulary clone = vocabularyCaptor.getValue();
        assertThat(clone.getWord()).isEqualTo("achieve");
        assertThat(clone.getUser().getId()).isEqualTo(USER_ID);
        assertThat(clone.getTags()).extracting(VocabularyTag::getName).containsExactly("A1");
        verify(reviewService).createScheduleFor(USER_ID, 42L);
    }

    @Test
    void seedStarterVocabularyFor_disabledByProperty_doesNothing() {
        VocabularyService disabled =
                new VocabularyService(
                        vocabularyRepository,
                        tagRepository,
                        languageService,
                        new VocabularyAttributesValidator(),
                        reviewService,
                        entityManager,
                        new VocabularyProperties(false),
                        FIXED_CLOCK);

        disabled.seedStarterVocabularyFor(USER_ID, 999L);

        verify(vocabularyRepository, never()).findAllByUser_IdOrderByIdAsc(any());
        verify(vocabularyRepository, never()).save(any(Vocabulary.class));
    }

    @Test
    void seedStarterVocabularyFor_noTemplateWords_doesNothing() {
        when(vocabularyRepository.findAllByUser_IdOrderByIdAsc(999L)).thenReturn(List.of());

        vocabularyService.seedStarterVocabularyFor(USER_ID, 999L);

        verify(vocabularyRepository, never()).save(any(Vocabulary.class));
        verify(reviewService, never()).createScheduleFor(any(), any());
    }

    private static Language newLanguage(short id, String code, String name) {
        Language language = new Language(code, name);
        setField(language, Language.class, "id", id);
        return language;
    }

    private static User newUser(Long id) {
        User user = new User("user" + id + "@example.com", "hash", "User", Instant.now(FIXED_CLOCK));
        setField(user, User.class, "id", id);
        return user;
    }

    private static void setField(Object target, Class<?> type, String fieldName, Object value) {
        try {
            var field = type.getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException(e);
        }
    }
}
