package com.diwana.declaration;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
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
        String rejectionReason,
        String infoRequestNote,
        List<LineItemDto> lineItems,
        String createdAt
) {
    public record LineItemRequest(
            @NotBlank @Pattern(regexp = "^\\d{4}(\\.\\d{2,6})?$", message = "HS code must be 4 digits optionally followed by a dot and 2-6 digits (e.g. 8471.30)") String hsCode,
            @NotBlank String description,
            String countryOfOrigin,
            @NotNull @Positive BigDecimal quantity,
            String unit,
            @NotNull @Positive BigDecimal unitPrice,
            @NotNull @Positive BigDecimal totalValue,
            BigDecimal dutyRate,
            BigDecimal vatRate,
            String currency
    ) {}

    public record CreateRequest(
            @NotNull @Valid List<LineItemRequest> lineItems,
            @NotBlank(message = "Customs office is required") String customsOffice,
            String notes
    ) {}

    public record UpdateRequest(
            @NotNull @Size(min = 1) @Valid List<LineItemRequest> lineItems,
            @NotBlank(message = "Customs office is required") String customsOffice,
            String notes
    ) {}

    public record RejectRequest(
            @NotBlank String reason
    ) {}

    public record InfoRequestRequest(
            @NotBlank String note
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

    public record LineAnalysisDto(
            Long id,
            Long lineItemId,
            String result,
            String comment,
            String llmModel,
            String analyzedAt
    ) {}
}
