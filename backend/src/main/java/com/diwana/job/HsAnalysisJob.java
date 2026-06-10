package com.diwana.job;

import com.diwana.declaration.Declaration;
import com.diwana.declaration.DeclarationLineItem;
import com.diwana.declaration.DeclarationRepository;
import com.diwana.declaration.LlmAnalysisService;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Scheduled job that analyzes line items of submitted declarations using LLM.
 * Checks if each line item's declared HS code matches its goods description.
 * Runs every 60 seconds via JobScheduler.
 * Enabled by default — can be toggled via admin panel.
 */
@Component
public class HsAnalysisJob extends Job {

    private final DeclarationRepository declarationRepository;
    private final LlmAnalysisService llmAnalysisService;

    public HsAnalysisJob(DeclarationRepository declarationRepository,
                          LlmAnalysisService llmAnalysisService) {
        this.declarationRepository = declarationRepository;
        this.llmAnalysisService = llmAnalysisService;
    }

    @Override
    public String getName() {
        return "hs-analysis";
    }

    @Override
    protected void execute() {
        List<Declaration> submitted = declarationRepository
                .findByStatusInOrderByCreatedAtAsc(List.of(Declaration.Status.SUBMITTED));

        if (submitted.isEmpty()) {
            log.debug("[Job][{}] No submitted declarations to analyze", getName());
            return;
        }

        int analyzed = llmAnalysisService.analyzeSubmittedDeclarations();
        if (analyzed > 0) {
            log.info("[Job][{}] Analyzed {} line item(s)", getName(), analyzed);
        }
    }
}