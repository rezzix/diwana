package com.diwana.aimodel;

public record AiModelTestResult(
        Long modelId,
        String provider,
        String model,
        String extractedText,
        long processingTimeMs,
        boolean success,
        String error
) {}