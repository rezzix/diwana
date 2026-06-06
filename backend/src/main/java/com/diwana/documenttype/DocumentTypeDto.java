package com.diwana.documenttype;

import jakarta.validation.constraints.NotBlank;

public record DocumentTypeDto(
        Long id,
        String code,
        String name,
        String description,
        String mandatoryFor,
        Integer importOrder,
        boolean active,
        String createdAt,
        String updatedAt
) {
    public record CreateRequest(
            @NotBlank String code,
            @NotBlank String name,
            String description,
            String mandatoryFor,
            Integer importOrder
    ) {}

    public record UpdateRequest(
            @NotBlank String code,
            @NotBlank String name,
            String description,
            String mandatoryFor,
            Integer importOrder,
            Boolean active
    ) {}
}