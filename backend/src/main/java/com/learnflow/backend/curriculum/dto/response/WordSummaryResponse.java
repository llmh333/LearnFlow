package com.learnflow.backend.curriculum.dto.response;

import com.learnflow.backend.curriculum.domain.JlptLevel;
import com.learnflow.backend.curriculum.domain.JpWord;
import java.util.List;

/** One row of a dictionary result list. {@code jlptLevel} is null when the word has no level. */
public record WordSummaryResponse(
        Long id,
        String written,
        String reading,
        List<String> meaningsVi,
        List<String> partOfSpeech,
        JlptLevel jlptLevel) {

    public static WordSummaryResponse from(JpWord w) {
        return new WordSummaryResponse(
                w.getId(),
                w.getWritten(),
                w.getReading(),
                List.copyOf(w.getMeaningsVi()),
                List.copyOf(w.getPartOfSpeech()),
                w.getJlptLevel());
    }
}
