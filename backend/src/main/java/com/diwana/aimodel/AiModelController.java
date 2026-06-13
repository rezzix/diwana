package com.diwana.aimodel;

import com.diwana.common.dto.ApiResponse;
import com.diwana.declaration.DeclarationAttachment;
import com.diwana.declaration.DeclarationAttachmentRepository;
import com.diwana.declaration.LineAnalysis;
import com.diwana.declaration.LineAnalysisRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai-models")
public class AiModelController {

    private final AiModelRepository repository;
    private final DeclarationAttachmentRepository attachmentRepository;
    private final LineAnalysisRepository lineAnalysisRepository;

    public AiModelController(AiModelRepository repository,
                             DeclarationAttachmentRepository attachmentRepository,
                             LineAnalysisRepository lineAnalysisRepository) {
        this.repository = repository;
        this.attachmentRepository = attachmentRepository;
        this.lineAnalysisRepository = lineAnalysisRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AiModelDto>>> list() {
        List<AiModelDto> models = repository.findAllOrdered().stream()
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
                request.deployment(), request.callOrder(), request.maxTokens());
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
        model.setMaxTokens(request.maxTokens());
        model = repository.save(model);
        return ResponseEntity.ok(ApiResponse.of(AiModelDto.from(model)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/response-times")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getResponseTimes() {
        // Average VLM processing time per model
        Map<String, Long> vlmTimes = attachmentRepository.findAll().stream()
                .filter(a -> a.getVlmModel() != null && a.getVlmProcessingTimeMs() != null)
                .collect(java.util.stream.Collectors.groupingBy(
                        DeclarationAttachment::getVlmModel,
                        java.util.stream.Collectors.averagingLong(DeclarationAttachment::getVlmProcessingTimeMs)))
                .entrySet().stream()
                .collect(java.util.stream.Collectors.toMap(
                        Map.Entry::getKey,
                        e -> e.getValue().longValue()));

        // Average LLM processing time per model
        Map<String, Long> llmTimes = lineAnalysisRepository.findAll().stream()
                .filter(a -> a.getLlmModel() != null && a.getProcessingTimeMs() != null)
                .collect(java.util.stream.Collectors.groupingBy(
                        LineAnalysis::getLlmModel,
                        java.util.stream.Collectors.averagingLong(LineAnalysis::getProcessingTimeMs)))
                .entrySet().stream()
                .collect(java.util.stream.Collectors.toMap(
                        Map.Entry::getKey,
                        e -> e.getValue().longValue()));

        // Merge: key is "provider/model" to match the model field
        Map<String, Long> merged = new java.util.LinkedHashMap<>(vlmTimes);
        merged.putAll(llmTimes);

        return ResponseEntity.ok(ApiResponse.of(merged));
    }
}
