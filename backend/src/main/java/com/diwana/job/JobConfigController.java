package com.diwana.job;

import com.diwana.common.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/jobs")
@PreAuthorize("hasRole('ADMIN')")
public class JobConfigController {

    private final JobConfigRepository configRepository;

    public JobConfigController(JobConfigRepository configRepository) {
        this.configRepository = configRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<JobConfigDto>>> list() {
        List<JobConfigDto> configs = configRepository.findAll().stream()
                .map(JobConfigDto::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.of(configs));
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<JobConfigDto>> toggle(@PathVariable Long id) {
        JobConfig config = configRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job config not found: " + id));
        config.setEnabled(!config.isEnabled());
        config = configRepository.save(config);
        return ResponseEntity.ok(ApiResponse.of(JobConfigDto.from(config)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<JobConfigDto>> update(@PathVariable Long id,
                                                             @RequestBody JobConfigDto request) {
        JobConfig config = configRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job config not found: " + id));
        config.setEnabled(request.enabled());
        config = configRepository.save(config);
        return ResponseEntity.ok(ApiResponse.of(JobConfigDto.from(config)));
    }
}
