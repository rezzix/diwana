package com.diwana.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "diwana.openai")
public record OpenAiProperties(
        String apiKey,
        String baseUrl,
        String model
) {}