package com.diwana.company;

import jakarta.validation.constraints.NotBlank;

public record CompanyDto(
        Long id,
        String name,
        String key,
        String description,
        String ice,
        String rc,
        String nif,
        String vatNumber,
        String address,
        String phone,
        String email,
        String bankName,
        String bankIban,
        String bankSwift,
        String customsCode,
        boolean active
) {
    public record UpdateRequest(
            String name,
            String description,
            String ice,
            String rc,
            String nif,
            String vatNumber,
            String address,
            String phone,
            String email,
            String bankName,
            String bankIban,
            String bankSwift,
            String customsCode
    ) {}
}
