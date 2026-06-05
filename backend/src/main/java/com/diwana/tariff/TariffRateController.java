package com.diwana.tariff;

import com.diwana.common.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tariff-rates")
public class TariffRateController {

    private final TariffRateRepository tariffRateRepository;

    public TariffRateController(TariffRateRepository tariffRateRepository) {
        this.tariffRateRepository = tariffRateRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('DECLARANT', 'CONTROLLER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<TariffRateDto>>> list() {
        List<TariffRateDto> rates = tariffRateRepository.findAllByActiveTrueOrderByIdAsc().stream()
                .map(t -> new TariffRateDto(
                        t.getId(), t.getHsCode(), t.getDescription(),
                        t.getDutyRate(), t.getVatRate(), t.getUnit(),
                        t.getOrigin() != null ? t.getOrigin().getCode() : null,
                        t.getOrigin() != null ? t.getOrigin().getName() : null
                ))
                .toList();
        return ResponseEntity.ok(ApiResponse.of(rates));
    }
}