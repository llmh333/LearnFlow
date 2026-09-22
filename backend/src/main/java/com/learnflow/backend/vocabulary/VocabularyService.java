package com.learnflow.backend.vocabulary;

import com.learnflow.backend.common.error.NotFoundException;
import com.learnflow.backend.language.LanguageService;
import com.learnflow.backend.language.domain.Language;
import com.learnflow.backend.srs.ReviewService;
import com.learnflow.backend.vocabulary.domain.Vocabulary;
import com.learnflow.backend.vocabulary.domain.VocabularyTag;
import com.learnflow.backend.vocabulary.dto.VocabularyRequest;
import com.learnflow.backend.vocabulary.dto.VocabularyResponse;
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
    private final Clock clock;

    public VocabularyService(
            VocabularyRepository vocabularyRepository,
            VocabularyTagRepository tagRepository,
            LanguageService languageService,
            VocabularyAttributesValidator attributesValidator,
            ReviewService reviewService,
            Clock clock) {
        this.vocabularyRepository = vocabularyRepository;
        this.tagRepository = tagRepository;
        this.languageService = languageService;
        this.attributesValidator = attributesValidator;
        this.reviewService = reviewService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public Page<VocabularyResponse> list(
            String languageCode, String search, String tag, Pageable pageable) {
        Specification<Vocabulary> spec = Specification.unrestricted();
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
    public VocabularyResponse get(Long id) {
        return VocabularyResponse.from(findOrThrow(id));
    }

    public VocabularyResponse create(VocabularyRequest request) {
        Language language = languageService.getByCode(request.languageCode());
        attributesValidator.validate(language.getCode(), request.attributes());

        Instant now = Instant.now(clock);
        Vocabulary vocabulary =
                new Vocabulary(
                        language,
                        request.word(),
                        request.meaning(),
                        request.example(),
                        request.difficulty(),
                        request.attributes(),
                        now,
                        now);
        vocabulary.replaceTags(resolveTags(request.tags()));

        Vocabulary saved = vocabularyRepository.save(vocabulary);
        reviewService.createScheduleFor(saved.getId());
        return VocabularyResponse.from(saved);
    }

    public VocabularyResponse update(Long id, VocabularyRequest request) {
        Vocabulary vocabulary = findOrThrow(id);
        Language language = languageService.getByCode(request.languageCode());
        attributesValidator.validate(language.getCode(), request.attributes());

        vocabulary.setLanguage(language);
        vocabulary.setWord(request.word());
        vocabulary.setMeaning(request.meaning());
        vocabulary.setExample(request.example());
        vocabulary.setDifficulty(request.difficulty());
        vocabulary.setAttributes(request.attributes());
        vocabulary.replaceTags(resolveTags(request.tags()));
        vocabulary.setUpdatedAt(Instant.now(clock));

        return VocabularyResponse.from(vocabulary);
    }

    public void delete(Long id) {
        if (!vocabularyRepository.existsById(id)) {
            throw new NotFoundException("Vocabulary not found: " + id);
        }
        vocabularyRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<String> listTagNames() {
        return tagRepository.findAllByOrderByNameAsc().stream().map(VocabularyTag::getName).toList();
    }

    private Vocabulary findOrThrow(Long id) {
        return vocabularyRepository
                .findById(id)
                .orElseThrow(() -> new NotFoundException("Vocabulary not found: " + id));
    }

    private Set<VocabularyTag> resolveTags(List<String> tagNames) {
        Set<VocabularyTag> tags = new LinkedHashSet<>();
        for (String name : tagNames) {
            String trimmed = name.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            tags.add(tagRepository.findByName(trimmed).orElseGet(() -> tagRepository.save(new VocabularyTag(trimmed))));
        }
        return tags;
    }
}
