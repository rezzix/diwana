package com.diwana.declaration;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "declaration_attachment")
public class DeclarationAttachment {

    public enum DocType { COMMERCIAL_INVOICE, PACKING_LIST, CERTIFICATE_OF_ORIGIN, OTHER }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "declaration_id", nullable = false)
    private Declaration declaration;

    @Enumerated(EnumType.STRING)
    @Column(name = "doc_type", nullable = false)
    private DocType docType;

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

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public DeclarationAttachment() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Declaration getDeclaration() { return declaration; }
    public void setDeclaration(Declaration declaration) { this.declaration = declaration; }
    public DocType getDocType() { return docType; }
    public void setDocType(DocType docType) { this.docType = docType; }
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
    public Instant getCreatedAt() { return createdAt; }
}
