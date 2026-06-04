package com.diwana.declaration;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeclarationAuditLogRepository extends JpaRepository<DeclarationAuditLog, Long> {
    List<DeclarationAuditLog> findByDeclarationIdOrderByCreatedAtAsc(Long declarationId);
}