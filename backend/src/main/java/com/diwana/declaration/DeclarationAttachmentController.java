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

    public record AttachmentDto(Long id, String docType, String fileName, String contentType, long fileSize, String createdAt) {}

    @GetMapping
    @PreAuthorize("hasAnyRole('DECLARANT', 'CONTROLLER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AttachmentDto>>> list(@PathVariable Long declarationId) {
        List<AttachmentDto> attachments = attachmentService.getByDeclarationId(declarationId).stream()
                .map(a -> new AttachmentDto(a.getId(), a.getDocType().name(), a.getFileName(),
                        a.getContentType(), a.getFileSize(), a.getCreatedAt().toString()))
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
        DeclarationAttachment.DocType type;
        try {
            type = DeclarationAttachment.DocType.valueOf(docType);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.of(null));
        }
        DeclarationAttachment attachment = attachmentService.upload(declarationId, file, type, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(
                new AttachmentDto(attachment.getId(), attachment.getDocType().name(),
                        attachment.getFileName(), attachment.getContentType(),
                        attachment.getFileSize(), attachment.getCreatedAt().toString())
        ));
    }

    @DeleteMapping("/{attachmentId}")
    @PreAuthorize("hasRole('DECLARANT')")
    public ResponseEntity<Void> delete(@PathVariable Long attachmentId) {
        attachmentService.delete(attachmentId);
        return ResponseEntity.noContent().build();
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
}
