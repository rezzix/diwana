package com.diwana.declaration;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LineAnalysisRepository extends JpaRepository<LineAnalysis, Long> {
    List<LineAnalysis> findByLineItemId(Long lineItemId);
    List<LineAnalysis> findByLineItemDeclarationId(Long declarationId);
    void deleteByLineItemId(Long lineItemId);
}