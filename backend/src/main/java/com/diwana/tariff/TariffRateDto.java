package com.diwana.tariff;

import java.math.BigDecimal;

public record TariffRateDto(
        Long id, String hsCode, String description,
        BigDecimal dutyRate, BigDecimal vatRate, String unit,
        String originCode, String originName
) {}