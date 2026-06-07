package com.diwana.job;

import com.diwana.declaration.DeclarationAttachment;
import com.diwana.declaration.DeclarationAttachmentRepository;
import com.diwana.declaration.DeclarationAttachmentService;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Scheduled job that retries failed VLM imports.
 * Runs every 60 seconds via JobScheduler.
 * Re-imports attachments where:
 *   - vlmStatus = FAILED
 *   - vlmDate is null OR vlmDate is older than 10 minutes
 */
@Component
public class VlmRetryJob extends Job {

    private static final Duration RETRY_COOLDOWN = Duration.ofMinutes(10);

    private final DeclarationAttachmentRepository attachmentRepository;
    private final DeclarationAttachmentService attachmentService;

    public VlmRetryJob(DeclarationAttachmentRepository attachmentRepository,
                       DeclarationAttachmentService attachmentService) {
        this.attachmentRepository = attachmentRepository;
        this.attachmentService = attachmentService;
    }

    @Override
    public String getName() {
        return "vlm-retry";
    }

    @Override
    protected void execute() {
        List<DeclarationAttachment> failed = attachmentRepository.findByVlmStatus(DeclarationAttachment.VlmStatus.FAILED);
        if (failed.isEmpty()) {
            log.debug("[Job][{}] No failed attachments to retry", getName());
            return;
        }

        Instant cutoff = Instant.now().minus(RETRY_COOLDOWN);
        int retried = 0;

        for (DeclarationAttachment att : failed) {
            // Skip if last attempt was less than 10 minutes ago
            if (att.getVlmDate() != null && att.getVlmDate().isAfter(cutoff)) {
                continue;
            }

            Long declarationId = att.getDeclaration().getId();
            log.info("[Job][{}] Retrying VLM import for attachmentId={}, declarationId={}",
                    getName(), att.getId(), declarationId);

            try {
                attachmentService.smartImport(declarationId, att.getId());
                retried++;
            } catch (Exception e) {
                log.error("[Job][{}] Failed to trigger retry for attachmentId={}: {}",
                        getName(), att.getId(), e.getMessage());
            }
        }

        if (retried > 0) {
            log.info("[Job][{}] Retried {} failed attachment(s)", getName(), retried);
        }
    }
}