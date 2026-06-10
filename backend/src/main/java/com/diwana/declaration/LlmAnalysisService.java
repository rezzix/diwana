package com.diwana.declaration;

import com.diwana.aimodel.AiModel;
import com.diwana.aimodel.AiModelRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class LlmAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(LlmAnalysisService.class);

    private final AiModelRepository aiModelRepository;
    private final LineAnalysisRepository lineAnalysisRepository;
    private final DeclarationRepository declarationRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    private static final String SYSTEM_PROMPT = """
            You are a customs HS code classification expert. Your task is to determine if a declared HS code
            correctly matches the goods description.

            You will be given:
            - A goods description
            - A declared HS code

            Determine if the HS code correctly classifies the described goods according to the Harmonized System.

            Reply ONLY with a JSON object, no markdown fences, no commentary:
            {"result": "ALIGNED" or "MISALIGNED", "comment": "brief explanation of why the code matches or does not match"}

            Be strict: if the description clearly does not match the HS code category, answer MISALIGNED.
            If the code is a reasonable classification for the described goods, answer ALIGNED.
            Common HS code categories:
            - 01-05: Live animals, meat, dairy
            - 06-14: Vegetable products
            - 25-27: Mineral products
            - 28-38: Chemicals
            - 39-40: Plastics and rubber
            - 41-43: Leather
            - 44-46: Wood and wood products
            - 47-49: Pulp, paper
            - 50-63: Textiles and clothing
            - 64-67: Footwear, headgear
            - 68-71: Stone, glass, precious stones
            - 72-83: Metals
            - 84-85: Machinery and electronics
            - 86-89: Transport equipment
            - 90-97: Instruments, arts, misc
            """;

    public LlmAnalysisService(AiModelRepository aiModelRepository,
                               LineAnalysisRepository lineAnalysisRepository,
                               DeclarationRepository declarationRepository,
                               ObjectMapper objectMapper) {
        this.aiModelRepository = aiModelRepository;
        this.lineAnalysisRepository = lineAnalysisRepository;
        this.declarationRepository = declarationRepository;
        this.objectMapper = objectMapper;
        RestTemplate template = new RestTemplate();
        ((org.springframework.http.client.SimpleClientHttpRequestFactory) template.getRequestFactory())
                .setConnectTimeout(java.time.Duration.ofSeconds(15));
        ((org.springframework.http.client.SimpleClientHttpRequestFactory) template.getRequestFactory())
                .setReadTimeout(java.time.Duration.ofMinutes(5));
        this.restTemplate = template;
    }

    public record AnalysisResult(LineAnalysis.AnalysisResult result, String comment, String model) {}

    /**
     * Analyze a single line item's HS code against its description using the prioritary LLM.
     */
    public AnalysisResult analyzeLine(String hsCode, String description) {
        List<AiModel> models = aiModelRepository
                .findByActiveTrueAndTypeAndCallOrderIsNotNullOrderByCallOrderAsc("LLM");

        if (models.isEmpty()) {
            // Fallback to all active LLM models
            models = aiModelRepository.findAll().stream()
                    .filter(m -> "LLM".equals(m.getType()) && m.isActive())
                    .toList();
            log.warn("[LLM] No LLM models with callOrder found. Trying all {} active LLM model(s).", models.size());
        }

        if (models.isEmpty()) {
            throw new RuntimeException("No active LLM models available for HS code analysis");
        }

        String userPrompt = "Goods description: " + description + "\nDeclared HS code: " + hsCode +
                "\n\nDetermine if this HS code correctly classifies these goods.";

        List<Throwable> errors = new ArrayList<>();
        for (AiModel model : models) {
            try {
                String baseUrl = model.getUrl().endsWith("/") ? model.getUrl() : model.getUrl() + "/";
                String url = baseUrl + "chat/completions";
                log.info("[LLM] Trying model={} for HS analysis of {}...", model.getModel(), hsCode);

                Map<String, Object> request = Map.of(
                        "model", model.getModel(),
                        "messages", List.of(
                                Map.of("role", "system", "content", SYSTEM_PROMPT),
                                Map.of("role", "user", "content", userPrompt)
                        ),
                        "max_tokens", 512
                );

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.setBearerAuth(model.getApiKey());

                String requestBody = objectMapper.writeValueAsString(request);
                HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);
                ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

                JsonNode responseJson = objectMapper.readTree(response.getBody());
                String content = responseJson.path("choices").get(0).path("message").path("content").asText();

                // Strip thinking/reasoning text before JSON
                content = content.replaceAll("(?s)<tool_call>.*?']", "").trim();
                int jsonStart = content.indexOf('{');
                if (jsonStart > 0) {
                    content = content.substring(jsonStart);
                }
                // Strip markdown fences
                if (content.startsWith("```json")) content = content.substring(7);
                else if (content.startsWith("```")) content = content.substring(3);
                if (content.endsWith("```")) content = content.substring(0, content.length() - 3);
                content = content.trim();

                JsonNode resultJson = objectMapper.readTree(content);
                String resultStr = resultJson.path("result").asText("").toUpperCase();
                String comment = resultJson.path("comment").asText("");

                LineAnalysis.AnalysisResult result;
                try {
                    result = LineAnalysis.AnalysisResult.valueOf(resultStr);
                } catch (IllegalArgumentException e) {
                    log.warn("[LLM] Unexpected result '{}', defaulting to ALIGNED", resultStr);
                    result = LineAnalysis.AnalysisResult.ALIGNED;
                }

                log.info("[LLM] HS {} analysis result: {} ({})", hsCode, result, comment);
                return new AnalysisResult(result, comment, model.getModel());

            } catch (Exception e) {
                log.warn("[LLM] Model {} failed for HS analysis: {}", model.getModel(), e.getMessage());
                errors.add(e);
            }
        }

        throw new RuntimeException("All LLM models failed for HS code analysis. Last error: "
                + errors.get(errors.size() - 1).getMessage());
    }

    /**
     * Analyze all unanalyzed line items of SUBMITTED declarations.
     */
    public int analyzeSubmittedDeclarations() {
        List<Declaration> submitted = declarationRepository.findByStatusInOrderByCreatedAtAsc(
                List.of(Declaration.Status.SUBMITTED));

        int analyzed = 0;
        for (Declaration decl : submitted) {
            for (DeclarationLineItem line : decl.getLineItems()) {
                // Skip if already analyzed
                List<LineAnalysis> existing = lineAnalysisRepository.findByLineItemId(line.getId());
                if (!existing.isEmpty()) continue;

                try {
                    AnalysisResult result = analyzeLine(line.getHsCode(), line.getDescription());
                    LineAnalysis analysis = new LineAnalysis();
                    analysis.setLineItem(line);
                    analysis.setResult(LineAnalysis.AnalysisResult.valueOf(result.result().name()));
                    analysis.setComment(result.comment());
                    analysis.setLlmModel(result.model());
                    analysis.setAnalyzedAt(Instant.now());
                    lineAnalysisRepository.save(analysis);
                    analyzed++;
                } catch (Exception e) {
                    log.error("[LLM] Failed to analyze line item {} (HS {}): {}",
                            line.getId(), line.getHsCode(), e.getMessage());
                }
            }
        }
        return analyzed;
    }
}