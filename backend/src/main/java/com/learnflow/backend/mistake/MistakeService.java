package com.learnflow.backend.mistake;

import com.learnflow.backend.language.LanguageService;
import com.learnflow.backend.language.domain.Language;
import com.learnflow.backend.mistake.domain.Mistake;
import com.learnflow.backend.mistake.domain.MistakeCategory;
import com.learnflow.backend.mistake.dto.CreateMistakeRequest;
import com.learnflow.backend.mistake.dto.MistakeResponse;
import com.learnflow.backend.vocabulary.domain.Vocabulary;
import jakarta.persistence.EntityManager;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Repeated occurrences of the same {@code language + category + topic} merge into one row
 * (`timesRepeated++`) instead of piling up duplicates — per PROJECT.md §4.5 "Hệ thống cần theo dõi
 * lỗi lặp lại." Uses {@link EntityManager#getReference} for the optional vocabulary link, the same
 * pattern {@code srs.ReviewService} uses, so this module never injects another module's repository.
 */
@Service
@Transactional
public class MistakeService {

    private static final String FALLBACK_CATEGORY = "Other";
    private static final String DEFAULT_TOPIC = "General";

    private final MistakeRepository mistakeRepository;
    private final MistakeCategoryRepository categoryRepository;
    private final LanguageService languageService;
    private final EntityManager entityManager;
    private final Clock clock;

    public MistakeService(
            MistakeRepository mistakeRepository,
            MistakeCategoryRepository categoryRepository,
            LanguageService languageService,
            EntityManager entityManager,
            Clock clock) {
        this.mistakeRepository = mistakeRepository;
        this.categoryRepository = categoryRepository;
        this.languageService = languageService;
        this.entityManager = entityManager;
        this.clock = clock;
    }

    public MistakeResponse createOrIncrement(CreateMistakeRequest request) {
        Language language = languageService.getByCode(request.languageCode());
        MistakeCategory category = resolveCategory(request.category());
        String topic =
                request.topic() == null || request.topic().isBlank()
                        ? DEFAULT_TOPIC
                        : request.topic().trim();

        Mistake mistake =
                mistakeRepository
                        .findExisting(request.languageCode(), category.getId(), topic)
                        .map(
                                existing -> {
                                    existing.setTimesRepeated(existing.getTimesRepeated() + 1);
                                    existing.setCorrected(request.corrected());
                                    existing.setExplanation(request.explanation());
                                    return existing;
                                })
                        .orElseGet(
                                () ->
                                        mistakeRepository.save(
                                                new Mistake(
                                                        language,
                                                        resolveVocabulary(request.vocabularyId()),
                                                        category,
                                                        topic,
                                                        request.original(),
                                                        request.corrected(),
                                                        request.explanation(),
                                                        Instant.now(clock))));

        return MistakeResponse.from(mistake);
    }

    @Transactional(readOnly = true)
    public List<MistakeResponse> list(String languageCode, String categoryName) {
        Specification<Mistake> spec = Specification.unrestricted();
        if (languageCode != null && !languageCode.isBlank()) {
            spec = spec.and(MistakeSpecifications.hasLanguageCode(languageCode));
        }
        if (categoryName != null && !categoryName.isBlank()) {
            spec = spec.and(MistakeSpecifications.hasCategoryName(categoryName));
        }
        return mistakeRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(MistakeResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MistakeResponse> recurring(String languageCode, int limit) {
        Specification<Mistake> spec = Specification.unrestricted();
        if (languageCode != null && !languageCode.isBlank()) {
            spec = spec.and(MistakeSpecifications.hasLanguageCode(languageCode));
        }
        Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "timesRepeated"));
        return mistakeRepository.findAll(spec, pageable).stream().map(MistakeResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<String> listCategoryNames() {
        return categoryRepository.findAllByOrderByNameAsc().stream()
                .map(MistakeCategory::getName)
                .toList();
    }

    private MistakeCategory resolveCategory(String name) {
        return categoryRepository
                .findByNameIgnoreCase(name)
                .orElseGet(() -> categoryRepository.findByNameIgnoreCase(FALLBACK_CATEGORY).orElseThrow());
    }

    private Vocabulary resolveVocabulary(Long vocabularyId) {
        return vocabularyId == null ? null : entityManager.getReference(Vocabulary.class, vocabularyId);
    }
}
