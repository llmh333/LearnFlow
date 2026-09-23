package com.learnflow.backend.vocabulary;

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
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class VocabularyService {

    private final VocabularyRepository vocabularyRepository;
    private final VocabularyTagRepository tagRepository;
    private final LanguageService languageService;
    private final VocabularyAttributesValidator attributesValidator;
    private final ReviewService reviewService;
    private final EntityManager entityManager;
    private final Clock clock;

    public VocabularyService(
            VocabularyRepository vocabularyRepository,
            VocabularyTagRepository tagRepository,
            LanguageService languageService,
            VocabularyAttributesValidator attributesValidator,
            ReviewService reviewService,
            EntityManager entityManager,
            Clock clock) {
        this.vocabularyRepository = vocabularyRepository;
        this.tagRepository = tagRepository;
        this.languageService = languageService;
        this.attributesValidator = attributesValidator;
        this.reviewService = reviewService;
        this.entityManager = entityManager;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public Page<VocabularyResponse> list(
            Long userId, String languageCode, String search, String tag, Pageable pageable) {
        Specification<Vocabulary> spec = VocabularySpecifications.hasUserId(userId);
        if (languageCode != null && !languageCode.isBlank()) {
            spec = spec.and(VocabularySpecifications.hasLanguageCode(languageCode));
        }
        if (search != null && !search.isBlank()) {
            spec = spec.and(VocabularySpecifications.wordOrMeaningContains(search));
        }
        if (tag != null && !tag.isBlank()) {
            spec = spec.and(VocabularySpecifications.hasTag(tag));
        }
        return vocabularyRepository.findAll(spec, pageable).map(VocabularyResponse::from);
    }

    @Transactional(readOnly = true)
    public VocabularyResponse get(Long userId, Long id) {
        return VocabularyResponse.from(findOrThrow(userId, id));
    }

    public VocabularyResponse create(Long userId, VocabularyRequest request) {
        Language language = languageService.getByCode(request.languageCode());
        attributesValidator.validate(language.getCode(), request.attributes());

        User userRef = entityManager.getReference(User.class, userId);
        Instant now = Instant.now(clock);
        Vocabulary vocabulary =
                new Vocabulary(
                        userRef,
                        language,
                        request.word(),
                        request.meaning(),
                        request.example(),
                        request.difficulty(),
                        request.attributes(),
                        now,
                        now);
        vocabulary.replaceTags(resolveTags(userId, userRef, request.tags()));

        Vocabulary saved = vocabularyRepository.save(vocabulary);
        reviewService.createScheduleFor(userId, saved.getId());
        return VocabularyResponse.from(saved);
    }

    public VocabularyResponse update(Long userId, Long id, VocabularyRequest request) {
        Vocabulary vocabulary = findOrThrow(userId, id);
        Language language = languageService.getByCode(request.languageCode());
        attributesValidator.validate(language.getCode(), request.attributes());

        vocabulary.setLanguage(language);
        vocabulary.setWord(request.word());
        vocabulary.setMeaning(request.meaning());
        vocabulary.setExample(request.example());
        vocabulary.setDifficulty(request.difficulty());
        vocabulary.setAttributes(request.attributes());
        vocabulary.replaceTags(
                resolveTags(userId, entityManager.getReference(User.class, userId), request.tags()));
        vocabulary.setUpdatedAt(Instant.now(clock));

        return VocabularyResponse.from(vocabulary);
    }

    public void delete(Long userId, Long id) {
        Vocabulary vocabulary = findOrThrow(userId, id);
        vocabularyRepository.delete(vocabulary);
    }

    @Transactional(readOnly = true)
    public long countByLanguage(Long userId, String languageCode) {
        Specification<Vocabulary> spec = VocabularySpecifications.hasUserId(userId);
        if (languageCode != null && !languageCode.isBlank()) {
            spec = spec.and(VocabularySpecifications.hasLanguageCode(languageCode));
        }
        return vocabularyRepository.count(spec);
    }

    @Transactional(readOnly = true)
    public List<String> listTagNames(Long userId) {
        return tagRepository.findAllByUser_IdOrderByNameAsc(userId).stream()
                .map(VocabularyTag::getName)
                .toList();
    }

    private Vocabulary findOrThrow(Long userId, Long id) {
        return vocabularyRepository
                .findByIdAndUser_Id(id, userId)
                .orElseThrow(() -> new NotFoundException("Vocabulary not found: " + id));
    }

    private Set<VocabularyTag> resolveTags(Long userId, User userRef, List<String> tagNames) {
        Set<VocabularyTag> tags = new LinkedHashSet<>();
        for (String name : tagNames) {
            String trimmed = name.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            tags.add(
                    tagRepository
                            .findByUser_IdAndName(userId, trimmed)
                            .orElseGet(() -> tagRepository.save(new VocabularyTag(userRef, trimmed))));
        }
        return tags;
    }
}
