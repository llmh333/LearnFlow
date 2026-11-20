package com.learnflow.backend.curriculum.dto.response;

import com.learnflow.backend.curriculum.domain.Word;
import java.util.List;

/** One row of a dictionary result list. {@code level} (e.g. N5) is null when the word has none. */
public record WordSummaryResponse(
        Long id,
        String written,
        String reading,
        List<String> meaningsVi,
        List<String> partOfSpeech,
        String level) {

    public static WordSummaryResponse from(Word w) {
        return new WordSummaryResponse(
                w.getId(),
                w.getWritten(),
                w.getReading(),
                List.copyOf(w.getMeaningsVi()),
                List.copyOf(w.getPartOfSpeech()),
                w.getLevel() == null ? null : w.getLevel().getCode());
    }
}
