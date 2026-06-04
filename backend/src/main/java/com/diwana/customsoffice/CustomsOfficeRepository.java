package com.diwana.customsoffice;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomsOfficeRepository extends JpaRepository<CustomsOffice, Long> {
    List<CustomsOffice> findAllByOrderByNameAsc();
}