package com.diwana.aimodel;

public record AiModelDto(
        Long id,
        String provider,
        String model,
        String url,
        String apiKey,
        String type,
        boolean active,
        String deployment,
        Integer callOrder
) {
    public static AiModelDto from(AiModel m) {
        return new AiModelDto(m.getId(), m.getProvider(), m.getModel(),
                m.getUrl(), m.getApiKey(), m.getType(), m.isActive(),
                m.getDeployment(), m.getCallOrder());
    }

    public record CreateRequest(String provider, String model, String url, String apiKey, String type, boolean active,
                                String deployment, Integer callOrder) {}
    public record UpdateRequest(String provider, String model, String url, String apiKey, String type, boolean active,
                                String deployment, Integer callOrder) {}
}
