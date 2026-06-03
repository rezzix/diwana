package com.diwana.tariff;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TariffRateRepository extends JpaRepository<TariffRate, Long> {
    boolean existsByHsCode(String hsCode);
}
