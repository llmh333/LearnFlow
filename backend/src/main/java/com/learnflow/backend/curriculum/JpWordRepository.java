package com.learnflow.backend.curriculum;

import com.learnflow.backend.curriculum.domain.JpWord;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface JpWordRepository extends JpaRepository<JpWord, Long> {

    /**
     * Dictionary search. {@code query} null = no text filter; it matches a reading prefix, or a
     * substring of the written form or of any Vietnamese/English meaning. Exact reading/written
     * matches come first, then N5 → N1 (unleveled last), then reading. LIKE wildcards in the user
     * input must already be escaped with a backslash. Drafts are hidden unless {@code
     * includeDrafts}.
     */
    @Query(
            value =
                    """
                    SELECT w.* FROM jp_word w
                    WHERE (:includeDrafts OR w.status = 'REVIEWED')
                      AND (CAST(:level AS varchar) IS NULL OR w.jlpt_level = :level)
                      AND (CAST(:query AS varchar) IS NULL
                           OR w.reading LIKE :query || '%' ESCAPE '\\'
                           OR w.written LIKE '%' || :query || '%' ESCAPE '\\'
                           OR array_to_string(w.meanings_vi, '|') ILIKE '%' || :query || '%' ESCAPE '\\'
                           OR array_to_string(w.meanings_en, '|') ILIKE '%' || :query || '%' ESCAPE '\\')
                    ORDER BY (w.reading = :exact OR w.written = :exact) DESC,
                             array_position(ARRAY['N5','N4','N3','N2','N1']::varchar[], w.jlpt_level) NULLS LAST,
                             w.reading, w.id
                    """,
            countQuery =
                    """
                    SELECT count(*) FROM jp_word w
                    WHERE (:includeDrafts OR w.status = 'REVIEWED')
                      AND (CAST(:level AS varchar) IS NULL OR w.jlpt_level = :level)
                      AND (CAST(:query AS varchar) IS NULL
                           OR w.reading LIKE :query || '%' ESCAPE '\\'
                           OR w.written LIKE '%' || :query || '%' ESCAPE '\\'
                           OR array_to_string(w.meanings_vi, '|') ILIKE '%' || :query || '%' ESCAPE '\\'
                           OR array_to_string(w.meanings_en, '|') ILIKE '%' || :query || '%' ESCAPE '\\')
                    """,
            nativeQuery = true)
    Page<JpWord> search(
            boolean includeDrafts, String level, String query, String exact, Pageable pageable);

    /** [jlpt_level (null = unleveled), word count] per level. */
    @Query(
            "select w.jlptLevel, count(w) from JpWord w"
                    + " where :includeDrafts = true or w.status ="
                    + " com.learnflow.backend.curriculum.domain.ContentStatus.REVIEWED"
                    + " group by w.jlptLevel")
    List<Object[]> countByLevel(boolean includeDrafts);
}
