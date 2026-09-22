package com.learnflow.backend.vocabulary;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.learnflow.backend.common.error.NotFoundException;
import com.learnflow.backend.language.LanguageService;
import com.learnflow.backend.language.domain.Language;
import com.learnflow.backend.vocabulary.domain.Vocabulary;
import com.learnflow.backend.vocabulary.domain.VocabularyTag;
import com.learnflow.backend.vocabulary.dto.VocabularyRequest;
import com.learnflow.backend.vocabulary.dto.VocabularyResponse;
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
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class VocabularyServiceTest {

    private static final Clock FIXED_CLOCK =
            Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);

    @Mock private VocabularyRepository vocabularyRepository;
    @Mock private VocabularyTagRepository tagRepository;
    @Mock private LanguageService languageService;

    private VocabularyService vocabularyService;

    @BeforeEach
    void setUp() {
        vocabularyService =
                new VocabularyService(
                        vocabularyRepository,
                        tagRepository,
                        languageService,
                        new VocabularyAttributesValidator(),
                        FIXED_CLOCK);
    }

    @Test
    void create_resolvesLanguageAndTagsThenSaves() {
        Language english = newLanguage((short) 1, "en", "English");
        when(languageService.getByCode("en")).thenReturn(english);
        when(tagRepository.findByName("work")).thenReturn(Optional.empty());
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

        VocabularyResponse response = vocabularyService.create(request);

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
        VocabularyTag existingTag = new VocabularyTag("daily");
        when(tagRepository.findByName("daily")).thenReturn(Optional.of(existingTag));
        when(vocabularyRepository.save(any(Vocabulary.class))).thenAnswer(inv -> inv.getArgument(0));

        VocabularyRequest request =
                new VocabularyRequest("zh", "学习", "học / học tập", "我每天学习中文。", null, List.of("daily"), Map.of());

        vocabularyService.create(request);

        verify(tagRepository, never()).save(any(VocabularyTag.class));
    }

    @Test
    void get_missingId_throwsNotFound() {
        when(vocabularyRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> vocabularyService.get(99L)).isInstanceOf(NotFoundException.class);
    }

    @Test
    void delete_missingId_throwsNotFound() {
        when(vocabularyRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> vocabularyService.delete(99L)).isInstanceOf(NotFoundException.class);
    }

    @Test
    void delete_existingId_deletes() {
        when(vocabularyRepository.existsById(1L)).thenReturn(true);

        vocabularyService.delete(1L);

        verify(vocabularyRepository).deleteById(1L);
    }

    private static Language newLanguage(short id, String code, String name) {
        Language language = new Language(code, name);
        try {
            var field = Language.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(language, id);
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException(e);
        }
        return language;
    }
}
