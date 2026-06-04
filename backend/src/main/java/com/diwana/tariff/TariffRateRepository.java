package com.diwana.tariff;

import com.diwana.origin.Origin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TariffRateRepository extends JpaRepository<TariffRate, Long> {
    boolean existsByHsCode(String hsCode);

    // Cascade level 1: same origin + exact HS code
    TariffRate findByOriginAndHsCodeAndActiveTrue(Origin origin, String hsCode);

    // Cascade level 2: same origin + parent HS code (first 4 digits)
    TariffRate findFirstByOriginAndHsCodeStartingWithAndActiveTrue(Origin origin, String hsCodePrefix);

    // Cascade level 3: same origin + no HS code (origin-wide default)
    TariffRate findByOriginAndHsCodeIsNullAndActiveTrue(Origin origin);

    // Cascade level 4: no origin + exact HS code (HS-specific default)
    TariffRate findByOriginIsNullAndHsCodeAndActiveTrue(String hsCode);

    // Cascade level 5: no origin + parent HS code (HS-category default)
    TariffRate findFirstByOriginIsNullAndHsCodeStartingWithAndActiveTrue(String hsCodePrefix);

    // Cascade level 6: no origin + no HS code (global default)
    TariffRate findByOriginIsNullAndHsCodeIsNullAndActiveTrue();

    // Find all by origin (for seeding/admin)
    List<TariffRate> findByOrigin(Origin origin);
}