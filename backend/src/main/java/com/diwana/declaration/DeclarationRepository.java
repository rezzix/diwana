package com.diwana.declaration;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeclarationRepository extends JpaRepository<Declaration, Long> {
    boolean existsByDeclarationNumber(String declarationNumber);
    List<Declaration> findByDeclarantIdOrderByCreatedAtDesc(Long declarantId);
    List<Declaration> findByStatusInOrderByCreatedAtAsc(Iterable<Declaration.Status> statuses);
    List<Declaration> findByStatusInAndCustomsOfficeOrderByCreatedAtAsc(Iterable<Declaration.Status> statuses, String customsOffice);
}
