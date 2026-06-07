package com.diwana.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Loads AI model API keys from a CSV file at startup.
 * The file is at backend/ai-keys.csv (gitignored) with format:
 *   provider;model;apiKey
 *   Together AI;google/gemma-4-31B-it;sk-real-key-here
 *
 * If the file doesn't exist, models are seeded with placeholder keys.
 */
@Component
public class AiKeyLoader {

    private static final Logger log = LoggerFactory.getLogger(AiKeyLoader.class);
    private static final Path CSV_PATH = Path.of("backend/ai-keys.csv");

    private final Map<String, String> keyMap = new HashMap<>();

    public AiKeyLoader() {
        load();
    }

    private void load() {
        if (!Files.exists(CSV_PATH)) {
            log.info("[AiKeys] No ai-keys.csv found at {}. Using placeholder keys.", CSV_PATH.toAbsolutePath());
            return;
        }
        try {
            List<String> lines = Files.readAllLines(CSV_PATH);
            for (String line : lines) {
                line = line.strip();
                if (line.isBlank() || line.startsWith("#") || line.startsWith("provider")) continue;
                String[] parts = line.split(";", 3);
                if (parts.length < 3) continue;
                String key = parts[0].strip() + "|" + parts[1].strip();
                String value = parts[2].strip();
                keyMap.put(key, value);
            }
            log.info("[AiKeys] Loaded {} key(s) from ai-keys.csv", keyMap.size());
        } catch (IOException e) {
            log.warn("[AiKeys] Failed to read ai-keys.csv: {}", e.getMessage());
        }
    }

    /** Get API key for a provider+model combo. Returns placeholder if not found. */
    public String getKey(String provider, String model, String placeholder) {
        return keyMap.getOrDefault(provider + "|" + model, placeholder);
    }
}
