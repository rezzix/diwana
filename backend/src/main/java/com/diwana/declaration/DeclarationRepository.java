package com.diwana.declaration;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DeclarationRepository extends JpaRepository<Declaration, Long> {
    boolean existsByDeclarationNumber(String declarationNumber);
}
