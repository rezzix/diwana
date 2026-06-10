package com.diwana.declaration;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "line_analysis")
public class LineAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "line_item_id", nullable = false)
    private DeclarationLineItem lineItem;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private AnalysisResult result;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "llm_model")
    private String llmModel;

    @Column(name = "analyzed_at")
    private Instant analyzedAt;

    @Column(name = "processing_time_ms")
    private Long processingTimeMs;

    public enum AnalysisResult { ALIGNED, MISALIGNED }

    public LineAnalysis() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public DeclarationLineItem getLineItem() { return lineItem; }
    public void setLineItem(DeclarationLineItem lineItem) { this.lineItem = lineItem; }
    public AnalysisResult getResult() { return result; }
    public void setResult(AnalysisResult result) { this.result = result; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    public String getLlmModel() { return llmModel; }
    public void setLlmModel(String llmModel) { this.llmModel = llmModel; }
    public Instant getAnalyzedAt() { return analyzedAt; }
    public void setAnalyzedAt(Instant analyzedAt) { this.analyzedAt = analyzedAt; }
    public Long getProcessingTimeMs() { return processingTimeMs; }
    public void setProcessingTimeMs(Long processingTimeMs) { this.processingTimeMs = processingTimeMs; }
}