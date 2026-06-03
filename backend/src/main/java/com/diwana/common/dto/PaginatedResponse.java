package com.diwana.common.dto;

import java.time.Instant;
import java.util.List;

public record PaginatedResponse<T>(List<T> data, PaginationInfo pagination, Instant timestamp) {
    public static <T> PaginatedResponse<T> of(List<T> data, PaginationInfo pagination) {
        return new PaginatedResponse<>(data, pagination, Instant.now());
    }

    public record PaginationInfo(int page, int size, long totalElements, int totalPages) {}
}
