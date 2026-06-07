package com.diwana.aimodel;

public record AiModelDto(
        Long id,
        String provider,
        String model,
        String url,
        String apiKey,
        String type,
        boolean active
) {
    public static AiModelDto from(AiModel m) {
        return new AiModelDto(m.getId(), m.getProvider(), m.getModel(),
                m.getUrl(), m.getApiKey(), m.getType(), m.isActive());
    }

    public record CreateRequest(String provider, String model, String url, String apiKey, String type, boolean active) {}
    public record UpdateRequest(String provider, String model, String url, String apiKey, String type, boolean active) {}
}
