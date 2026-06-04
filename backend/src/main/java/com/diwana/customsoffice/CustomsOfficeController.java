package com.diwana.customsoffice;

import com.diwana.common.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/customs-offices")
public class CustomsOfficeController {

    private final CustomsOfficeRepository customsOfficeRepository;

    public CustomsOfficeController(CustomsOfficeRepository customsOfficeRepository) {
        this.customsOfficeRepository = customsOfficeRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CustomsOffice>>> list() {
        return ResponseEntity.ok(ApiResponse.of(customsOfficeRepository.findAllByOrderByNameAsc()));
    }
}