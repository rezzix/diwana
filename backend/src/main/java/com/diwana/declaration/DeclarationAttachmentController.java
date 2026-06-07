package com.diwana.declaration;

import com.diwana.common.dto.ApiResponse;
import com.diwana.security.AuthHelper;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/declarations/{declarationId}/attachments")
public class DeclarationAttachmentController {

    private final DeclarationAttachmentService attachmentService;
    private final AuthHelper authHelper;

    public DeclarationAttachmentController(DeclarationAttachmentService attachmentService, AuthHelper authHelper) {
        this.attachmentService = attachmentService;
        this.authHelper = authHelper;
    }

    public record AttachmentDto(Long id, String docType, String fileName, String contentType, long fileSize, boolean imported, String vlmText, DeclarationAttachment.VlmStatus vlmStatus, String vlmError, String vlmDate, String createdAt) {}

    @GetMapping
    @PreAuthorize("hasAnyRole('DECLARANT', 'CONTROLLER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AttachmentDto>>> list(@PathVariable Long declarationId) {
        List<AttachmentDto> attachments = attachmentService.getByDeclarationId(declarationId).stream()
                .map(a -> new AttachmentDto(a.getId(), a.getDocType(), a.getFileName(),
                        a.getContentType(), a.getFileSize(), a.isImported(), a.getVlmText(), a.getVlmStatus(), a.getVlmError(),
                        a.getVlmDate() != null ? a.getVlmDate().toString() : null, a.getCreatedAt().toString()))
                .toList();
        return ResponseEntity.ok(ApiResponse.of(attachments));
    }

    @PostMapping
    @PreAuthorize("hasRole('DECLARANT')")
    public ResponseEntity<ApiResponse<AttachmentDto>> upload(
            @PathVariable Long declarationId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("docType") String docType,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long userId = authHelper.getCurrentUserId(currentUser);
        if (docType == null || docType.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.of(null));
        }
        DeclarationAttachment attachment = attachmentService.upload(declarationId, file, docType, userId);

        // Auto-trigger VLM import for importable document types (runs in its own transaction)
        if (attachmentService.isImportableDocType(docType)) {
            attachmentService.smartImport(declarationId, attachment.getId());
            // Re-fetch so the response shows PROCESSING status
            attachment = attachmentService.getById(attachment.getId());
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(
                new AttachmentDto(attachment.getId(), attachment.getDocType(),
                        attachment.getFileName(), attachment.getContentType(),
                        attachment.getFileSize(), attachment.isImported(), attachment.getVlmText(), attachment.getVlmStatus(), attachment.getVlmError(),
                        attachment.getVlmDate() != null ? attachment.getVlmDate().toString() : null, attachment.getCreatedAt().toString())
        ));
    }

    @DeleteMapping("/{attachmentId}")
    @PreAuthorize("hasRole('DECLARANT')")
    public ResponseEntity<Void> delete(@PathVariable Long attachmentId) {
        attachmentService.delete(attachmentId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{attachmentId}")
    @PreAuthorize("hasRole('DECLARANT')")
    public ResponseEntity<ApiResponse<AttachmentDto>> replace(
            @PathVariable Long declarationId,
            @PathVariable Long attachmentId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "docType", required = false) String docType,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long userId = authHelper.getCurrentUserId(currentUser);
        DeclarationAttachment attachment = attachmentService.replace(declarationId, attachmentId, file, docType, userId);

        // Auto-trigger VLM import for importable document types (runs in its own transaction)
        if (attachmentService.isImportableDocType(attachment.getDocType())) {
            attachmentService.smartImport(declarationId, attachment.getId());
            attachment = attachmentService.getById(attachment.getId());
        }

        return ResponseEntity.ok(ApiResponse.of(
                new AttachmentDto(attachment.getId(), attachment.getDocType(),
                        attachment.getFileName(), attachment.getContentType(),
                        attachment.getFileSize(), attachment.isImported(), attachment.getVlmText(), attachment.getVlmStatus(), attachment.getVlmError(),
                        attachment.getVlmDate() != null ? attachment.getVlmDate().toString() : null, attachment.getCreatedAt().toString())
        ));
    }

    @PutMapping("/{attachmentId}/import")
    @PreAuthorize("hasAnyRole('DECLARANT', 'CONTROLLER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AttachmentDto>> markImported(@PathVariable Long attachmentId) {
        DeclarationAttachment attachment = attachmentService.markImported(attachmentId);
        return ResponseEntity.ok(ApiResponse.of(
                new AttachmentDto(attachment.getId(), attachment.getDocType(),
                        attachment.getFileName(), attachment.getContentType(),
                        attachment.getFileSize(), attachment.isImported(), attachment.getVlmText(), attachment.getVlmStatus(), attachment.getVlmError(),
                        attachment.getVlmDate() != null ? attachment.getVlmDate().toString() : null, attachment.getCreatedAt().toString())
        ));
    }

    @PutMapping("/{attachmentId}/smart-import")
    @PreAuthorize("hasAnyRole('DECLARANT', 'CONTROLLER', 'ADMIN')")
    public ResponseEntity<ApiResponse<SmartImportResult>> smartImport(
            @PathVariable Long declarationId,
            @PathVariable Long attachmentId) {
        SmartImportResult result = attachmentService.smartImport(declarationId, attachmentId);
        return ResponseEntity.ok(ApiResponse.of(result));
    }

    @GetMapping("/download/{attachmentId}")
    @PreAuthorize("hasAnyRole('DECLARANT', 'CONTROLLER', 'ADMIN')")
    public ResponseEntity<Resource> download(@PathVariable Long attachmentId) {
        Resource resource = attachmentService.download(attachmentId);
        DeclarationAttachment attachment = attachmentService.getById(attachmentId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(attachment.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + attachment.getFileName() + "\"")
                .body(resource);
    }

    @GetMapping("/view/{attachmentId}")
    @PreAuthorize("hasAnyRole('DECLARANT', 'CONTROLLER', 'ADMIN')")
    public ResponseEntity<Resource> view(@PathVariable Long attachmentId) {
        Resource resource = attachmentService.download(attachmentId);
        DeclarationAttachment attachment = attachmentService.getById(attachmentId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(attachment.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + attachment.getFileName() + "\"")
                .header(HttpHeaders.CACHE_CONTROL, "no-cache")
                .body(resource);
    }
}