package com.diwana.declaration;

import com.diwana.common.exception.VlmException;
import com.diwana.config.OpenAiProperties;
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

    private final OpenAiProperties openAiProperties;
    private final StorageService storageService;
    private final DeclarationAttachmentRepository attachmentRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    private static final int RENDER_DPI = 72;
    private static final int MAX_PAGES = 3;

    /** Inner record pairing base64 image data with its MIME type. */
    private record ImageData(String mimeType, String base64) {}

    private static final String SYSTEM_PROMPT = """
            You are an invoice data extraction assistant. Extract structured data from the invoice document image(s).
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
            """;

    private static final String USER_PROMPT = """
            Extract all data from this invoice. Return the JSON with invoice general info \
            (date, seller, client, country of origin, grand total, tax, currency) and line items \
            (each with HS code if visible, description, quantity, unit, unit price, total value, currency, country of origin).
            """;

    public VlmService(OpenAiProperties openAiProperties,
                      StorageService storageService,
                      DeclarationAttachmentRepository attachmentRepository,
                      ObjectMapper objectMapper) {
        this.openAiProperties = openAiProperties;
        this.storageService = storageService;
        this.attachmentRepository = attachmentRepository;
        this.objectMapper = objectMapper;
        RestTemplate template = new RestTemplate();
        template.setRequestFactory(new org.springframework.http.client.SimpleClientHttpRequestFactory() {{
            setConnectTimeout(java.time.Duration.ofSeconds(15));
            setReadTimeout(java.time.Duration.ofMinutes(10));
        }});
        this.restTemplate = template;
    }

    public String extractInvoiceData(Long attachmentId) {
        log.info("[VLM] Starting invoice extraction for attachmentId={}", attachmentId);

        if (openAiProperties.apiKey() == null || openAiProperties.apiKey().isBlank()) {
            throw new VlmException("VLM API key is not configured. Set OPENAI_API_KEY environment variable.");
        }

        DeclarationAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new VlmException("Attachment not found: " + attachmentId));
        log.info("[VLM] Loaded attachment: id={}, fileName={}, contentType={}", attachment.getId(), attachment.getFileName(), attachment.getContentType());

        // Load file bytes
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

        log.info("[VLM] Calling VLM API at {} with model {}...", openAiProperties.baseUrl(), openAiProperties.model());
        long start = System.currentTimeMillis();
        String result = callVlmApi(images);
        long elapsed = System.currentTimeMillis() - start;
        log.info("[VLM] VLM API call completed in {}ms, response length={}", elapsed, result.length());
        return result;
    }

    private List<ImageData> convertToImages(byte[] fileBytes, String contentType) throws IOException {
        List<ImageData> images = new ArrayList<>();

        if (contentType != null && contentType.equals("application/pdf")) {
            // Render PDF pages to PNG
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
            // For PNG/JPEG/GIF: send original bytes directly (no conversion needed)
            // For TIFF/WebP: convert to PNG via ImageIO
            if (contentType.equals("image/png") || contentType.equals("image/jpeg") || contentType.equals("image/gif")) {
                log.info("[VLM] Sending image as-is ({}), {} bytes", contentType, fileBytes.length);
                images.add(new ImageData(contentType, Base64.getEncoder().encodeToString(fileBytes)));
            } else {
                // TIFF, WebP, or other formats: convert to PNG
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

    private String callVlmApi(List<ImageData> images) {
        try {
            log.info("[VLM] Building request payload with {} image(s)...", images.size());
            // Build content array: text prompt + images
            List<Map<String, Object>> content = new ArrayList<>();
            content.add(Map.of("type", "text", "text", USER_PROMPT));
            for (ImageData img : images) {
                content.add(Map.of(
                        "type", "image_url",
                        "image_url", Map.of("url", "data:" + img.mimeType() + ";base64," + img.base64())
                ));
            }

            Map<String, Object> request = Map.of(
                    "model", openAiProperties.model(),
                    "messages", List.of(
                            Map.of("role", "system", "content", SYSTEM_PROMPT),
                            Map.of("role", "user", "content", content)
                    ),
                    "max_tokens", 16384
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(openAiProperties.apiKey());

            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(request), headers);
            log.info("[VLM] Sending request to {}/chat/completions...", openAiProperties.baseUrl());
            ResponseEntity<String> response = restTemplate.exchange(
                    openAiProperties.baseUrl() + "/chat/completions", HttpMethod.POST, entity, String.class);
            log.info("[VLM] Received response: status={}", response.getStatusCode());

            // Parse response
            JsonNode responseJson = objectMapper.readTree(response.getBody());
            JsonNode messageNode = responseJson.path("choices").get(0).path("message");
            String content1 = messageNode.path("content").asText();

            // If content is empty, check reasoning field (some models put the answer there)
            if (content1 == null || content1.isBlank()) {
                String reasoning = messageNode.path("reasoning").asText(null);
                if (reasoning != null && !reasoning.isBlank()) {
                    content1 = reasoning;
                }
            }

            // Strip <think>...</think> tags if present
            content1 = content1.replaceAll("(?s)<think>.*?</think>", "").trim();

            // Strip markdown code fences if present
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

            return content1;
        } catch (Exception e) {
            throw new VlmException("VLM API call failed: " + e.getMessage(), e);
        }
    }
}