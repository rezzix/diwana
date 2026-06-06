package com.diwana.hscode;

import com.diwana.common.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/hs-codes")
public class HsCodeController {

    private final HsCodeRepository hsCodeRepository;

    public HsCodeController(HsCodeRepository hsCodeRepository) {
        this.hsCodeRepository = hsCodeRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<HsCodeDto>>> list(
            @RequestParam(required = false) String search) {
        List<HsCode> results;
        if (search != null && !search.isBlank()) {
            Set<HsCode> merged = new LinkedHashSet<>();
            merged.addAll(hsCodeRepository.findByCodeStartingWithOrderByCodeAsc(search));
            merged.addAll(hsCodeRepository.findByDescriptionContainingIgnoreCaseOrderByCodeAsc(search));
            results = merged.stream().sorted((a, b) -> a.getCode().compareTo(b.getCode())).toList();
        } else {
            results = hsCodeRepository.findAllByOrderByCodeAsc();
        }
        List<HsCodeDto> dtos = results.stream().map(this::toDto).toList();
        return ResponseEntity.ok(ApiResponse.of(dtos));
    }

    private HsCodeDto toDto(HsCode hsCode) {
        return new HsCodeDto(hsCode.getId(), hsCode.getCode(), hsCode.getDescription(), hsCode.getChapter());
    }
}