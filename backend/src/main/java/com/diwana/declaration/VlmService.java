package com.diwana.declaration;

import com.diwana.aimodel.AiModel;
import com.diwana.aimodel.AiModelRepository;
import com.diwana.common.exception.VlmException;
import com.diwana.storage.StorageService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.rendering.ImageType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
public class VlmService {

    private static final Logger log = LoggerFactory.getLogger(VlmService.class);

    private final StorageService storageService;
    private final DeclarationAttachmentRepository attachmentRepository;
    private final AiModelRepository aiModelRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    private static final int RENDER_DPI = 72;
    private static final int MAX_PAGES = 3;

    /** Inner record pairing base64 image data with its MIME type. */
    private record ImageData(String mimeType, String base64) {}

    /** Result of a VLM extraction call. */
    public record VlmResult(String text, String model, String url, long processingTimeMs) {}

    private static final String SYSTEM_PROMPT = """
            You are an invoice data extraction assistant. Extract structured data from the invoice document image(s).
            DO NOT include any thinking, reasoning, explanation, or commentary. Output ONLY the raw JSON object, nothing else.
            Return ONLY a JSON object (no markdown fences, no commentary) with this exact schema:
            {
              "invoice": {
                "date": "YYYY-MM-DD or null",
                "seller": "seller name or null",
                "client": "client name or null",
                "countryOfOrigin": "ISO 3166-1 alpha-2 country code or null",
                "grandTotal": "decimal string or null",
                "tax": "decimal string or null",
                "currency": "3-letter currency code or null"
              },
              "lineItems": [
                {
                  "hsCode": "HS code string or null",
                  "description": "item description",
                  "quantity": "decimal string or null",
                  "unit": "unit of measure or null",
                  "unitPrice": "decimal string or null",
                  "totalValue": "decimal string or null",
                  "currency": "3-letter currency code or null",
                  "countryOfOrigin": "ISO country code or null"
                }
              ]
            }
            If a field is not found in the document, use null. Do not invent values.
            For countryOfOrigin, use the ISO 3166-1 alpha-2 code (e.g. "CN" for China, "FR" for France).

            IMPORTANT about hsCode: The Harmonized System (HS) code is a numeric code that classifies goods for customs.
            It is a 4-to-10 digit number, optionally with dots (e.g. "8471", "8471.30", "847130").
            It may appear in a dedicated column labeled "HS", "Tariff", "Code", "N°" or similar.
            But it can also appear anywhere in the line item text — embedded in the description, as a separate word, or handwritten.
            Look carefully at EVERY part of each line item for numbers matching this pattern.
            When you find one, put ONLY the numeric code (with dots if present) in hsCode, and DO NOT include it in the description.
            Common mistakes to avoid: do not put prices, quantities, or totals in hsCode; do not leave hsCode null if a code is visible anywhere in the line.
            """;

    private static final String USER_PROMPT = """
            Extract all data from this invoice. Return the JSON with invoice general info \
            (date, seller, client, country of origin, grand total, tax, currency) and line items \
            (each with HS code if visible, description, quantity, unit, unit price, total value, currency, country of origin).
            """;

    public VlmService(StorageService storageService,
                      DeclarationAttachmentRepository attachmentRepository,
                      AiModelRepository aiModelRepository,
                      ObjectMapper objectMapper) {
        this.storageService = storageService;
        this.attachmentRepository = attachmentRepository;
        this.aiModelRepository = aiModelRepository;
        this.objectMapper = objectMapper;
        RestTemplate template = new RestTemplate();
        template.setRequestFactory(new org.springframework.http.client.SimpleClientHttpRequestFactory() {{
            setConnectTimeout(java.time.Duration.ofSeconds(15));
            setReadTimeout(java.time.Duration.ofMinutes(10));
        }});
        this.restTemplate = template;
    }

    public VlmResult extractInvoiceData(Long attachmentId) {
        log.info("[VLM] Starting invoice extraction for attachmentId={}", attachmentId);

        DeclarationAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new VlmException("Attachment not found: " + attachmentId));
        log.info("[VLM] Loaded attachment: id={}, fileName={}, contentType={}", attachment.getId(), attachment.getFileName(), attachment.getContentType());

        // Load file bytes and convert to images (shared across all model attempts)
        List<ImageData> images;
        try {
            Resource resource = storageService.load(attachment.getFilePath());
            byte[] fileBytes;
            try (InputStream is = resource.getInputStream()) {
                fileBytes = is.readAllBytes();
            }
            log.info("[VLM] Read {} bytes from storage, converting to images...", fileBytes.length);
            images = convertToImages(fileBytes, attachment.getContentType());
            log.info("[VLM] Converted to {} image(s)", images.size());
        } catch (IOException e) {
            throw new VlmException("Failed to read attachment file: " + e.getMessage(), e);
        }

        if (images.isEmpty()) {
            throw new VlmException("Could not extract any images from the document");
        }

        // Try active VLM models by callOrder priority, falling back to next on error
        List<AiModel> models = aiModelRepository
                .findByActiveTrueAndTypeAndCallOrderIsNotNullOrderByCallOrderAsc("VLM");

        if (models.isEmpty()) {
            // No models with callOrder — try all active VLM models
            models = aiModelRepository.findAll().stream()
                    .filter(m -> "VLM".equals(m.getType()) && m.isActive())
                    .collect(java.util.stream.Collectors.toList());
            log.warn("[VLM] No VLM models with callOrder found. Trying all {} active VLM model(s).", models.size());
        }

        List<Throwable> errors = new ArrayList<>();
        for (AiModel model : models) {
            try {
                String baseUrl = model.getUrl().endsWith("/") ? model.getUrl() : model.getUrl() + "/";
                String url = baseUrl + "chat/completions";
                log.info("[VLM] Trying model={} at provider={} (callOrder={})...", model.getModel(), model.getProvider(), model.getCallOrder());
                long start = System.currentTimeMillis();
                String result = callVlmApi(images, url, model.getModel(), model.getApiKey());
                long elapsed = System.currentTimeMillis() - start;
                log.info("[VLM] Model {} succeeded in {}ms", model.getModel(), elapsed);
                return new VlmResult(result, model.getModel(), url, elapsed);
            } catch (Exception e) {
                log.warn("[VLM] Model {} failed: {}", model.getModel(), e.getMessage());
                errors.add(e);
            }
        }

        // All models failed
        VlmException last = new VlmException("All VLM models failed. Last error: " + errors.get(errors.size() - 1).getMessage());
        errors.forEach(e -> last.addSuppressed(e instanceof Exception ex ? ex : new RuntimeException(e)));
        throw last;
    }

    private List<ImageData> convertToImages(byte[] fileBytes, String contentType) throws IOException {
        List<ImageData> images = new ArrayList<>();

        if (contentType != null && contentType.equals("application/pdf")) {
            try (PDDocument document = Loader.loadPDF(fileBytes)) {
                PDFRenderer renderer = new PDFRenderer(document);
                int pages = Math.min(document.getNumberOfPages(), MAX_PAGES);
                log.info("[VLM] PDF has {} pages, rendering {} at {} DPI", document.getNumberOfPages(), pages, RENDER_DPI);
                for (int page = 0; page < pages; page++) {
                    BufferedImage image = renderer.renderImageWithDPI(page, RENDER_DPI, ImageType.RGB);
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    ImageIO.write(image, "png", baos);
                    images.add(new ImageData("image/png", Base64.getEncoder().encodeToString(baos.toByteArray())));
                }
                log.info("[VLM] Rendered {} PDF page(s) to images", images.size());
            }
        } else if (contentType != null && contentType.startsWith("image/")) {
            if (contentType.equals("image/png") || contentType.equals("image/jpeg") || contentType.equals("image/gif")) {
                log.info("[VLM] Sending image as-is ({}), {} bytes", contentType, fileBytes.length);
                images.add(new ImageData(contentType, Base64.getEncoder().encodeToString(fileBytes)));
            } else {
                log.info("[VLM] Converting {} image to PNG, {} bytes", contentType, fileBytes.length);
                BufferedImage image = ImageIO.read(new ByteArrayInputStream(fileBytes));
                if (image == null) {
                    throw new VlmException("Unsupported image format: " + contentType);
                }
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                ImageIO.write(image, "png", baos);
                images.add(new ImageData("image/png", Base64.getEncoder().encodeToString(baos.toByteArray())));
            }
        } else {
            throw new VlmException("Unsupported content type for VLM extraction: " + contentType);
        }

        return images;
    }

    private String callVlmApi(List<ImageData> images, String url, String model, String apiKey) {
        try {
            log.info("[VLM] Building request payload with {} image(s), model={}...", images.size(), model);
            List<Map<String, Object>> content = new ArrayList<>();
            content.add(Map.of("type", "text", "text", USER_PROMPT));
            for (ImageData img : images) {
                content.add(Map.of(
                        "type", "image_url",
                        "image_url", Map.of("url", "data:" + img.mimeType() + ";base64," + img.base64())
                ));
            }

            Map<String, Object> request = Map.of(
                    "model", model,
                    "messages", List.of(
                            Map.of("role", "system", "content", SYSTEM_PROMPT),
                            Map.of("role", "user", "content", content)
                    ),
                    "max_tokens", 4096
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            String requestBody = objectMapper.writeValueAsString(request);
            log.info("[VLM] Request body size: {} bytes", requestBody.length());
            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);
            log.info("[VLM] Sending POST request to {}...", url);
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, String.class);
            log.info("[VLM] Received response: status={}, body length={}", response.getStatusCode(), response.getBody() != null ? response.getBody().length() : 0);

            JsonNode responseJson = objectMapper.readTree(response.getBody());
            log.info("[VLM] Response model: {}, usage: {}",
                responseJson.path("model").asText("?"),
                responseJson.has("usage") ? responseJson.get("usage") : "?");

            JsonNode messageNode = responseJson.path("choices").get(0).path("message");
            String content1 = messageNode.path("content").asText();

            if (content1 == null || content1.isBlank()) {
                String reasoning = messageNode.path("reasoning").asText(null);
                if (reasoning != null && !reasoning.isBlank()) {
                    log.info("[VLM] Content was empty, using reasoning field (length={})", reasoning.length());
                    content1 = reasoning;
                }
            }

            content1 = content1.replaceAll("(?s)<think>.*?</think>", "").trim();

            content1 = content1.trim();
            if (content1.startsWith("```json")) {
                content1 = content1.substring(7);
            } else if (content1.startsWith("```")) {
                content1 = content1.substring(3);
            }
            if (content1.endsWith("```")) {
                content1 = content1.substring(0, content1.length() - 3);
            }
            content1 = content1.trim();

            // Strip any thinking/reasoning text before the JSON object
            int jsonStart = content1.indexOf('{');
            if (jsonStart > 0) {
                content1 = content1.substring(jsonStart);
            }

            return content1;
        } catch (Exception e) {
            log.error("[VLM] API call failed: {}", e.getMessage(), e);
            throw new VlmException("VLM API call failed: " + e.getMessage(), e);
        }
    }
}
