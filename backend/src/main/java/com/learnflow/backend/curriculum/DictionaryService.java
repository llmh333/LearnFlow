package com.learnflow.backend.curriculum;

import com.learnflow.backend.common.error.BadRequestException;
import com.learnflow.backend.common.error.NotFoundException;
import com.learnflow.backend.common.web.PageResponse;
import com.learnflow.backend.curriculum.domain.ContentStatus;
import com.learnflow.backend.curriculum.domain.JlptLevel;
import com.learnflow.backend.curriculum.dto.response.LevelCountResponse;
import com.learnflow.backend.curriculum.dto.response.WordDetailResponse;
import com.learnflow.backend.curriculum.dto.response.WordSummaryResponse;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Japanese dictionary over the global {@code jp_word} table: search, browse by JLPT level, and word
 * detail. Draft words (e.g. the AI-translated JLPT lists of V22/V23) are hidden unless {@code
 * app.content.include-drafts}, which is off in prod.
 */
@Service
@Transactional(readOnly = true)
public class DictionaryService {

    static final int MAX_PAGE_SIZE = 50;
    static final int MAX_QUERY_LENGTH = 100;

    private final JpWordRepository wordRepository;
    private final boolean includeDrafts;

    public DictionaryService(JpWordRepository wordRepository, ContentProperties contentProperties) {
        this.wordRepository = wordRepository;
        this.includeDrafts = contentProperties.includeDrafts();
    }

    /**
     * @param query optional text; blank = browse
     * @param level optional {@code N5}…{@code N1}, case-insensitive
     */
    public PageResponse<WordSummaryResponse> search(
            String query, String level, int page, int size) {
        String text = query == null || query.isBlank() ? null : query.strip();
        if (text != null && text.length() > MAX_QUERY_LENGTH) {
            throw new BadRequestException(
                    "q", "Search text must be at most " + MAX_QUERY_LENGTH + " characters");
        }
        JlptLevel jlpt = parseLevel(level);
        PageRequest pageable =
                PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, MAX_PAGE_SIZE));
        return PageResponse.from(
                wordRepository
                        .search(
                                includeDrafts,
                                jlpt == null ? null : jlpt.name(),
                                text == null ? null : escapeLike(text),
                                text,
                                pageable)
                        .map(WordSummaryResponse::from));
    }

    /** Word counts for N5 → N1, every level listed even when empty, then unleveled words if any. */
    public List<LevelCountResponse> countByLevel() {
        Map<JlptLevel, Long> counts = new HashMap<>();
        for (Object[] row : wordRepository.countByLevel(includeDrafts)) {
            counts.put((JlptLevel) row[0], (Long) row[1]);
        }
        List<LevelCountResponse> result = new ArrayList<>();
        for (JlptLevel level :
                List.of(JlptLevel.N5, JlptLevel.N4, JlptLevel.N3, JlptLevel.N2, JlptLevel.N1)) {
            result.add(new LevelCountResponse(level, counts.getOrDefault(level, 0L)));
        }
        if (counts.containsKey(null)) {
            result.add(new LevelCountResponse(null, counts.get(null)));
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

    private static JlptLevel parseLevel(String level) {
        if (level == null || level.isBlank()) {
            return null;
        }
        try {
            return JlptLevel.fromYaml(level.strip());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("level", "Level must be one of N5, N4, N3, N2, N1");
        }
    }

    /** Makes %, _ and \ in user input match literally under {@code LIKE ... ESCAPE '\'}. */
    static String escapeLike(String text) {
        return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
