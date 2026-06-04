package com.diwana.customsoffice;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CustomsOfficeRepository extends JpaRepository<CustomsOffice, Long> {
    List<CustomsOffice> findAllByOrderByNameAsc();
    Optional<CustomsOffice> findByCode(String code);
}