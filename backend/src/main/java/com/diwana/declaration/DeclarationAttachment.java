package com.diwana.declaration;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "declaration_attachment")
public class DeclarationAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "declaration_id", nullable = false)
    private Declaration declaration;

    @Column(name = "doc_type", nullable = false, length = 50)
    private String docType;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "file_size", nullable = false)
    private long fileSize;

    @Column(name = "uploaded_by", nullable = false)
    private Long uploadedBy;

    @Column(name = "imported", nullable = false)
    private boolean imported = false;

    @Column(name = "vlm_text", columnDefinition = "TEXT")
    private String vlmText;

    @Column(name = "vlm_model")
    private String vlmModel;

    @Column(name = "vlm_url")
    private String vlmUrl;

    @Column(name = "vlm_processing_time_ms")
    private Long vlmProcessingTimeMs;

    @Enumerated(EnumType.STRING)
    @Column(name = "vlm_status", length = 20)
    private VlmStatus vlmStatus;

    @Column(name = "vlm_error", columnDefinition = "TEXT")
    private String vlmError;

    @Column(name = "vlm_date")
    private Instant vlmDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public DeclarationAttachment() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Declaration getDeclaration() { return declaration; }
    public void setDeclaration(Declaration declaration) { this.declaration = declaration; }
    public String getDocType() { return docType; }
    public void setDocType(String docType) { this.docType = docType; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public long getFileSize() { return fileSize; }
    public void setFileSize(long fileSize) { this.fileSize = fileSize; }
    public Long getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(Long uploadedBy) { this.uploadedBy = uploadedBy; }
    public boolean isImported() { return imported; }
    public void setImported(boolean imported) { this.imported = imported; }
    public String getVlmText() { return vlmText; }
    public void setVlmText(String vlmText) { this.vlmText = vlmText; }
    public String getVlmModel() { return vlmModel; }
    public void setVlmModel(String vlmModel) { this.vlmModel = vlmModel; }
    public String getVlmUrl() { return vlmUrl; }
    public void setVlmUrl(String vlmUrl) { this.vlmUrl = vlmUrl; }
    public Long getVlmProcessingTimeMs() { return vlmProcessingTimeMs; }
    public void setVlmProcessingTimeMs(Long vlmProcessingTimeMs) { this.vlmProcessingTimeMs = vlmProcessingTimeMs; }
    public VlmStatus getVlmStatus() { return vlmStatus; }
    public void setVlmStatus(VlmStatus vlmStatus) { this.vlmStatus = vlmStatus; }
    public String getVlmError() { return vlmError; }
    public void setVlmError(String vlmError) { this.vlmError = vlmError; }
    public Instant getVlmDate() { return vlmDate; }
    public void setVlmDate(Instant vlmDate) { this.vlmDate = vlmDate; }
    public Instant getCreatedAt() { return createdAt; }

    public enum VlmStatus {
        PROCESSING, COMPLETED, FAILED
    }
}