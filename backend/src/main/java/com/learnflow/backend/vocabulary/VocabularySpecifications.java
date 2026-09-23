package com.learnflow.backend.vocabulary;

import com.learnflow.backend.vocabulary.domain.Vocabulary;
import com.learnflow.backend.vocabulary.domain.VocabularyTag;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import java.util.Locale;
import org.springframework.data.jpa.domain.Specification;

/** Composable filter predicates for the vocabulary search endpoint, per {@code phase-2-vocabulary.md}. */
final class VocabularySpecifications {

    private VocabularySpecifications() {}

    static Specification<Vocabulary> hasUserId(Long userId) {
        return (root, query, cb) -> cb.equal(root.get("user").get("id"), userId);
    }

    static Specification<Vocabulary> hasLanguageCode(String languageCode) {
        return (root, query, cb) ->
                cb.equal(cb.lower(root.get("language").get("code")), languageCode.toLowerCase(Locale.ROOT));
    }

    static Specification<Vocabulary> wordOrMeaningContains(String search) {
        String pattern = "%" + search.toLowerCase(Locale.ROOT) + "%";
        return (root, query, cb) ->
                cb.or(
                        cb.like(cb.lower(root.get("word")), pattern),
                        cb.like(cb.lower(root.get("meaning")), pattern));
    }

    static Specification<Vocabulary> hasTag(String tagName) {
        return (root, query, cb) -> {
            if (query != null) {
                query.distinct(true);
            }
            Join<Vocabulary, VocabularyTag> tags = root.join("tags", JoinType.INNER);
            return cb.equal(cb.lower(tags.get("name")), tagName.toLowerCase(Locale.ROOT));
        };
    }
}
