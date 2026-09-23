package com.learnflow.backend.mistake;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.learnflow.backend.auth.domain.User;
import com.learnflow.backend.language.LanguageService;
import com.learnflow.backend.language.domain.Language;
import com.learnflow.backend.mistake.domain.Mistake;
import com.learnflow.backend.mistake.domain.MistakeCategory;
import com.learnflow.backend.mistake.dto.CreateMistakeRequest;
import com.learnflow.backend.mistake.dto.MistakeResponse;
import jakarta.persistence.EntityManager;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MistakeServiceTest {

    private static final Clock FIXED_CLOCK =
            Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);
    private static final Long USER_ID = 1L;

    @Mock private MistakeRepository mistakeRepository;
    @Mock private MistakeCategoryRepository categoryRepository;
    @Mock private LanguageService languageService;
    @Mock private EntityManager entityManager;

    private MistakeService mistakeService;

    @BeforeEach
    void setUp() {
        mistakeService =
                new MistakeService(
                        mistakeRepository, categoryRepository, languageService, entityManager, FIXED_CLOCK);
    }

    @Test
    void createOrIncrement_newTopic_createsMistakeWithTimesRepeatedOne() {
        Language english = newLanguage("en");
        MistakeCategory grammar = newCategory(2, "Grammar");
        when(languageService.getByCode("en")).thenReturn(english);
        when(categoryRepository.findByNameIgnoreCase("Grammar")).thenReturn(Optional.of(grammar));
        when(mistakeRepository.findExisting(USER_ID, "en", 2, "Past tense")).thenReturn(Optional.empty());
        when(entityManager.getReference(eq(User.class), any())).thenReturn(null);
        when(mistakeRepository.save(any(Mistake.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateMistakeRequest request =
                new CreateMistakeRequest(
                        "en",
                        null,
                        "Grammar",
                        "Past tense",
                        "I go yesterday.",
                        "I went yesterday.",
                        "Use past tense.");

        MistakeResponse response = mistakeService.createOrIncrement(USER_ID, request);

        assertThat(response.timesRepeated()).isEqualTo(1);
        assertThat(response.topic()).isEqualTo("Past tense");
        assertThat(response.category()).isEqualTo("Grammar");
    }

    @Test
    void createOrIncrement_repeatedTopic_incrementsExistingInsteadOfCreatingNew() {
        Language english = newLanguage("en");
        MistakeCategory grammar = newCategory(2, "Grammar");
        Mistake existing =
                new Mistake(
                        null,
                        english,
                        null,
                        grammar,
                        "Past tense",
                        "I go yesterday.",
                        "I went yesterday.",
                        "Use past tense.",
                        Instant.parse("2025-12-01T00:00:00Z"));
        when(languageService.getByCode("en")).thenReturn(english);
        when(categoryRepository.findByNameIgnoreCase("Grammar")).thenReturn(Optional.of(grammar));
        when(mistakeRepository.findExisting(USER_ID, "en", 2, "past tense")).thenReturn(Optional.of(existing));

        CreateMistakeRequest request =
                new CreateMistakeRequest(
                        "en",
                        null,
                        "Grammar",
                        "past tense", // different casing — should still match "Past tense"
                        "I go home yesterday.",
                        "I went home yesterday.",
                        "Still past tense.");

        MistakeResponse response = mistakeService.createOrIncrement(USER_ID, request);

        assertThat(response.timesRepeated()).isEqualTo(2);
        assertThat(response.corrected()).isEqualTo("I went home yesterday.");
        assertThat(response.explanation()).isEqualTo("Still past tense.");
        verify(mistakeRepository, never()).save(any(Mistake.class));
    }

    @Test
    void createOrIncrement_unknownCategory_fallsBackToOther() {
        Language english = newLanguage("en");
        MistakeCategory other = newCategory(8, "Other");
        when(languageService.getByCode("en")).thenReturn(english);
        when(categoryRepository.findByNameIgnoreCase("NotARealCategory")).thenReturn(Optional.empty());
        when(categoryRepository.findByNameIgnoreCase("Other")).thenReturn(Optional.of(other));
        when(mistakeRepository.findExisting(USER_ID, "en", 8, "General")).thenReturn(Optional.empty());
        when(entityManager.getReference(eq(User.class), any())).thenReturn(null);
        when(mistakeRepository.save(any(Mistake.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateMistakeRequest request =
                new CreateMistakeRequest(
                        "en", null, "NotARealCategory", null, "orig", "fixed", "explanation");

        MistakeResponse response = mistakeService.createOrIncrement(USER_ID, request);

        assertThat(response.category()).isEqualTo("Other");
        assertThat(response.topic()).isEqualTo("General"); // blank topic defaults to "General"
    }

    private static Language newLanguage(String code) {
        Language language = new Language(code, code.toUpperCase());
        setId(language, Language.class, (short) 1);
        return language;
    }

    private static MistakeCategory newCategory(int id, String name) {
        try {
            var constructor = MistakeCategory.class.getDeclaredConstructor();
            constructor.setAccessible(true);
            MistakeCategory category = constructor.newInstance();
            setId(category, MistakeCategory.class, id);
            var nameField = MistakeCategory.class.getDeclaredField("name");
            nameField.setAccessible(true);
            nameField.set(category, name);
            return category;
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException(e);
        }
    }

    private static <T> void setId(Object target, Class<T> type, Object id) {
        try {
            var field = type.getDeclaredField("id");
            field.setAccessible(true);
            field.set(target, id);
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException(e);
        }
    }
}
