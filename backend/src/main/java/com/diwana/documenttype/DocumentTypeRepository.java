package com.diwana.documenttype;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DocumentTypeRepository extends JpaRepository<DocumentType, Long> {
    List<DocumentType> findAllByActiveTrueOrderByNameAsc();
    List<DocumentType> findAllByOrderByNameAsc();
    Optional<DocumentType> findByCode(String code);
    boolean existsByCode(String code);
}