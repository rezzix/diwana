package com.diwana.declaration;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeclarationAttachmentRepository extends JpaRepository<DeclarationAttachment, Long> {
    List<DeclarationAttachment> findByDeclarationId(Long declarationId);
    List<DeclarationAttachment> findAllByDeclarationId(Long declarationId);
    void deleteByDeclarationId(Long declarationId);
}
