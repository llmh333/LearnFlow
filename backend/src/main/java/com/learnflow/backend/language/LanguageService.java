package com.learnflow.backend.language;

import com.learnflow.backend.common.error.NotFoundException;
import com.learnflow.backend.language.domain.Language;
import com.learnflow.backend.language.dto.LanguageResponse;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class LanguageService {

    private final LanguageRepository languageRepository;

    public LanguageService(LanguageRepository languageRepository) {
        this.languageRepository = languageRepository;
    }

    public List<LanguageResponse> listAll() {
        return languageRepository.findAllByOrderByIdAsc().stream()
                .map(LanguageResponse::from)
                .toList();
    }

    /** Used by other modules (e.g. vocabulary) to resolve a language by its short code. */
    public Language getByCode(String code) {
        return languageRepository
                .findByCode(code)
                .orElseThrow(() -> new NotFoundException("Unknown language code: " + code));
    }
}
