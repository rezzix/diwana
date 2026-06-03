package com.diwana.common.dto;

import java.time.Instant;

public record ApiResponse<T>(T data, Instant timestamp) {
    public static <T> ApiResponse<T> of(T data) {
        return new ApiResponse<>(data, Instant.now());
    }
}
