package com.diwana.declaration;

import com.diwana.common.exception.EntityNotFoundException;
import com.diwana.storage.StorageService;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public class DeclarationAttachmentService {

    private final DeclarationAttachmentRepository attachmentRepository;
    private final DeclarationService declarationService;
    private final StorageService storageService;
    private final VlmService vlmService;

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final List<String> ALLOWED_TYPES = List.of(
            "application/pdf", "image/jpeg", "image/png", "image/tiff"
    );

    public DeclarationAttachmentService(DeclarationAttachmentRepository attachmentRepository,
                                         DeclarationService declarationService,
                                         StorageService storageService,
                                         VlmService vlmService) {
        this.attachmentRepository = attachmentRepository;
        this.declarationService = declarationService;
        this.storageService = storageService;
        this.vlmService = vlmService;
    }

    @Transactional(readOnly = true)
    public List<DeclarationAttachment> getByDeclarationId(Long declarationId) {
        return attachmentRepository.findByDeclarationId(declarationId);
    }

    @Transactional
    public DeclarationAttachment upload(Long declarationId, MultipartFile file,
                                         String docType, Long userId) {
        Declaration declaration = declarationService.getById(declarationId);

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds 10MB limit");
        }

        String contentType = file.getContentType();
        if (contentType == null || ALLOWED_TYPES.stream().noneMatch(t -> contentType.startsWith(t.split("/")[0]))
                && !ALLOWED_TYPES.contains(contentType)) {
            // Allow pdf, image/* types
            if (!contentType.startsWith("image/") && !contentType.equals("application/pdf")) {
                throw new IllegalArgumentException("Only PDF and image files (JPEG, PNG, TIFF) are allowed");
            }
        }

        String storedPath;
        try {
            storedPath = storageService.store(file.getBytes(), file.getOriginalFilename(), contentType);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }

        DeclarationAttachment attachment = new DeclarationAttachment();
        attachment.setDeclaration(declaration);
        attachment.setDocType(docType);
        attachment.setFileName(file.getOriginalFilename());
        attachment.setFilePath(storedPath);
        attachment.setContentType(contentType);
        attachment.setFileSize(file.getSize());
        attachment.setUploadedBy(userId);

        return attachmentRepository.save(attachment);
    }

    @Transactional
    public void delete(Long attachmentId) {
        DeclarationAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new EntityNotFoundException("Attachment", attachmentId));
        storageService.delete(attachment.getFilePath());
        attachmentRepository.delete(attachment);
    }

    public Resource download(Long attachmentId) {
        DeclarationAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new EntityNotFoundException("Attachment", attachmentId));
        return storageService.load(attachment.getFilePath());
    }

    public DeclarationAttachment getById(Long id) {
        return attachmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Attachment", id));
    }

    @Transactional
    public DeclarationAttachment replace(Long declarationId, Long attachmentId,
                                         MultipartFile file, String docType, Long userId) {
        Declaration declaration = declarationService.getById(declarationId);
        if (declaration.getStatus() != Declaration.Status.DRAFT) {
            throw new IllegalArgumentException("Can only replace attachments on draft declarations");
        }

        DeclarationAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new EntityNotFoundException("Attachment", attachmentId));

        if (!attachment.getDeclaration().getId().equals(declarationId)) {
            throw new IllegalArgumentException("Attachment does not belong to this declaration");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds 10MB limit");
        }

        String contentType = file.getContentType();
        if (contentType == null || (!contentType.startsWith("image/") && !contentType.equals("application/pdf"))) {
            throw new IllegalArgumentException("Only PDF and image files (JPEG, PNG, TIFF) are allowed");
        }

        // Delete old file from storage
        storageService.delete(attachment.getFilePath());

        // Store new file
        String storedPath;
        try {
            storedPath = storageService.store(file.getBytes(), file.getOriginalFilename(), contentType);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }

        // Update attachment record
        if (docType != null && !docType.isBlank()) {
            attachment.setDocType(docType);
        }
        attachment.setFileName(file.getOriginalFilename());
        attachment.setFilePath(storedPath);
        attachment.setContentType(contentType);
        attachment.setFileSize(file.getSize());
        attachment.setUploadedBy(userId);

        return attachmentRepository.save(attachment);
    }

    @Transactional
    public DeclarationAttachment markImported(Long attachmentId) {
        DeclarationAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new EntityNotFoundException("Attachment", attachmentId));
        attachment.setImported(true);
        return attachmentRepository.save(attachment);
    }

    @Transactional
    public SmartImportResult smartImport(Long declarationId, Long attachmentId) {
        DeclarationAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new EntityNotFoundException("Attachment", attachmentId));

        if (!attachment.getDeclaration().getId().equals(declarationId)) {
            throw new IllegalArgumentException("Attachment does not belong to this declaration");
        }

        // If VLM text already exists, return cached result
        if (attachment.getVlmText() != null && !attachment.getVlmText().isBlank()) {
            return new SmartImportResult(attachment.getId(), attachment.getDocType(),
                    attachment.getFileName(), attachment.isImported(), attachment.getVlmText());
        }

        // Call VLM to extract invoice data
        String vlmText = vlmService.extractInvoiceData(attachmentId);

        // Save result
        attachment.setVlmText(vlmText);
        attachment.setImported(true);
        attachmentRepository.save(attachment);

        return new SmartImportResult(attachment.getId(), attachment.getDocType(),
                attachment.getFileName(), attachment.isImported(), vlmText);
    }
}