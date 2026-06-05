package com.diwana.documenttype;

import com.diwana.common.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/document-types")
public class DocumentTypeController {

    private final DocumentTypeService documentTypeService;

    public DocumentTypeController(DocumentTypeService documentTypeService) {
        this.documentTypeService = documentTypeService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DocumentTypeDto>>> list() {
        List<DocumentTypeDto> dtos = documentTypeService.listActive().stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(ApiResponse.of(dtos));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<DocumentTypeDto>>> listAll() {
        List<DocumentTypeDto> dtos = documentTypeService.listAll().stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(ApiResponse.of(dtos));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DocumentTypeDto>> create(@Valid @RequestBody DocumentTypeDto.CreateRequest request) {
        DocumentType docType = documentTypeService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(toDto(docType)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DocumentTypeDto>> update(@PathVariable Long id,
                                                                 @Valid @RequestBody DocumentTypeDto.UpdateRequest request) {
        DocumentType docType = documentTypeService.update(id, request);
        return ResponseEntity.ok(ApiResponse.of(toDto(docType)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        documentTypeService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private DocumentTypeDto toDto(DocumentType docType) {
        return new DocumentTypeDto(
                docType.getId(),
                docType.getCode(),
                docType.getName(),
                docType.getDescription(),
                docType.getMandatoryFor(),
                docType.isActive(),
                docType.getCreatedAt() != null ? docType.getCreatedAt().toString() : null,
                docType.getUpdatedAt() != null ? docType.getUpdatedAt().toString() : null
        );
    }
}