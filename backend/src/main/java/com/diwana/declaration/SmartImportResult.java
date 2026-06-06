package com.diwana.declaration;

public record SmartImportResult(
        Long id,
        String docType,
        String fileName,
        boolean imported,
        String vlmText
) {}