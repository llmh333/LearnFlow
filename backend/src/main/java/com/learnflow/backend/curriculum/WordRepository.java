package com.learnflow.backend.curriculum;

import com.learnflow.backend.curriculum.domain.Word;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface WordRepository extends JpaRepository<Word, Long> {

    /**
     * Dictionary search within one language. {@code query} null = no text filter; it matches a
     * reading prefix, or a substring of the written form or of any Vietnamese/English meaning.
     * Exact reading/written matches come first, then easiest level first (unleveled last), then
     * reading. LIKE wildcards in the user input must already be escaped with a backslash. Drafts
     * are hidden unless {@code includeDrafts}.
     */
    @Query(
            value =
                    """
                    SELECT w.* FROM word w
                    JOIN language l ON l.id = w.language_id
                    LEFT JOIN proficiency_level p ON p.id = w.level_id
                    WHERE l.code = :language
                      AND (:includeDrafts OR w.status = 'REVIEWED')
                      AND (CAST(:level AS varchar) IS NULL OR p.code = :level)
                      AND (CAST(:query AS varchar) IS NULL
                           OR w.reading LIKE :query || '%' ESCAPE '\\'
                           OR w.written LIKE '%' || :query || '%' ESCAPE '\\'
                           OR array_to_string(w.meanings_vi, '|') ILIKE '%' || :query || '%' ESCAPE '\\'
                           OR array_to_string(w.meanings_en, '|') ILIKE '%' || :query || '%' ESCAPE '\\')
                    ORDER BY (w.reading = :exact OR w.written = :exact) DESC,
                             p.rank NULLS LAST, w.reading, w.id
                    """,
            countQuery =
                    """
                    SELECT count(*) FROM word w
                    JOIN language l ON l.id = w.language_id
                    LEFT JOIN proficiency_level p ON p.id = w.level_id
                    WHERE l.code = :language
                      AND (:includeDrafts OR w.status = 'REVIEWED')
                      AND (CAST(:level AS varchar) IS NULL OR p.code = :level)
                      AND (CAST(:query AS varchar) IS NULL
                           OR w.reading LIKE :query || '%' ESCAPE '\\'
                           OR w.written LIKE '%' || :query || '%' ESCAPE '\\'
                           OR array_to_string(w.meanings_vi, '|') ILIKE '%' || :query || '%' ESCAPE '\\'
                           OR array_to_string(w.meanings_en, '|') ILIKE '%' || :query || '%' ESCAPE '\\')
                    """,
            nativeQuery = true)
    Page<Word> search(
            String language,
            boolean includeDrafts,
            String level,
            String query,
            String exact,
            Pageable pageable);

    /** [level code (null = unleveled), word count] for one language. */
    @Query(
            "select p.code, count(w) from Word w left join w.level p"
                    + " where w.language.code = :language and (:includeDrafts = true or w.status ="
                    + " com.learnflow.backend.curriculum.domain.ContentStatus.REVIEWED)"
                    + " group by p.code")
    List<Object[]> countByLevel(String language, boolean includeDrafts);
}
