package com.diwana.tariff;

import com.diwana.common.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/tariff-rates")
public class TariffRateController {

    private final TariffRateService tariffRateService;

    public TariffRateController(TariffRateService tariffRateService) {
        this.tariffRateService = tariffRateService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('DECLARANT', 'CONTROLLER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<TariffRateDto>>> list() {
        List<TariffRateDto> rates = tariffRateService.listActive().stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(ApiResponse.of(rates));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<TariffRateDto>>> listAll() {
        List<TariffRateDto> rates = tariffRateService.listAll().stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(ApiResponse.of(rates));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TariffRateDto>> create(@Valid @RequestBody TariffRateDto.CreateRequest request) {
        TariffRate rate = tariffRateService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(toDto(rate)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TariffRateDto>> update(@PathVariable Long id,
                                                              @Valid @RequestBody TariffRateDto.UpdateRequest request) {
        TariffRate rate = tariffRateService.update(id, request);
        return ResponseEntity.ok(ApiResponse.of(toDto(rate)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        tariffRateService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    private TariffRateDto toDto(TariffRate t) {
        return new TariffRateDto(
                t.getId(), t.getHsCode(), t.getDescription(),
                t.getDutyRate(), t.getVatRate(), t.getUnit(),
                t.getOrigin() != null ? t.getOrigin().getCode() : null,
                t.getOrigin() != null ? t.getOrigin().getName() : null,
                t.isActive()
        );
    }
}