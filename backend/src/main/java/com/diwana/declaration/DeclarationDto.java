package com.diwana.declaration;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record DeclarationDto(
        Long id,
        String declarationNumber,
        String status,
        String declarantName,
        String companyName,
        String customsOffice,
        BigDecimal totalDuty,
        BigDecimal totalVat,
        BigDecimal totalValue,
        String notes,
        List<LineItemDto> lineItems,
        String createdAt
) {
    public record CreateRequest(
            @NotBlank @Size(max = 12) String hsCode,
            @NotBlank String description,
            String countryOfOrigin,
            @NotNull @Positive BigDecimal quantity,
            String unit,
            @NotNull @Positive BigDecimal unitPrice,
            @NotNull @Positive BigDecimal totalValue,
            BigDecimal dutyRate,
            BigDecimal vatRate,
            String currency,
            String customsOffice,
            String notes
    ) {}

    public record LineItemDto(
            Long id,
            String hsCode,
            String description,
            String countryOfOrigin,
            BigDecimal quantity,
            String unit,
            BigDecimal unitPrice,
            BigDecimal totalValue,
            BigDecimal dutyRate,
            BigDecimal dutyAmount,
            BigDecimal vatRate,
            BigDecimal vatAmount,
            String currency
    ) {}
}
