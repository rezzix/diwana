package com.diwana.aimodel;

import com.diwana.common.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai-models")
public class AiModelController {

    private final AiModelRepository repository;

    public AiModelController(AiModelRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AiModelDto>>> list() {
        List<AiModelDto> models = repository.findAllByOrderByCallOrderAscNullsLastProviderAsc().stream()
                .map(AiModelDto::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.of(models));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AiModelDto>> get(@PathVariable Long id) {
        AiModel model = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("AI model not found: " + id));
        return ResponseEntity.ok(ApiResponse.of(AiModelDto.from(model)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AiModelDto>> create(@RequestBody AiModelDto.CreateRequest request) {
        AiModel model = new AiModel(request.provider(), request.model(), request.url(),
                request.apiKey(), request.type(), request.active(),
                request.deployment(), request.callOrder());
        model = repository.save(model);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(AiModelDto.from(model)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AiModelDto>> update(@PathVariable Long id,
                                                          @RequestBody AiModelDto.UpdateRequest request) {
        AiModel model = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("AI model not found: " + id));
        model.setProvider(request.provider());
        model.setModel(request.model());
        model.setUrl(request.url());
        model.setApiKey(request.apiKey());
        model.setType(request.type());
        model.setActive(request.active());
        model.setDeployment(request.deployment());
        model.setCallOrder(request.callOrder());
        model = repository.save(model);
        return ResponseEntity.ok(ApiResponse.of(AiModelDto.from(model)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
