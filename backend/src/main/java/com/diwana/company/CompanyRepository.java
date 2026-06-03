package com.diwana.company;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Long> {
    boolean existsByKey(String key);
    boolean existsByName(String name);
    Optional<Company> findByKey(String key);
}
