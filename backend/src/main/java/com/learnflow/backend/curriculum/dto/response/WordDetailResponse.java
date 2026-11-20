package com.learnflow.backend.curriculum.dto.response;

import com.learnflow.backend.curriculum.domain.ExampleSentence;
import com.learnflow.backend.curriculum.domain.Word;
import java.util.List;

/** A dictionary entry with its examples; {@code source} is shown for licence attribution. */
public record WordDetailResponse(
        Long id,
        String written,
        String reading,
        List<String> meaningsVi,
        List<String> meaningsEn,
        List<String> partOfSpeech,
        String level,
        String note,
        List<Example> examples,
        SourceResponse source) {

    public record Example(String text, String reading, String translationVi, String sourceAuthor) {

        static Example from(ExampleSentence s) {
            return new Example(
                    s.getText(), s.getReading(), s.getTranslationVi(), s.getSourceAuthor());
        }
    }

    public static WordDetailResponse from(Word w) {
        return new WordDetailResponse(
                w.getId(),
                w.getWritten(),
                w.getReading(),
                List.copyOf(w.getMeaningsVi()),
                List.copyOf(w.getMeaningsEn()),
                List.copyOf(w.getPartOfSpeech()),
                w.getLevel() == null ? null : w.getLevel().getCode(),
                w.getNote(),
                w.getExamples().stream().map(Example::from).toList(),
                SourceResponse.from(w.getSource()));
    }
}
