package com.learnflow.backend.common.web;

import java.util.List;
import org.springframework.data.domain.Page;

/**
 * The application's own paginated response shape, per {@code plan/phases/00-overview.md} §1.2.
 * Controllers must map Spring's {@link Page} to this record instead of returning {@code Page}
 * directly, so the JSON shape stays stable regardless of Spring Data internals.
 */
public record PageResponse<T>(
        List<T> content, int page, int size, long totalElements, int totalPages) {

    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages());
    }
}
