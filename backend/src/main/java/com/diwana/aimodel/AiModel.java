package com.diwana.aimodel;

import jakarta.persistence.*;

@Entity
@Table(name = "ai_model")
public class AiModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String provider;

    @Column(name = "model_name", nullable = false)
    private String model;

    @Column(nullable = false)
    private String url;

    @Column(name = "api_key", nullable = false)
    private String apiKey;

    @Column(nullable = false, length = 10)
    private String type; // "VLM" or "LLM"

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "deployment", length = 20)
    private String deployment; // local, remote, serverless, dedicated

    @Column(name = "call_order")
    private Integer callOrder; // priority order for fallback; null = do not auto-use

    public AiModel() {}

    public AiModel(String provider, String model, String url, String apiKey, String type, boolean active,
                   String deployment, Integer callOrder) {
        this.provider = provider;
        this.model = model;
        this.url = url;
        this.apiKey = apiKey;
        this.type = type;
        this.active = active;
        this.deployment = deployment;
        this.callOrder = callOrder;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public String getDeployment() { return deployment; }
    public void setDeployment(String deployment) { this.deployment = deployment; }
    public Integer getCallOrder() { return callOrder; }
    public void setCallOrder(Integer callOrder) { this.callOrder = callOrder; }
}
