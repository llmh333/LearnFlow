package com.learnflow.backend.curriculum;

import com.learnflow.backend.common.error.BadRequestException;
import com.learnflow.backend.common.error.NotFoundException;
import com.learnflow.backend.common.web.PageResponse;
import com.learnflow.backend.curriculum.domain.ContentStatus;
import com.learnflow.backend.curriculum.domain.ProficiencyLevel;
import com.learnflow.backend.curriculum.dto.response.LevelCountResponse;
import com.learnflow.backend.curriculum.dto.response.WordDetailResponse;
import com.learnflow.backend.curriculum.dto.response.WordSummaryResponse;
import com.learnflow.backend.curriculum.engine.ContentBundle;
import com.learnflow.backend.curriculum.engine.LanguageRules;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Dictionary over the global {@code word} table, one target language at a time (D18): search,
 * browse by proficiency level, and word detail. Draft words (e.g. the AI-translated JLPT lists of
 * V22/V23) are hidden unless {@code app.content.include-drafts}, which is off in prod.
 */
@Service
@Transactional(readOnly = true)
public class DictionaryService {

    static final int MAX_PAGE_SIZE = 50;
    static final int MAX_QUERY_LENGTH = 100;

    private final WordRepository wordRepository;
    private final ProficiencyLevelRepository levelRepository;
    private final boolean includeDrafts;

    public DictionaryService(
            WordRepository wordRepository,
            ProficiencyLevelRepository levelRepository,
            ContentProperties contentProperties) {
        this.wordRepository = wordRepository;
        this.levelRepository = levelRepository;
        this.includeDrafts = contentProperties.includeDrafts();
    }

    /**
     * @param language content language code, e.g. ja
     * @param query optional text; blank = browse
     * @param level optional level code of that language (e.g. N5), case-insensitive
     */
    public PageResponse<WordSummaryResponse> search(
            String language, String query, String level, int page, int size) {
        LanguageRules rules = rules(language);
        String text = query == null || query.isBlank() ? null : query.strip();
        if (text != null && text.length() > MAX_QUERY_LENGTH) {
            throw new BadRequestException(
                    "q", "Search text must be at most " + MAX_QUERY_LENGTH + " characters");
        }
        String levelCode = ContentBundle.levelCode(level);
        if (levelCode != null && !rules.levels().contains(levelCode)) {
            throw new BadRequestException("level", "Level must be one of " + rules.levels());
        }
        PageRequest pageable =
                PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, MAX_PAGE_SIZE));
        return PageResponse.from(
                wordRepository
                        .search(
                                rules.code(),
                                includeDrafts,
                                levelCode,
                                text == null ? null : escapeLike(text),
                                text,
                                pageable)
                        .map(WordSummaryResponse::from));
    }

    /** Word counts for every level of the language, easiest first, then unleveled words if any. */
    public List<LevelCountResponse> countByLevel(String language) {
        LanguageRules rules = rules(language);
        Map<String, Long> counts = new HashMap<>();
        for (Object[] row : wordRepository.countByLevel(rules.code(), includeDrafts)) {
            counts.put((String) row[0], (Long) row[1]);
        }
        List<LevelCountResponse> result = new ArrayList<>();
        for (ProficiencyLevel level :
                levelRepository.findByLanguage_CodeOrderByRankAsc(rules.code())) {
            result.add(
                    new LevelCountResponse(
                            level.getCode(),
                            level.getName(),
                            counts.getOrDefault(level.getCode(), 0L)));
        }
        if (counts.containsKey(null)) {
            result.add(new LevelCountResponse(null, null, counts.get(null)));
        }
        return result;
    }

    public WordDetailResponse getWord(Long id) {
        return wordRepository
                .findById(id)
                .filter(word -> includeDrafts || word.getStatus() == ContentStatus.REVIEWED)
                .map(WordDetailResponse::from)
                .orElseThrow(() -> new NotFoundException("Word not found: " + id));
    }

    private static LanguageRules rules(String language) {
        return LanguageRules.forCode(language == null ? null : language.strip())
                .orElseThrow(() ->
                        new BadRequestException(
                                "lang",
                                "Language must be one of "
                                        + LanguageRules.ALL.keySet().stream().sorted().toList()));
    }

    /** Makes %, _ and \ in user input match literally under {@code LIKE ... ESCAPE '\'}. */
    static String escapeLike(String text) {
        return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
