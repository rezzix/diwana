package com.diwana.origin;

import com.diwana.common.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/origins")
public class OriginController {

    private final OriginRepository originRepository;

    public OriginController(OriginRepository originRepository) {
        this.originRepository = originRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Origin>>> list() {
        return ResponseEntity.ok(ApiResponse.of(originRepository.findAllByOrderByNameAsc()));
    }
}
