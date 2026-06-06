package com.diwana.hscode;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HsCodeRepository extends JpaRepository<HsCode, Long> {
    List<HsCode> findAllByOrderByCodeAsc();
    List<HsCode> findByCodeStartingWithOrderByCodeAsc(String prefix);
    List<HsCode> findByDescriptionContainingIgnoreCaseOrderByCodeAsc(String query);
}