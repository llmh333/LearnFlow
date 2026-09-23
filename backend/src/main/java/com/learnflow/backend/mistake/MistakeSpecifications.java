package com.learnflow.backend.mistake;

import com.learnflow.backend.mistake.domain.Mistake;
import java.util.Locale;
import org.springframework.data.jpa.domain.Specification;

final class MistakeSpecifications {

    private MistakeSpecifications() {}

    static Specification<Mistake> hasUserId(Long userId) {
        return (root, query, cb) -> cb.equal(root.get("user").get("id"), userId);
    }

    static Specification<Mistake> hasLanguageCode(String languageCode) {
        return (root, query, cb) ->
                cb.equal(cb.lower(root.get("language").get("code")), languageCode.toLowerCase(Locale.ROOT));
    }

    static Specification<Mistake> hasCategoryName(String categoryName) {
        return (root, query, cb) ->
                cb.equal(cb.lower(root.get("category").get("name")), categoryName.toLowerCase(Locale.ROOT));
    }
}
