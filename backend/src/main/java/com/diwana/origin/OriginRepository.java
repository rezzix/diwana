package com.diwana.origin;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OriginRepository extends JpaRepository<Origin, Long> {
    List<Origin> findAllByOrderByNameAsc();
}
