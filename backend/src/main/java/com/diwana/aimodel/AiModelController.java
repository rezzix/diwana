package com.diwana.aimodel;

import com.diwana.common.dto.ApiResponse;
import com.diwana.common.exception.VlmException;
import com.diwana.declaration.DeclarationAttachment;
import com.diwana.declaration.DeclarationAttachmentRepository;
import com.diwana.declaration.LineAnalysis;
import com.diwana.declaration.LineAnalysisRepository;
import com.diwana.declaration.VlmService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.io.IOException;

@RestController
@RequestMapping("/api/ai-models")
public class AiModelController {

    private final AiModelRepository repository;
    private final DeclarationAttachmentRepository attachmentRepository;
    private final LineAnalysisRepository lineAnalysisRepository;
    private final VlmService vlmService;

    public AiModelController(AiModelRepository repository,
                             DeclarationAttachmentRepository attachmentRepository,
                             LineAnalysisRepository lineAnalysisRepository,
                             VlmService vlmService) {
        this.repository = repository;
        this.attachmentRepository = attachmentRepository;
        this.lineAnalysisRepository = lineAnalysisRepository;
        this.vlmService = vlmService;
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

    @PostMapping("/{id}/test")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AiModelTestResult>> testModel(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {

        AiModel model = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("AI model not found: " + id));

        if (!"VLM".equals(model.getType())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.of(new AiModelTestResult(model.getId(), model.getProvider(),
                            model.getModel(), null, 0, false, "Not a VLM model")));
        }

        try {
            byte[] fileBytes = file.getBytes();
            String contentType = file.getContentType();
            VlmService.VlmResult result = vlmService.extractInvoiceDataWithModel(fileBytes, contentType, model);

            AiModelTestResult testResult = new AiModelTestResult(
                    model.getId(), model.getProvider(), model.getModel(),
                    result.text(), result.processingTimeMs(), true, null);

            return ResponseEntity.ok(ApiResponse.of(testResult));
        } catch (VlmException e) {
            AiModelTestResult testResult = new AiModelTestResult(
                    model.getId(), model.getProvider(), model.getModel(),
                    null, 0, false, e.getMessage());
            return ResponseEntity.ok(ApiResponse.of(testResult));
        } catch (IOException e) {
            AiModelTestResult testResult = new AiModelTestResult(
                    model.getId(), model.getProvider(), model.getModel(),
                    null, 0, false, "Failed to read file: " + e.getMessage());
            return ResponseEntity.ok(ApiResponse.of(testResult));
        }
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
