package com.diwana.config;

import com.diwana.aimodel.AiModel;
import com.diwana.aimodel.AiModelRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Loads AI model API keys from a CSV file at startup.
 * The file is at backend/ai-keys.csv with format:
 *   provider;model;apiKey
 *   Together AI;google/gemma-4-31B-it;sk-real-key-here
 *
 * Lookup order:
 * 1. AI_KEYS_PATH environment variable (absolute path)
 * 2. backend/ai-keys.csv relative to working directory (dev mode)
 * 3. config/ai-keys.csv  (Spring Boot convention inside JAR directory)
 *
 * After loading, updates any AiModel records that still have placeholder keys
 * with the real keys from the CSV. This ensures keys work even if the DB
 * was seeded with placeholders on a previous run.
 */
@Component
@Order(100)
public class AiKeyLoader implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AiKeyLoader.class);

    private final AiModelRepository aiModelRepository;
    private final Map<String, String> keyMap = new HashMap<>();

    public AiKeyLoader(AiModelRepository aiModelRepository) {
        this.aiModelRepository = aiModelRepository;
    }

    @Override
    public void run(String... args) {
        load();
        applyToDatabase();
    }

    private void load() {
        Path csvPath = resolvePath();
        if (csvPath == null || !Files.exists(csvPath)) {
            log.info("[AiKeys] No ai-keys.csv found. Using placeholder keys from data seeder.");
            return;
        }
        try {
            List<String> lines = Files.readAllLines(csvPath);
            for (String line : lines) {
                line = line.strip();
                if (line.isBlank() || line.startsWith("#") || line.startsWith("provider")) continue;
                String[] parts = line.split(";", 3);
                if (parts.length < 3) continue;
                String key = parts[0].strip() + "|" + parts[1].strip();
                String value = parts[2].strip();
                keyMap.put(key, value);
            }
            log.info("[AiKeys] Loaded {} key(s) from {}", keyMap.size(), csvPath.toAbsolutePath());
        } catch (IOException e) {
            log.warn("[AiKeys] Failed to read {}: {}", csvPath.toAbsolutePath(), e.getMessage());
        }
    }

    private void applyToDatabase() {
        if (keyMap.isEmpty()) return;

        List<AiModel> models = aiModelRepository.findAll();
        int updated = 0;
        for (AiModel model : models) {
            String realKey = keyMap.get(model.getProvider() + "|" + model.getModel());
            if (realKey != null && !realKey.equals(model.getApiKey())) {
                log.info("[AiKeys] Updating key for {}/{}", model.getProvider(), model.getModel());
                model.setApiKey(realKey);
                aiModelRepository.save(model);
                updated++;
            }
        }
        if (updated > 0) {
            log.info("[AiKeys] Updated {} AiModel record(s) with real keys", updated);
        }
    }

    private Path resolvePath() {
        // 1. Environment variable override
        String envPath = System.getenv("AI_KEYS_PATH");
        if (envPath != null && !envPath.isBlank()) {
            Path p = Path.of(envPath);
            if (Files.exists(p)) return p;
            log.warn("[AiKeys] AI_KEYS_PATH={} set but file not found", envPath);
        }

        // 2. Relative to working directory (dev mode)
        Path devPath = Path.of("backend/ai-keys.csv");
        if (Files.exists(devPath)) return devPath;

        // 3. Spring Boot config/ directory (relative to application directory)
        String userDir = System.getProperty("user.dir");
        if (userDir != null) {
            Path configPath = Path.of(userDir, "config", "ai-keys.csv");
            if (Files.exists(configPath)) return configPath;
        }

        return devPath; // return the dev path so the log shows where we looked
    }

    /** Get API key for a provider+model combo. Returns placeholder if not found. */
    public String getKey(String provider, String model, String placeholder) {
        return keyMap.getOrDefault(provider + "|" + model, placeholder);
    }
}
