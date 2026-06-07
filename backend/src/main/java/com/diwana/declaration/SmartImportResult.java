package com.diwana.declaration;

public record SmartImportResult(
        Long id,
        String docType,
        String fileName,
        boolean imported,
        String vlmText,
        String vlmModel,
        String vlmUrl,
        Long vlmProcessingTimeMs,
        DeclarationAttachment.VlmStatus vlmStatus,
        String vlmError,
        String vlmDate
) {}