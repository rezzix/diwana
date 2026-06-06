package com.diwana.tariff;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record TariffRateDto(
        Long id, String hsCode, String description,
        BigDecimal dutyRate, BigDecimal vatRate, String unit,
        String originCode, String originName,
        boolean active
) {
    public record CreateRequest(
            String originCode,
            @NotBlank String hsCode,
            @NotBlank String description,
            @NotNull @DecimalMin("0") BigDecimal dutyRate,
            @NotNull @DecimalMin("0") BigDecimal vatRate,
            String unit
    ) {}

    public record UpdateRequest(
            String originCode,
            @NotBlank String hsCode,
            @NotBlank String description,
            @NotNull @DecimalMin("0") BigDecimal dutyRate,
            @NotNull @DecimalMin("0") BigDecimal vatRate,
            String unit,
            Boolean active
    ) {}
}