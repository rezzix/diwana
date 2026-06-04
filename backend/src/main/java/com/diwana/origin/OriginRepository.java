package com.diwana.origin;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OriginRepository extends JpaRepository<Origin, Long> {
    List<Origin> findAllByOrderByNameAsc();
    Optional<Origin> findByName(String name);
}
